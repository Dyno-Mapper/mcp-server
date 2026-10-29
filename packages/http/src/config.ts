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
}

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
  };
}

/** Hostnames the listener will answer for, given the configuration. */
export function effectiveAllowedHosts(config: HttpConfig): string[] {
  return config.allowedHosts.length > 0
    ? config.allowedHosts
    : loopbackHosts(config.host);
}
