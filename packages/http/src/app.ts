import { createServer, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createWriteStream, openAsBlob } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as pathMod from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { effectiveAllowedHosts, type HttpConfig } from './config.js';
import {
  bearerChallenge,
  bearerToken,
  callerIdentity,
  isExpiredJwt,
} from './bearer.js';
import { firstHeader } from './headers.js';
import {
  METADATA_PATHS,
  protectedResourceMetadata,
  publicOrigin,
} from './protected-resource.js';
import { PURPOSE_MAX_BYTES, openTicket, ticketKey } from './upload/ticket.js';
import {
  UpstreamError,
  postUpload as defaultPostUpload,
} from './upload/upstream.js';

export interface HostedAppOptions {
  config: HttpConfig;
  /**
   * Builds one MCP server for one request. Sessions are not kept, so the
   * server and its transport live only as long as the response.
   *
   * The request is passed because one tool has to describe a URL the caller
   * can reach: only the request knows the name and scheme a proxy presented,
   * and `MCP_PUBLIC_URL` may be unset.
   */
  createServer: (request: Request) => McpServer;
  version: string;
  /** Where request lines go. Defaults to stderr. */
  log?: (line: string) => void;
  /**
   * Where an upload is spooled before it is re-sent. Defaults to the OS temp
   * directory; a test sets it so it can assert the file is gone.
   */
  spoolDir?: string;
  /** Swapped in tests, so the route can be exercised without an API. */
  postUpload?: typeof defaultPostUpload;
}

export interface HostedApp {
  app: Express;
  /** Closes every transport that is still open. */
  close: () => Promise<void>;
}

/** JSON-RPC error body, so a client sees a protocol error rather than HTML. */
function sendJsonRpcError(
  res: Response,
  status: number,
  code: number,
  message: string,
  headers: Record<string, string> = {}
): void {
  res.status(status).set(headers).json({
    jsonrpc: '2.0',
    error: { code, message },
    id: null,
  });
}

/**
 * The caller's address, as far as rate limiting is concerned.
 *
 * Behind CloudFront the peer is an edge location, so the viewer address comes
 * from a header. `CloudFront-Viewer-Address` is overwritten by CloudFront and
 * therefore cannot be forged; `X-Forwarded-For` is only trusted as a fallback,
 * and then only for its last entry, the one CloudFront appended.
 */
function callerIp(req: Request, config: HttpConfig): string {
  if (!config.trustProxy) {
    return req.socket.remoteAddress ?? 'unknown';
  }

  const viewer = firstHeader(req.headers['cloudfront-viewer-address']);
  if (viewer) {
    const bracketed = viewer.match(/^\[[^\]]+\]/);
    if (bracketed) {
      return bracketed[0];
    }
    const separator = viewer.lastIndexOf(':');
    return separator > 0 ? viewer.slice(0, separator) : viewer;
  }

  const forwarded = firstHeader(req.headers['x-forwarded-for']) ?? '';
  const entries = forwarded
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return entries.at(-1) ?? req.socket.remoteAddress ?? 'unknown';
}

/**
 * Rejects a request whose `Host` is not one this server answers for.
 *
 * Only localhost listeners and explicitly configured hostnames are validated:
 * a public deployment states its names in `MCP_ALLOWED_HOSTS` and keeps its
 * bearer token as the real gate.
 */
function hostGuard(config: HttpConfig, log: (line: string) => void) {
  const allowed = effectiveAllowedHosts(config);

  if (allowed.length === 0) {
    log(
      `[http] warning: MCP_ALLOWED_HOSTS is unset while bound to ${config.host}, ` +
        'so the Host header is not validated'
    );
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const hostHeader = req.headers.host;
    if (!hostHeader) {
      sendJsonRpcError(res, 403, -32000, 'Missing Host header');
      return;
    }

    let hostname: string;
    try {
      hostname = new URL(`http://${hostHeader}`).hostname;
    } catch {
      sendJsonRpcError(res, 403, -32000, `Invalid Host header: ${hostHeader}`);
      return;
    }

    if (!allowed.includes(hostname)) {
      sendJsonRpcError(res, 403, -32000, `Invalid Host: ${hostname}`);
      return;
    }

    next();
  };
}

/**
 * Rejects a browser origin that is not on the allowlist.
 *
 * A request without `Origin` is always allowed: hosted agents and command-line
 * clients do not send one, and the bearer token is what protects the endpoint.
 */
