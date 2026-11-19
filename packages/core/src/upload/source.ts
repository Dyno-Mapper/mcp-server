/**
 * Turning a caller's file into the bytes an upload sends.
 *
 * A local path is enough when the server runs on the caller's own machine, and
 * impossible when it does not: a hosted server's filesystem is the pod's, not
 * the caller's. This module is what a hosted server offers instead — base64 the
 * caller sent, and a URL this server fetches — together with the two rules that
 * make either safe: the purpose's size ceiling, and, for a URL, the addresses
 * the server refuses to reach.
 */
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import * as pathMod from 'node:path';
import { type CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export type UploadPurpose =
  | 'project_text'
  | 'project_xml'
  | 'pdf_accessibility'
  | 'sitemap_content_image'
  | 'sitemap_content_file';

const MIB = 1024 * 1024;

/**
 * The reference's size limits, in the bytes they cost.
 *
 * The API enforces these itself and remains the authority; the table exists so
 * an oversized file is refused before it crosses the network, which is the
 * difference between an instant error and an 87 MB upload that comes back
 * `413 file_too_large`. The reference says "64 MB" without saying which MB;
 * the binary reading is assumed, because it is the one that cannot reject a
 * file the API would have accepted.
 */
export const PURPOSE_MAX_BYTES: Record<UploadPurpose, number> = {
  project_text: 64 * MIB,
  project_xml: 64 * MIB,
  sitemap_content_file: 64 * MIB,
  pdf_accessibility: 30 * MIB,
  sitemap_content_image: 10 * MIB,
};

/** The largest file any purpose accepts. */
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(PURPOSE_MAX_BYTES));

/** One file's bytes, named and typed the way the upload part wants them. */
export interface UploadPart {
  bytes: Buffer;
  name: string;
  mimeType: string;
}

export type Resolved =
  | { ok: true; file: UploadPart }
  | { ok: false; result: CallToolResult };

/**
 * A tool-level refusal, in the vocabulary the API itself uses.
 *
 * `error` is the word an agent meets again from the API — `file_too_large`,
 * `invalid_content` — and `message` is the sentence that says what to change.
 */
export function uploadError(error: string, message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error, message }) }],
    isError: true,
  };
}

/** The declared media type as the API reports it: lower-cased, no parameters. */
function normaliseMediaType(mimeType: string): string {
  return (mimeType.split(';')[0] ?? '').trim().toLowerCase();
}

/** The filename with any directory removed, which is what the API keeps. */
function normaliseName(name: string): string {
  const base = pathMod.basename(name.replace(/\\/g, '/'));
  return base.length > 0 ? base : 'upload';
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Takes base64 bytes the caller sent, having checked them against the ceiling.
 *
 * The size is counted from the string itself — `length × 3/4`, minus padding —
 * before any bytes exist. Decoding first and measuring afterwards would
 * allocate exactly the buffer the ceiling is there to avoid, and a caller that
 * sends compressed base64 of a huge file would be served in full before being
 * told no.
 *
 * Whitespace is stripped rather than rejected: every base64 encoder is entitled
 * to wrap its output, and no valid input contains a space.
 */
export function resolveInline(
  content: string,
  name: string,
  mimeType: string,
  purpose: UploadPurpose
): Resolved {
  const compact = content.replace(/\s+/g, '');

  if (compact.length === 0) {
    return {
      ok: false,
      result: uploadError(
        'invalid_content',
        '`content` is empty. Send the file’s bytes as base64, or send a `url` instead.'
      ),
    };
  }

  if (compact.length % 4 !== 0 || !BASE64.test(compact)) {
    return {
      ok: false,
      result: uploadError(
        'invalid_content',
        '`content` is not base64. Send the file’s bytes as standard base64 — A–Z, a–z, 0–9, +, / and up to two trailing = — or send a `url` instead.'
      ),
    };
  }

  const padding = compact.endsWith('==') ? 2 : compact.endsWith('=') ? 1 : 0;
  const size = (compact.length / 4) * 3 - padding;
  const ceiling = PURPOSE_MAX_BYTES[purpose];

  if (size === 0) {
    return {
      ok: false,
      result: uploadError(
        'invalid_content',
        '`content` decodes to nothing. Send a file with at least one byte.'
      ),
    };
  }

  if (size > ceiling) {
    return {
      ok: false,
      result: uploadError(
        'file_too_large',
        `\`content\` decodes to ${size} bytes, over the ${ceiling} bytes a \`${purpose}\` file may have. ` +
          'Send a smaller file, or use a purpose whose limit it fits.'
      ),
    };
  }

  return {
    ok: true,
    file: {
      bytes: Buffer.from(compact, 'base64'),
      name: normaliseName(name),
      mimeType: normaliseMediaType(mimeType),
    },
  };
}

/**
 * Addresses a hosted server will not fetch.
 *
 * A caller-supplied URL is fetched from inside the private network this
 * container runs in, and the caller learns only whether it worked — a key or an
 * error, never the body. That is exactly the shape of a blind SSRF probe, so
 * everything that is not publicly routable is refused: loopback, private,
 * link-local (the cloud metadata endpoint lives at 169.254.169.254), CGNAT,
 * multicast and reserved space, in both families, plus NAT64 and IPv4-mapped
 * IPv6 so an address cannot dodge the check by being spelled the long way.
 */
const BLOCKED_ADDRESSES = new BlockList();

for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  BLOCKED_ADDRESSES.addSubnet(network, prefix, 'ipv4');
}

