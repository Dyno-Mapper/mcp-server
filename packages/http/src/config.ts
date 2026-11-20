/**
 * Configuration for the hosted Streamable HTTP transport.
 *
 * Everything here is read from the environment at startup, so a bad value
 * fails loudly before the listener opens rather than on the first request.
 */

export interface HttpConfig {
  /** Port the listener binds. `MCP_PORT`, falling back to `PORT`. */
  port: number;
  /** Interface the listener binds. `MCP_HOST`, falling back to `HOST`. */
  host: string;
  /** Hostnames accepted in the `Host` header. Empty means derive from `host`. */
  allowedHosts: string[];
  /** Origins accepted in the `Origin` header. Empty means do not check it. */
  allowedOrigins: string[];
  /** Trust `CloudFront-Viewer-Address` and `X-Forwarded-For` for the caller IP. */
  trustProxy: boolean;
  /** Sustained per-IP request allowance, in requests per minute. */
  rateLimitPerMinute: number;
  /** Per-IP burst allowance, in requests. */
  rateLimitBurst: number;
  /** Largest accepted `application/json` request body, in bytes. */
  maxBodyBytes: number;
  /**
   * Uploads in flight per caller, and in total, before the endpoint answers 503.
   *
   * One number for both bounds because they are the same question at two
   * scales: how many spool files may this pod hold at once. Per caller, so one
   * caller cannot occupy every slot; in total, so the temp disk has a known
   * ceiling of `maxUploadConcurrency × the largest purpose`.
   */
  maxUploadConcurrency: number;
  /** Requests handled at once before the endpoint answers 503. */
  maxConcurrency: number;
  /** The DYNO Mapper API this server calls, without a trailing slash. */
  apiBaseUrl: string;
  /** Deadline for one DYNO Mapper API call, in milliseconds. */
  requestTimeoutMs: number;
  /**
   * Passphrase the upload ticket is sealed with. Shorter values are warned
   * about at startup; empty means uploads are refused and nothing else changes.
   */
  uploadSecret: string;
  /** How long an upload URL stays valid, in milliseconds. */
  uploadTicketTtlMs: number;
  /** Budget for the whole upstream leg of one upload, in milliseconds. */
  uploadTimeoutMs: number;
  /** Budget for an upstream leg that has transferred nothing, in milliseconds. */
  uploadIdleTimeoutMs: number;
  /** Answer a POST with one `application/json` body instead of an SSE stream. */
  jsonResponses: boolean;
  /**
   * The origin this deployment answers at, without a trailing slash.
   *
   * Empty means every advertised URL is derived from the request instead, which
   * is right for a loopback listener and only as right as the forwarded headers
   * behind a proxy. It is what the protected-resource document calls the
   * resource, and what the `WWW-Authenticate` challenge points at.
   */
  publicUrl: string;
  /**
   * Issuer of the authorization server that issues tokens for this endpoint.
   *
   * Published as `authorization_servers` in the protected-resource document, so
   * it must match that server's own `issuer` exactly: clients fetch
   * `<issuer>/.well-known/oauth-authorization-server` and expect the document to
   * agree.
   */
  authorizationServer: string;
}

/** Where tokens for this endpoint are issued. */
export const DEFAULT_AUTHORIZATION_SERVER = 'https://api.dynomapper.com';

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** Hostnames a listener bound to `host` can legitimately be addressed by. */
function loopbackHosts(host: string): string[] {
  return LOOPBACK_HOSTS.includes(host) ? LOOPBACK_HOSTS : [];
}

/**
 * Reads one of `names` as a positive integer.
 *
 * The first name set wins, which is how the `MCP_`-prefixed settings fall back
 * to the generic ones a container platform injects.
 */
function readInt(
  env: NodeJS.ProcessEnv,
  names: string[],
  fallback: number,
  minimum = 1
): number {
  for (const name of names) {
    const raw = env[name];
    if (raw === undefined || raw.trim() === '') {
      continue;
    }

    const value = Number(raw.trim());
    if (!Number.isInteger(value) || value < minimum) {
      throw new Error(
        `${name} must be an integer of at least ${minimum}, got "${raw}"`
      );
    }
    return value;
  }

  return fallback;
}