function originGuard(config: HttpConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (!origin || config.allowedOrigins.includes(origin)) {
      next();
      return;
    }

    sendJsonRpcError(res, 403, -32000, `Invalid Origin: ${origin}`);
  };
}

/**
 * Requires a DYNO Mapper token on every request.
 *
 * The token is forwarded to the API as-is by the tool handlers, so this guard
 * decides only what must be decided before an API call: a token has to be
 * present, and a visibly expired one is refused here rather than after the body
 * has been buffered. Both answers carry a challenge that names the
 * protected-resource document (RFC 9728 §5.1), which is what tells a client
 * where to obtain a token instead of leaving it to guess `<origin>/register`.
 */
function authGuard(config: HttpConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = publicOrigin(req, config);
    const token = bearerToken(req.headers.authorization);

    if (!token) {
      sendJsonRpcError(
        res,
        401,
        -32001,
        'Unauthorized: send an Authorization header of the form "Bearer <access token>"',
        { 'WWW-Authenticate': bearerChallenge({ origin }) }
      );
      return;
    }

    if (isExpiredJwt(token)) {
      sendJsonRpcError(
        res,
        401,
        -32001,
        'Unauthorized: the access token has expired. Obtain a new one from the ' +
          'authorization server named in the protected-resource metadata, or ' +
          'send a personal access token.',
        {
          'WWW-Authenticate': bearerChallenge({
            origin,
            error: 'invalid_token',
          }),
        }
      );
      return;
    }

    next();
  };
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

/**
 * Per-caller token bucket, refilled continuously.
 *
 * Rejected requests cost a token like any other, so a caller that keeps
 * hammering the endpoint waits longer each time.
 */
function rateLimitGuard(config: HttpConfig) {
  const buckets = new Map<string, Bucket>();
  const perMillisecond = config.rateLimitPerMinute / 60_000;
  const idleLimit = 10 * 60_000;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = callerIp(req, config);
    const now = Date.now();
    const bucket = buckets.get(key) ?? {
      tokens: config.rateLimitBurst,
      updatedAt: now,
    };

    bucket.tokens = Math.min(
      config.rateLimitBurst,
      bucket.tokens + (now - bucket.updatedAt) * perMillisecond
    );
    bucket.updatedAt = now;

    if (bucket.tokens < 1) {
      const waitMilliseconds = (1 - bucket.tokens) / perMillisecond;
      res.set(
        'Retry-After',
        String(Math.max(1, Math.ceil(waitMilliseconds / 1000)))
      );
      sendJsonRpcError(
        res,
        429,
        -32000,
        `Too many requests: the limit is ${config.rateLimitPerMinute} per minute`
      );
      return;
    }

    bucket.tokens -= 1;
    buckets.set(key, bucket);

    if (buckets.size > 5_000) {
      for (const [candidate, entry] of buckets) {
        if (now - entry.updatedAt > idleLimit) {
          buckets.delete(candidate);
        }
      }
    }

    next();
  };
}

/**
 * Caps requests in flight, the one bound a stateless server still needs.
 *
 * Without sessions there is nothing to expire, but a burst of slow upstream
 * calls would still hold as much memory as the responses it buffers.
 */
function concurrencyGuard(config: HttpConfig) {
  let inFlight = 0;

  return (req: Request, res: Response, next: NextFunction) => {
    if (inFlight >= config.maxConcurrency) {
      res.set('Retry-After', '1');
      sendJsonRpcError(
        res,
        503,
        -32000,
        `Server busy: ${config.maxConcurrency} requests are already in flight`
      );
      return;
    }

    inFlight += 1;
    onDone(res, () => {
      inFlight -= 1;
    });

    next();
  };
}

interface UploadSlot {
  inFlight: number;
  updatedAt: number;
}

/**
 * The upload slots, charged explicitly rather than by a body size.
 *
 * An upload no longer arrives as a JSON body — it is PUT to a ticket — so the
 * old heuristic (a declared body over N bytes is probably an upload) has
 * nothing left to recognise. What still needs a bound is the spool: each
 * in-flight upload holds one temp file of up to the largest purpose, so the
 * count is what keeps the disk known.
 *
 * Two limits, one number. Per caller, so one caller cannot occupy every slot;
 * and in total, because the per-caller limit composes badly — ten callers at
 * two slots each is twenty spools, and the operator sized the disk for two.
 * Both are `MCP_MAX_UPLOAD_CONCURRENCY`.
 *
 * The key is `callerIdentity`, which is a token digest or a JWT subject, never
 * an account id: nothing in a request carries one, and resolving it would cost
 * an API call before a byte is read.
 */