for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  BLOCKED_ADDRESSES.addSubnet(network, prefix, 'ipv6');
}

const IPV4_MAPPED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

/** Whether an address is one the hosted server refuses to connect to. */
export function isBlockedAddress(address: string): boolean {
  const family = isIP(address);

  if (family === 4) {
    return BLOCKED_ADDRESSES.check(address, 'ipv4');
  }

  if (family === 6) {
    // `::ffff:127.0.0.1` is a private address written in the other family, and
    // a blocklist that only knows the full `::` notation would let it through.
    const mapped = IPV4_MAPPED.exec(address);
    if (mapped) {
      return BLOCKED_ADDRESSES.check(String(mapped[1]), 'ipv4');
    }
    return BLOCKED_ADDRESSES.check(address, 'ipv6');
  }

  // Not an address at all: refuse rather than guess what it might resolve to.
  return true;
}

/**
 * The first address a hostname resolves to that the server will not fetch.
 *
 * A name that resolves to several addresses is refused if any of them is
 * private, because there is no way to know which one the connection would have
 * used. Resolution happens here and again inside `fetch`; the window between
 * them is a DNS rebinding opportunity this check narrows but does not close,
 * which is why the deployed posture is a private subnet with no route out.
 */
export async function firstBlockedAddress(
  hostname: string
): Promise<string | undefined> {
  const bracketed = hostname.startsWith('[') && hostname.endsWith(']');
  const bare = bracketed ? hostname.slice(1, -1) : hostname;

  const addresses = await lookup(bare, { all: true, verbatim: true });

  for (const entry of addresses) {
    if (isBlockedAddress(entry.address)) {
      return entry.address;
    }
  }

  return undefined;
}

/** Where the caller's URL is read from, and how long it may take. */
export interface FetchOptions {
  /** Deadline the whole tool call must finish by, in epoch milliseconds. */
  deadline?: number;
  /** Overrides the response's own `Content-Type`. */
  mimeType?: string;
  /** Overrides the name derived from the URL or `Content-Disposition`. */
  name?: string;
  /**
   * Swapped in tests, alongside `fetch`, because the guard refuses the loopback
   * a test server listens on. Production never passes one.
   */
  addressGuard?: (hostname: string) => Promise<string | undefined>;
  /** Swapped in tests; the global `fetch` otherwise. */
  fetch?: typeof globalThis.fetch;
}

const MAX_REDIRECTS = 3;

/**
 * Fetches a caller-supplied URL, stopping the moment it is too large.
 *
 * The size is counted as the body arrives rather than taken from
 * `Content-Length`, because a response may declare no length and may lie about
 * the one it declares. Reading stops at the first byte over the ceiling, so an
 * endless response costs the ceiling rather than the caller's patience.
 */
