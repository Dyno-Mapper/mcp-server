/**
 * The credential rules for the hosted endpoint.
 *
 * The endpoint forwards the caller's token to the DYNO Mapper API, which is the
 * authority on whether it is valid. The two decisions taken here are the ones
 * that must happen before an API call: is a token present at all, and has it
 * visibly expired.
 */
import { createHash } from 'node:crypto';
import { resourceMetadataUrl } from './protected-resource.js';

const BEARER = /^Bearer\s+(\S+)$/i;

/** The token in an `Authorization: Bearer …` header, if it is in that form. */
export function bearerToken(
  header: string | string[] | undefined
): string | undefined {
  const value = firstValue(header)?.trim();
  if (!value) {
    return undefined;
  }

  return BEARER.exec(value)?.[1];
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Whether a token is a JWT whose `exp` has passed.
 *
 * The signature is deliberately not verified: this process holds no signing key,
 * and the API decides whether a token is genuine. Reading `exp` can therefore
 * only reject a token early, never accept one. What it buys is a real `401`
 * with a challenge while the client can still act on it, instead of a tool call
 * that fails with an error no client knows how to interpret — the SDK is then
 * free to refresh or start a new authorization instead of reporting a broken
 * tool. Anything that is not a decodable three-part JWT with a numeric `exp` is
 * opaque and left to the API.
 */
export function isExpiredJwt(token: string, now = Date.now()): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return false;
  }

  const exp = (claims as { exp?: unknown } | null)?.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return false;
  }

  return exp * 1000 <= now;
}

/**
 * A stable key for one caller, for the limits that are per account.
 *
 * The token itself is never the key: it is a credential, and a map filled with
 * credentials is a map worth stealing. What is keyed is either the `sub` a JWT
 * already carries — the account, which is what "per caller" means — or a digest
 * of an opaque personal access token, which stands in for one. Hashed rather
 * than stored so two callers' tokens cannot be compared from a heap dump, and
 * prefixed so a subject and a digest cannot collide.
 *
 * `sub` is not verified for the same reason `exp` is not: this process holds no
 * signing key and the API decides whether a token is genuine. Using a forged
 * subject can only give the caller a private bucket of its own, which is
 * exactly what a genuine subject gives it.
 */
export function callerIdentity(token: string): string {
  const subject = jwtSubject(token);

  if (subject) {
    return `sub:${subject}`;
  }

  return `token:${createHash('sha256').update(token).digest('hex')}`;
}

/** The `sub` of a token that is a decodable JWT carrying one. */
function jwtSubject(token: string): string | undefined {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return undefined;
  }

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return undefined;
  }

  const sub = (claims as { sub?: unknown } | null)?.sub;
  return typeof sub === 'string' && sub.length > 0 ? sub : undefined;
}

/**
 * The challenge a 401 carries.
 *
 * `realm` is what an MCP client sees first. `resource_metadata` is what stops it
 * guessing where to register (RFC 9728 §5.1): without it the SDK falls back to
 * `<origin>/register` and reports the 404 as a parse error. `error` is added
 * only when the reason is known, because a missing token and an expired one are
 * different answers to the client.
 */
export function bearerChallenge(options: {
  origin?: string;
  error?: 'invalid_token';
}): string {
  const params = ['realm="dynomapper-mcp"'];

  if (options.error) {
    params.push(`error="${options.error}"`);
  }

  if (options.origin) {
    params.push(`resource_metadata="${resourceMetadataUrl(options.origin)}"`);
  }

  return `Bearer ${params.join(', ')}`;
}