function uploadSlots(config: HttpConfig) {
  const slots = new Map<string, UploadSlot>();
  let inFlight = 0;
  const idleLimit = 10 * 60_000;

  const sweep = (now: number) => {
    // A caller that stops calling leaves an empty slot behind; drop those when
    // the map grows, never one that is still holding a request.
    if (slots.size <= 5_000) {
      return;
    }
    for (const [candidate, entry] of slots) {
      if (entry.inFlight === 0 && now - entry.updatedAt > idleLimit) {
        slots.delete(candidate);
      }
    }
  };

  return {
    /**
     * Charges one slot, answering `503` itself when there is none.
     *
     * Returns false when it has already answered, so the caller only has to
     * stop.
     */
    charge(key: string, res: Response): boolean {
      const now = Date.now();
      const slot = slots.get(key) ?? { inFlight: 0, updatedAt: now };
      slot.updatedAt = now;

      if (
        slot.inFlight >= config.maxUploadConcurrency ||
        inFlight >= config.maxUploadConcurrency
      ) {
        // The answer is the route's to write: this route speaks the upload
        // vocabulary, not JSON-RPC, and the client reading it is a plain HTTP
        // caller.
        res.set('Retry-After', '1');
        return false;
      }

      slot.inFlight += 1;
      inFlight += 1;
      slots.set(key, slot);

      onDone(res, () => {
        slot.inFlight = Math.max(0, slot.inFlight - 1);
        slot.updatedAt = Date.now();
        inFlight = Math.max(0, inFlight - 1);
      });

      sweep(now);
      return true;
    },
  };
}

/** Runs `callback` once, when the response finishes or its connection dies. */
function onDone(res: Response, callback: () => void): void {
  let done = false;
  const once = () => {
    if (done) {
      return;
    }
    done = true;
    callback();
  };

  res.once('finish', once);
  res.once('close', once);
}

/**
 * One line per request, never including headers.
 *
 * `Authorization` carries a personal access token, so the log stays on the
 * method, path, status and duration.
 */
function requestLogger(log: (line: string) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    onDone(res, () => {
      log(
        `[http] ${req.method} ${loggedPath(req.path)} ${res.statusCode} ${Date.now() - startedAt}ms`
      );
    });
    next();
  };
}

const UPLOAD_PATH = /^\/upload\/[^/]+$/;

/**
 * The path as the log may carry it.
 *
 * `/upload/<ticket>` is a capability: the sealed ticket contains the caller's
 * token as ciphertext, and a log line is durable. The same reasoning that keeps
 * `Authorization` out of this file applies to a URL that carries it, so the
 * ticket is replaced with the route's own parameter name and the line still
 * says an upload happened and how it ended.
 */
function loggedPath(path: string): string {
  return UPLOAD_PATH.test(path) ? '/upload/:ticket' : path;
}

/** Thrown into the spool pipeline when the bytes pass the purpose's ceiling. */
class UploadTooLarge extends Error {
  constructor() {
    super('The upload is larger than its purpose allows');
    this.name = 'UploadTooLarge';
  }
}

interface UploadRouteDeps {
  config: HttpConfig;
  spoolDir: string;
  postUpload: typeof defaultPostUpload;
  uploads: ReturnType<typeof uploadSlots>;
  log: (line: string) => void;
}

/**
 * `PUT /upload/:ticket` — the byte path.
 *
 * The ticket is the credential: it is sealed, self-authenticating and carries
 * the caller's token, so this route needs no `Authorization` header of its own.
 * That is what makes it usable from an agent sandbox, which has a token for the
 * MCP endpoint but no way to present one on a bare HTTP call.
 *
 * The body is spooled to a temp file as it arrives and then streamed to the
 * API — never buffered. Two bounds apply before a byte is written: the
 * purpose's ceiling from the declared `Content-Length`, and a slot from the
 * shared upload accounting, so the temp disk is bounded by configuration.
 */