export async function resolveUrl(
  url: string,
  purpose: UploadPurpose,
  options: FetchOptions
): Promise<Resolved> {
  const ceiling = PURPOSE_MAX_BYTES[purpose];
  const doFetch = options.fetch ?? globalThis.fetch;
  const guard = options.addressGuard ?? firstBlockedAddress;
  let current: URL;

  try {
    current = new URL(url);
  } catch {
    return {
      ok: false,
      result: uploadError('fetch_failed', `\`url\` is not a URL: ${url}`),
    };
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (current.protocol !== 'http:' && current.protocol !== 'https:') {
      return {
        ok: false,
        result: uploadError(
          'fetch_failed',
          `\`url\` must start with http:// or https://, not ${current.protocol}`
        ),
      };
    }

    let blocked: string | undefined;
    try {
      blocked = await guard(current.hostname);
    } catch {
      return {
        ok: false,
        result: uploadError(
          'fetch_failed',
          `\`url\` could not be resolved: ${current.hostname}`
        ),
      };
    }

    if (blocked) {
      return {
        ok: false,
        result: uploadError(
          'blocked_address',
          `${current.hostname} resolves to ${blocked}, which is not a public address. ` +
            'A hosted server fetches only public URLs; upload the file with `content` instead.'
        ),
      };
    }

    let response: Response;
    try {
      response = await doFetch(current, {
        redirect: 'manual',
        signal: deadlineSignal(options.deadline),
      });
    } catch (error) {
      return { ok: false, result: deadlineFailure(error, current) };
    }

    if (isRedirect(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        return {
          ok: false,
          result: uploadError(
            'fetch_failed',
            `${current.href} answered ${response.status} without a Location header`
          ),
        };
      }

      try {
        current = new URL(location, current);
      } catch {
        return {
          ok: false,
          result: uploadError(
            'fetch_failed',
            `${current.href} redirected to a URL that cannot be parsed: ${location}`
          ),
        };
      }

      continue;
    }

    if (!response.ok) {
      return {
        ok: false,
        result: uploadError(
          'fetch_failed',
          `${current.href} answered ${response.status}. Send a URL that serves the file directly.`
        ),
      };
    }

    const body = await readCapped(response, ceiling, current);

    if (!body.ok) {
      return { ok: false, result: body.result };
    }

    if (body.bytes.length === 0) {
      return {
        ok: false,
        result: uploadError(
          'fetch_failed',
          `${current.href} answered with an empty body. Send a URL that serves the file.`
        ),
      };
    }

    const declaredType = response.headers.get('content-type');
    const mimeType =
      options.mimeType ??
      (declaredType === null ? undefined : declaredType) ??
      'application/octet-stream';

    return {
      ok: true,
      file: {
        bytes: body.bytes,
        name: normaliseName(
          options.name ??
            nameFromDisposition(response.headers.get('content-disposition')) ??
            pathMod.basename(current.pathname)
        ),
        mimeType: normaliseMediaType(mimeType),
      },
    };
  }

  return {
    ok: false,
    result: uploadError(
      'fetch_failed',
      `\`url\` redirected more than ${MAX_REDIRECTS} times. Send the address the file is actually served from.`
    ),
  };
}

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307;
}

/** Aborts the fetch when the call's budget runs out, or immediately if spent. */
function deadlineSignal(deadline: number | undefined): AbortSignal | undefined {
  if (deadline === undefined) {
    return undefined;
  }
  return AbortSignal.timeout(Math.max(1, deadline - Date.now()));
}

function deadlineFailure(error: unknown, url: URL): CallToolResult {
  const name = (error as { name?: string } | null)?.name;

  if (name === 'TimeoutError' || name === 'AbortError') {
    // The same wording the API's own timeout uses: the promise HOSTING.md makes
    // is that a call outliving its budget reads as advice, not as a dead socket.
    return uploadError(
      'Request Timeout',
      `Fetching ${url.origin} did not finish inside the call’s budget. ` +
        'Send a smaller file, a closer host, or the bytes as `content`.'
    );
  }

  return uploadError(
    'fetch_failed',
    `Fetching ${url.href} failed: ${(error as Error)?.message ?? 'unknown error'}`
  );
}

/**
 * Reads a response body, giving up as soon as it passes the ceiling.
 *
 * `Content-Length` is checked first when the server declares one, because that
 * refuses a 64 MB download without reading a byte of it. The running total is
 * what decides, though, since a chunked response carries no length and a
 * declared one can be wrong.
 */
async function readCapped(
  response: Response,
  ceiling: number,
  url: URL
): Promise<
  { ok: true; bytes: Buffer } | { ok: false; result: CallToolResult }
> {
  // Both callers reach this with a size already over the ceiling: one from the
  // declared length, one from the running total, which is a floor rather than
  // the final size of a response that was cut off mid-stream.
  const tooLarge = (size: number) =>
    uploadError(
      'file_too_large',
      `${url.href} serves at least ${size} bytes, over the ${ceiling} bytes this purpose allows. ` +
        'Send a smaller file, or use a purpose whose limit it fits.'
    );

  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > ceiling) {
    return { ok: false, result: tooLarge(declared) };
  }

  const reader = response.body?.getReader();

  if (!reader) {
    return { ok: true, bytes: Buffer.alloc(0) };
  }

  const chunks: Buffer[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    total += value.byteLength;

    if (total > ceiling) {
      await reader.cancel().catch(() => {});
      return { ok: false, result: tooLarge(total) };
    }

    chunks.push(Buffer.from(value));
  }

  return { ok: true, bytes: Buffer.concat(chunks, total) };
}

/** The `filename` of a `Content-Disposition` header, when it carries one. */
function nameFromDisposition(header: string | null): string | undefined {
  if (!header) {
    return undefined;
  }

  const quoted = /filename\*?=(?:UTF-8'')?"([^"]+)"/i.exec(header);
  if (quoted) {
    return quoted[1];
  }

  const bare = /filename\*?=(?:UTF-8'')?([^;]+)/i.exec(header);
  return bare ? bare[1].trim() : undefined;
}