/** Reads a comma-separated list, dropping blanks. */
function readList(env: NodeJS.ProcessEnv, name: string): string[] {
  return (env[name] ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** Reads a boolean, accepting the spellings an operator is likely to type. */
function readBool(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: boolean
): boolean {
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const value = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(value)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(value)) {
    return false;
  }

  throw new Error(`${name} must be true or false, got "${raw}"`);
}

/**
 * Reads an absolute http(s) URL, without its trailing slash.
 *
 * `originOnly` is for the address this deployment answers at: a path there
 * would make every advertised URL a guess about where the endpoint is mounted,
 * so it is refused rather than silently truncated.
 */
function readUrl(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: string,
  originOnly = false
): string {
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(`${name} must be an absolute http(s) URL, got "${raw}"`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must be an http or https URL, got "${raw}"`);
  }

  if (url.search !== '' || url.hash !== '') {
    throw new Error(
      `${name} must not carry a query or a fragment, got "${raw}"`
    );
  }

  if (url.username !== '' || url.password !== '') {
    throw new Error(`${name} must not carry credentials, got "${raw}"`);
  }

  if (originOnly && url.pathname !== '/') {
    throw new Error(
      `${name} must be an origin such as https://mcp.example.com, got "${raw}"`
    );
  }

  return originOnly ? url.origin : url.href.replace(/\/+$/, '');
}

export function readHttpConfig(
  env: NodeJS.ProcessEnv = process.env
): HttpConfig {
  return {
    port: readInt(env, ['MCP_PORT', 'PORT'], 3000),
    host: (env.MCP_HOST ?? env.HOST ?? '127.0.0.1').trim(),
    allowedHosts: readList(env, 'MCP_ALLOWED_HOSTS'),
    allowedOrigins: readList(env, 'MCP_ALLOWED_ORIGINS'),
    trustProxy: readBool(env, 'MCP_TRUST_PROXY', false),
    rateLimitPerMinute: readInt(env, ['MCP_RATE_LIMIT'], 60),
    rateLimitBurst: readInt(env, ['MCP_RATE_BURST'], 20),
    // A JSON-RPC tool call is kilobytes. Files no longer travel in a request
    // body — they are PUT to an upload ticket — so this is sized for a verbose
    // bulk call with headroom, not for a base64 file.
    maxBodyBytes: readInt(env, ['MCP_MAX_BODY_BYTES'], 4 * 1024 * 1024),
    // Two spools at the largest purpose is 128 MiB of temp disk; raise it only
    // alongside the disk that has to hold them.
    maxUploadConcurrency: readInt(env, ['MCP_MAX_UPLOAD_CONCURRENCY'], 2),
    maxConcurrency: readInt(env, ['MCP_MAX_CONCURRENCY'], 100),
    // Below CloudFront's 30 second response timeout, so a slow call ends as a
    // tool error the agent can read rather than a 504 it cannot.
    // Read here as well as in core, so the upload route and the tool calls
    // cannot be pointed at two different APIs.
    apiBaseUrl: readUrl(
      env,
      'DYNOMAPPER_API_URL',
      'https://api.dynomapper.com'
    ),
    requestTimeoutMs: readInt(env, ['MCP_REQUEST_TIMEOUT_MS'], 25_000),
    // Any passphrase is accepted; the key is derived by hashing it, so a
    // readable sentence is as good as a hex string. The startup warning says
    // when it is too short to be worth much.
    uploadSecret: (env.MCP_UPLOAD_SECRET ?? '').trim(),
    // Ten minutes: long enough for a slow 64 MB upload, short enough that a URL
    // pasted into the wrong place is useless by the time it is found.
    uploadTicketTtlMs: readInt(env, ['MCP_UPLOAD_TICKET_TTL_MS'], 600_000),
    // The upload leg is the one call whose duration is set by the caller's
    // link, not by the API, so it does not share the tool-call budget.
    uploadTimeoutMs: readInt(env, ['MCP_UPLOAD_TIMEOUT_MS'], 300_000),
    // A half-open connection holds a slot and a spool; nothing at all moving
    // for a minute is a dead link, not a slow one.
    uploadIdleTimeoutMs: readInt(env, ['MCP_UPLOAD_IDLE_TIMEOUT_MS'], 60_000),
    jsonResponses: readBool(env, 'MCP_JSON_RESPONSES', true),
    publicUrl: readUrl(env, 'MCP_PUBLIC_URL', '', true),
    authorizationServer: readUrl(
      env,
      'MCP_AUTHORIZATION_SERVER',
      DEFAULT_AUTHORIZATION_SERVER
    ),
  };
}

/** Hostnames the listener will answer for, given the configuration. */
export function effectiveAllowedHosts(config: HttpConfig): string[] {
  return config.allowedHosts.length > 0
    ? config.allowedHosts
    : loopbackHosts(config.host);
}