function uploadRoute({
  config,
  spoolDir,
  postUpload,
  uploads,
  log,
}: UploadRouteDeps) {
  return async (req: Request, res: Response): Promise<void> => {
    const reply = (status: number, error: string, message: string) => {
      if (res.writableEnded || res.destroyed) {
        return;
      }
      res.status(status).json({ error, message });
    };

    if (config.uploadSecret.length === 0) {
      reply(
        503,
        'upload_ticket_unavailable',
        'Uploads are not configured on this deployment: MCP_UPLOAD_SECRET is unset, so no ticket can be opened.'
      );
      return;
    }

    const opened = openTicket(
      String(req.params.ticket),
      ticketKey(config.uploadSecret)
    );

    if (!opened.ok) {
      reply(
        403,
        opened.error === 'expired'
          ? 'upload_ticket_expired'
          : 'upload_ticket_invalid',
        opened.error === 'expired'
          ? 'This upload URL has expired. Call `create_upload_ticket` again to get a new one.'
          : 'This upload URL is not valid — it may have been truncated, edited or copied incompletely. Call `create_upload_ticket` again to get a new one.'
      );
      return;
    }

    const claims = opened.claims;
    const ceiling = PURPOSE_MAX_BYTES[claims.purpose];
    const declared = Number(req.headers['content-length']);

    if (Number.isFinite(declared) && declared > ceiling) {
      // The client may still be sending; answer, then close rather than absorb
      // a body that has already been refused. Registered first, because
      // `finish` can fire before the next line runs.
      res.once('finish', () => req.destroy());
      reply(
        413,
        'file_too_large',
        `This upload is ${declared} bytes, over the ${ceiling} bytes a \`${claims.purpose}\` file may have. Nothing was read.`
      );
      return;
    }

    if (!uploads.charge(callerIdentity(claims.token), res)) {
      reply(
        503,
        'upload_too_many',
        `Too many uploads in flight: the limit is ${config.maxUploadConcurrency} per caller and across the server. Retry after the upload in flight finishes.`
      );
      return;
    }

    const spool = pathMod.join(spoolDir, `dynomapper-upload-${randomUUID()}`);
    let bytes = 0;
    const controller = new AbortController();
    // `close` fires on a finished response too, so only a connection that went
    // away before the answer counts as a disconnect — otherwise a successful
    // upload would abort its own upstream request.
    const onClose = () => {
      if (!res.writableFinished) {
        controller.abort();
      }
    };

    try {
      const limiter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          bytes += chunk.length;

          if (bytes > ceiling) {
            callback(new UploadTooLarge());
            return;
          }

          callback(null, chunk);
        },
      });

      await pipeline(
        req,
        limiter,
        createWriteStream(spool, { mode: 0o600, flags: 'wx' })
      );

      res.once('close', onClose);

      const answer = await postUpload({
        baseUrl: config.apiBaseUrl,
        token: claims.token,
        purpose: claims.purpose,
        name: claims.name,
        mimeType: claims.mimeType,
        blob: await openAsBlob(spool, { type: claims.mimeType }),
        signal: controller.signal,
        timeoutMs: config.uploadTimeoutMs,
        idleTimeoutMs: config.uploadIdleTimeoutMs,
      });

      log(`[upload] purpose=${claims.purpose} bytes=${bytes} outcome=ok`);

      if (res.writableEnded || res.destroyed) {
        return;
      }

      res.status(answer.status);
      if (answer.contentType) {
        res.set('Content-Type', answer.contentType);
      }
      res.send(answer.body);
    } catch (error) {
      if (error instanceof UploadTooLarge) {
        reply(
          413,
          'file_too_large',
          `The upload passed the ${ceiling} bytes a \`${claims.purpose}\` file may have. Nothing was sent to the API.`
        );
        return;
      }

      if ((error as NodeJS.ErrnoException)?.code === 'ENOSPC') {
        reply(
          507,
          'upload_spool_full',
          `The server ran out of temp space while spooling this upload, in ${spoolDir}. An operator has to enlarge it.`
        );
        return;
      }

      if (error instanceof UpstreamError) {
        if (error.code === 'aborted') {
          // The caller hung up; there is nobody to answer and nothing to log
          // as a failure.
          return;
        }

        reply(
          error.code === 'upstream_timeout' ? 504 : 502,
          error.code,
          error.message
        );
        log(
          `[upload] purpose=${claims.purpose} bytes=${bytes} outcome=error code=${error.code}`
        );
        return;
      }

      if (
        (error as NodeJS.ErrnoException)?.code === 'ERR_STREAM_PREMATURE_CLOSE'
      ) {
        // The client disappeared mid-body; `close` has already fired.
        return;
      }

      reply(
        500,
        'upload_failed',
        `The upload failed: ${(error as Error).message}`
      );
    } finally {
      res.off('close', onClose);
      await unlink(spool).catch(() => {});
    }
  };
}

