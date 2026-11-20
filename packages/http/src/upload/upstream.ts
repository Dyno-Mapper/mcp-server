import { randomBytes } from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';
import { once } from 'node:events';

/** The one path the API accepts a file on. */
const UPLOAD_PATH = '/v1/files';

/** Enough for the API's own error and success bodies; nothing it sends is large. */
const MAX_RESPONSE_BYTES = 1024 * 1024;

export interface UploadRequest {
  /** The API's base URL, as configured. */
  baseUrl: string;
  /** The caller's bearer token, taken out of the ticket. */
  token: string;
  purpose: string;
  /** Already normalised by `safeName`; the framing trusts it. */
  name: string;
  mimeType: string;
  /** Disk-backed in the route: `await fs.openAsBlob(spool, { type })`. */
  blob: Blob;
  signal: AbortSignal;
  /** Budget for the whole upstream leg. */
  timeoutMs: number;
  /** Budget for a leg that has transferred nothing at all. */
  idleTimeoutMs: number;
}

export interface UploadResponse {
  status: number;
  contentType: string | undefined;
  body: Buffer;
}

/** A failure with a code the route can turn into a response without guessing. */
export class UpstreamError extends Error {
  constructor(
    readonly code:
      | 'upstream_unreachable'
      | 'upstream_timeout'
      | 'upstream_redirect'
      | 'upstream_response_too_large'
      | 'aborted',
    message: string
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

interface Framing {
  preamble: Buffer;
  fileHead: Buffer;
  epilogue: Buffer;
  /** Bytes of framing, i.e. everything that is not the file itself. */
  overhead: number;
  boundary: string;
}

/**
 * The multipart body, framed by hand.
 *
 * Written rather than delegated because both delegating paths were measured and
 * both buffer: axios' `follow-redirects` transport keeps every request chunk so
 * it can replay a redirect (64.3 MiB retained for a 64 MiB file), and undici's
 * `FormData` pump enqueues without waiting for backpressure (63.7 MiB live).
 * This writer awaits `drain`, which is what keeps the server's own footprint at
 * the size of one chunk.
 *
 * `Content-Length` is computed from the framing and `blob.size`, so the request
 * is never chunked — which is what lets the API apply its own size limit before
 * reading, and what the spike proved the header should be.
 */
export function buildFraming(
  purpose: string,
  name: string,
  mimeType: string,
  size: number,
  boundary: string = randomBytes(16).toString('hex')
): Framing {
  const preamble = Buffer.from(
    `--${boundary}\r\n` +
      'Content-Disposition: form-data; name="purpose"\r\n' +
      '\r\n' +
      `${purpose}\r\n`,
    'utf8'
  );

  const fileHead = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${name}"\r\n` +
      `Content-Type: ${mimeType}\r\n` +
      '\r\n',
    'utf8'
  );

  const epilogue = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');

  return {
    preamble,
    fileHead,
    epilogue,
    overhead: preamble.length + fileHead.length + epilogue.length,
    boundary,
  };
}

/** `https://host/api` + `/v1/files`, joined the way the rest of the client does. */
export function uploadUrl(baseUrl: string): URL {
  return new URL(`${baseUrl.replace(/\/+$/, '')}${UPLOAD_PATH}`);
}

/**
 * Posts one spooled file to the API and returns its answer.
 *
 * The upload leg is native `http`/`https` on purpose — see `buildFraming`. The
 * caller owns the spool file; this function only reads it, through the blob's
 * stream, and never loads it.
 */
export async function postUpload(
  request: UploadRequest
): Promise<UploadResponse> {
  const url = uploadUrl(request.baseUrl);
  const transport = url.protocol === 'https:' ? https : http;
  const framing = buildFraming(
    request.purpose,
    request.name,
    request.mimeType,
    request.blob.size
  );

  const length = framing.overhead + request.blob.size;
  const authorization = request.token.startsWith('Bearer ')
    ? request.token
    : `Bearer ${request.token}`;

  return await new Promise<UploadResponse>((resolve, reject) => {
    let settled = false;
    let idleTimer: NodeJS.Timeout | undefined;
    let totalTimer: NodeJS.Timeout | undefined;

    const fail = (error: UpstreamError) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimers();
      reject(error);
    };

    const clearTimers = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (totalTimer) clearTimeout(totalTimer);
      idleTimer = undefined;
      totalTimer = undefined;
    };

    const touch = () => {
      if (settled) {
        return;
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        req.destroy();
        fail(
          new UpstreamError(
            'upstream_timeout',
            `The API sent and accepted nothing for ${request.idleTimeoutMs} ms`
          )
        );
      }, request.idleTimeoutMs);
    };

