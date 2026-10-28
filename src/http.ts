import { createServer, type Server } from 'node:http';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { effectiveAllowedHosts, type HttpConfig } from './config.js';

export interface HostedAppOptions {
  config: HttpConfig;
  /**
   * Builds one MCP server for one request. Sessions are not kept, so the
   * server and its transport live only as long as the response.
   */
  createServer: () => McpServer;
  version: string;
  /** Where request lines go. Defaults to stderr. */
  log?: (line: string) => void;
}

export interface HostedApp {
  app: Express;
  /** Closes every transport that is still open. */
  close: () => Promise<void>;
}

const BEARER = /^Bearer\s+(\S+)$/i;

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

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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
 * Requires a DYNO Mapper personal access token on every request.
 *
 * The token is forwarded to the API as-is by the tool handlers; this guard
 * only makes its absence a 401 instead of a tool error.
 */
function authGuard(req: Request, res: Response, next: NextFunction) {
  const header = firstHeader(req.headers.authorization);
  if (!header || !BEARER.test(header.trim())) {
    sendJsonRpcError(
      res,
      401,
      -32001,
      'Unauthorized: send an Authorization header of the form "Bearer <personal access token>"',
      { 'WWW-Authenticate': 'Bearer realm="dynomapper-mcp"' }
    );
    return;
  }

  next();
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
        `[http] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms`
      );
    });
    next();
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

  const app = express();
  app.disable('x-powered-by');

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

  app.use(hostGuard(config, log));

  app.all('/mcp', originGuard(config), authGuard);

  app.post(
    '/mcp',
    rateLimitGuard(config),
    // Before the body is buffered: refusing for capacity after reading a
    // request is the cost this guard exists to avoid.
    concurrencyGuard(config),
    express.json({ limit: config.maxBodyBytes, type: 'application/json' }),
    async (req: Request, res: Response) => {
      const server = createServer();
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