/**
 * The hosted Streamable HTTP endpoint.
 *
 * Every POST is answered by its own MCP server and transport, closed when the
 * response ends. That is the stateless mode the SDK documents: no session id is
 * minted or validated, so any replica can answer any request.
 */
export function createHostedApp(options: HostedAppOptions): HostedApp {
  const { config, createServer, version } = options;
  const log = options.log ?? ((line: string) => console.error(line));
  const transports = new Set<StreamableHTTPServerTransport>();
  const spoolDir = options.spoolDir ?? tmpdir();
  const postUpload = options.postUpload ?? defaultPostUpload;
  // One instance, so `/mcp` and `/upload` share a budget: a second call to the
  // factory would build a second bucket map, which is a doubled allowance
  // rather than a shared one.
  const rateLimit = rateLimitGuard(config);
  const uploads = uploadSlots(config);

  const app = express();
  app.disable('x-powered-by');

  // A deployment that names its hosts is public, and a public deployment that
  // does not state its origin publishes whatever the forwarded headers happen to
  // say. The documents are still served; they just point at the wrong URL.
  if (config.publicUrl === '' && config.allowedHosts.length > 0) {
    log(
      '[http] warning: MCP_PUBLIC_URL is unset while MCP_ALLOWED_HOSTS names ' +
        'public hosts, so the OAuth metadata URLs are derived from each request'
    );
  }

  app.use(requestLogger(log));

  // Before the Host guard, because a load balancer or Kubernetes probe sends
  // the pod's own address as `Host`, and an allowlisted public name would
  // otherwise fail the check and restart a healthy container. The endpoint
  // reveals only a version and an uptime, and takes no token.
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      name: '@dynomapper/mcp-server',
      version,
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  // RFC 9728. Public by nature — a client reads it before it holds any
  // credential — so the CORS origin is `*`, and it is set ahead of the Host
  // guard so even a rejection here is readable by a browser rather than an
  // opaque CORS failure. Without this document a client that gets a 401 falls
  // back to guessing `<origin>/register` and reports the 404 as a JSON parse
  // error.
  app.use(METADATA_PATHS, (_req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    next();
  });

  // A browser client that reads this document sends `MCP-Protocol-Version`,
  // as RFC 9728 discovery in the MCP SDK does, and a request header outside the
  // CORS safelist makes the browser send a preflight first. Answering that
  // preflight with the 405 below is indistinguishable from a network failure:
  // the `GET` is never sent, the client concludes the document does not exist,
  // and it falls back to treating this origin as its authorization server —
  // the dead end on `<origin>/register` the document exists to prevent. The
  // preflight carries no credential and this document is public, so the
  // requested headers are echoed rather than pinned to a list that a later
  // client would outgrow, and it is answered ahead of the Host guard so a
  // rejected deployment still fails on a readable `403` rather than on CORS.
  app.options(METADATA_PATHS, (req: Request, res: Response) => {
    const requested = firstHeader(
      req.headers['access-control-request-headers']
    );

    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    if (requested) {
      res.set('Access-Control-Allow-Headers', requested);
    }
    res.set('Access-Control-Max-Age', '600');
    res.status(204).end();
  });

  app.use(hostGuard(config, log));

  app.get(METADATA_PATHS, (req: Request, res: Response) => {
    const origin = publicOrigin(req, config);
    if (!origin) {
      sendJsonRpcError(
        res,
        500,
        -32603,
        'Cannot determine the public origin of this endpoint; set MCP_PUBLIC_URL'
      );
      return;
    }

    // Cached briefly: the document changes when a deployment does, not when a
    // request arrives.
    res
      .set('Cache-Control', 'public, max-age=300')
      .json(protectedResourceMetadata(origin, config));
  });

  app.all(METADATA_PATHS, (req: Request, res: Response) => {
    res
      .set('Allow', 'GET')
      .status(405)
      .json({
        error: 'invalid_request',
        error_description: `Protected-resource metadata is read with GET, not ${req.method}.`,
      });
  });

  // The upload route, before the MCP handlers and after the Host guard. It
  // carries no bearer token — the ticket is the credential — and no body
  // parser: the bytes are spooled as they arrive.
  app.put(
    '/upload/:ticket',
    rateLimit,
    uploadRoute({ config, spoolDir, postUpload, uploads, log })
  );

  // Every other method, so a `GET` on an upload URL reads as "this takes PUT"
  // rather than as Express's HTML 404 on a server whose errors are JSON.
  app.all('/upload/:ticket', (req: Request, res: Response) => {
    res
      .set('Allow', 'PUT')
      .status(405)
      .json({
        error: 'invalid_request',
        error_message: `Uploads are sent with PUT, not ${req.method}.`,
      });
  });

  app.all('/mcp', originGuard(config), authGuard(config));

  app.post(
    '/mcp',
    rateLimit,
    // Before the body is buffered: refusing for capacity after reading a
    // request is the cost this exists to avoid.
    concurrencyGuard(config),
    express.json({ limit: config.maxBodyBytes, type: 'application/json' }),
    async (req: Request, res: Response) => {
      const server = createServer(req);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: config.jsonResponses,
      });

      transports.add(transport);
      onDone(res, () => {
        transports.delete(transport);
        void transport.close().catch(() => {});
        void server.close().catch(() => {});
      });

      try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        log(`[http] request failed: ${(error as Error).message}`);
        if (!res.headersSent) {
          sendJsonRpcError(res, 500, -32603, 'Internal server error');
        }
      }
    }
  );

  // Sessions are not kept, so there is no stream to resume and nothing to
  // terminate. Both revisions of the specification allow answering 405.
  app.all('/mcp', (req: Request, res: Response) => {
    sendJsonRpcError(
      res,
      405,
      -32000,
      `Method ${req.method} is not allowed; POST a JSON-RPC message`,
      { Allow: 'POST' }
    );
  });

  // Body-parser failures reach here, and a client that sent malformed JSON
  // needs a JSON-RPC answer, not Express's HTML error page.
  app.use((error: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error?.type === 'entity.too.large') {
      sendJsonRpcError(
        res,
        413,
        -32000,
        `Request body too large: the limit is ${config.maxBodyBytes} bytes`
      );
      return;
    }

    if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
      sendJsonRpcError(res, 400, -32700, 'Parse error: invalid JSON');
      return;
    }

    next(error);
  });

  return {
    app,
    async close() {
      await Promise.allSettled(
        Array.from(transports, (transport) => transport.close())
      );
      transports.clear();
    },
  };
}