    const onAbort = () => {
      req.destroy();
      fail(new UpstreamError('aborted', 'The caller disconnected'));
    };

    const req = transport.request(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: authorization,
          Accept: 'application/json',
          'Content-Type': `multipart/form-data; boundary=${framing.boundary}`,
          'Content-Length': String(length),
        },
      },
      (res) => {
        touch();
        const status = res.statusCode ?? 0;

        if (status >= 300 && status < 400) {
          // Never followed: a redirect here means the configured API origin is
          // not the one that accepts uploads, and following it would resend the
          // whole file — or, as `fetch` does, silently turn the POST into a GET.
          res.resume();
          req.destroy();
          fail(
            new UpstreamError(
              'upstream_redirect',
              `${url.origin} answered ${status} to an upload; check DYNOMAPPER_API_URL`
            )
          );
          return;
        }

        const chunks: Buffer[] = [];
        let received = 0;

        res.on('data', (chunk: Buffer) => {
          touch();
          received += chunk.length;

          if (received > MAX_RESPONSE_BYTES) {
            res.destroy();
            fail(
              new UpstreamError(
                'upstream_response_too_large',
                `The API answered with more than ${MAX_RESPONSE_BYTES} bytes`
              )
            );
            return;
          }

          chunks.push(chunk);
        });

        res.on('end', () => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimers();
          resolve({
            status,
            contentType: res.headers['content-type'],
            body: Buffer.concat(chunks, received),
          });
        });

        res.on('error', (error) => {
          fail(
            new UpstreamError(
              'upstream_unreachable',
              `Reading the API's answer failed: ${error.message}`
            )
          );
        });
      }
    );

    req.on('error', (error: NodeJS.ErrnoException) => {
      fail(
        new UpstreamError(
          'upstream_unreachable',
          `${url.origin} could not be reached: ${error.message}`
        )
      );
    });

    totalTimer = setTimeout(() => {
      req.destroy();
      fail(
        new UpstreamError(
          'upstream_timeout',
          `The upload did not finish inside ${request.timeoutMs} ms`
        )
      );
    }, request.timeoutMs);

    if (request.signal.aborted) {
      onAbort();
      return;
    }

    request.signal.addEventListener('abort', onAbort, { once: true });

    void (async () => {
      try {
        touch();
        await write(req, framing.preamble);
        await write(req, framing.fileHead);

        const body = Readable.fromWeb(
          request.blob.stream() as unknown as Parameters<
            typeof Readable.fromWeb
          >[0]
        );

        for await (const chunk of body) {
          await write(req, chunk as Buffer);
        }

        await write(req, framing.epilogue);
        req.end();
      } catch (error) {
        if (error instanceof UpstreamError) {
          fail(error);
          return;
        }

        req.destroy();
        fail(
          new UpstreamError(
            'upstream_unreachable',
            `Sending the file failed: ${(error as Error).message}`
          )
        );
      } finally {
        request.signal.removeEventListener('abort', onAbort);
      }
    })();
  });
}

/**
 * Writes one chunk, waiting for the socket to drain.
 *
 * This one `await` is the entire difference between a flat footprint and one
 * that grows to the size of the file: without it, `write` returns `false` and
 * the rest of the upload queues in this process.
 */
async function write(
  req: http.ClientRequest,
  chunk: Buffer | Uint8Array
): Promise<void> {
  if (!req.write(chunk)) {
    await once(req, 'drain');
  }
}
