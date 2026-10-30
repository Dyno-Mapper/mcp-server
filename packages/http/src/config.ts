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
  /** Requests handled at once before the endpoint answers 503. */
  maxConcurrency: number;
  /** Deadline for one DYNO Mapper API call, in milliseconds. */
  requestTimeoutMs: number;
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
    maxBodyBytes: readInt(env, ['MCP_MAX_BODY_BYTES'], 256 * 1024),
    maxConcurrency: readInt(env, ['MCP_MAX_CONCURRENCY'], 100),
    // Below CloudFront's 30 second response timeout, so a slow call ends as a
    // tool error the agent can read rather than a 504 it cannot.
    requestTimeoutMs: readInt(env, ['MCP_REQUEST_TIMEOUT_MS'], 25_000),
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