/**
 * Starts the hosted endpoint and, by default, drains it on SIGTERM/SIGINT.
 *
 * The drain stops accepting connections, gives in-flight requests a bounded
 * window to finish, then closes whatever transport is left, so a redeploy does
 * not cut a tool call in half.
 */
export async function startHostedServer(
  options: HostedAppOptions & {
    handleSignals?: boolean;
    shutdownTimeoutMs?: number;
  }
): Promise<{ url: string; server: Server; close: () => Promise<void> }> {
  const { config } = options;
  const log = options.log ?? ((line: string) => console.error(line));
  const hosted = createHostedApp(options);
  const server = createServer(hosted.app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, config.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const url = `http://${displayHost(config.host)}:${config.port}/mcp`;
  log(`[http] DYNO Mapper MCP server listening on ${url}`);

  const close = async () => {
    const drained = new Promise<void>((resolve) => {
      server.close(() => resolve());
    });

    server.closeIdleConnections();
    const deadline = setTimeout(
      () => server.closeAllConnections(),
      options.shutdownTimeoutMs ?? 10_000
    );
    deadline.unref();

    await drained;
    clearTimeout(deadline);
    await hosted.close();
  };

  if (options.handleSignals !== false) {
    const shutdown = () => {
      log('[http] shutting down, draining in-flight requests');
      void close().then(() => process.exit(0));
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  }

  return { url, server, close };
}

/** A host a human can paste into a browser or a client config. */
function displayHost(host: string): string {
  if (host === '0.0.0.0' || host === '::') {
    return 'localhost';
  }
  return host.includes(':') ? `[${host}]` : host;
}
