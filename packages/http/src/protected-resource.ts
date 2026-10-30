/**
 * OAuth 2.0 Protected Resource Metadata, RFC 9728.
 *
 * A client that receives a 401 has to be told where tokens for this endpoint are
 * issued. Without this document it guesses `<origin>/register`, which is how a
 * missing standard reaches the person holding the client as an HTML 404 and a
 * JSON parse error.
 *
 * The document states the resource this endpoint protects. It carries no scopes,
 * because this deployment has none to ask for: a personal access token or an
 * OAuth access token is accepted on its own merits by the API behind the
 * endpoint, and nothing here narrows what it may do.
 */
import type { Request } from 'express';
import type { HttpConfig } from './config.js';
import { firstHeader } from './headers.js';

/** The canonical document, at the root path. */
export const METADATA_PATH = '/.well-known/oauth-protected-resource';

/**
 * Every path discovery may ask for.
 *
 * RFC 9728 §3.1 allows the document at the root path, or with the resource's own
 * path inserted after the well-known segment. The MCP SDK asks for the inserted
 * form first and only falls back to the root on a 404, so both are served with
 * the same body: one fewer round trip, and no client depends on which form the
 * server happened to pick.
 */
export const METADATA_PATHS = [METADATA_PATH, `${METADATA_PATH}/mcp`];

export interface ProtectedResourceMetadata {
  /** The endpoint's identifier, as an absolute URL without a trailing slash. */
  resource: string;
  /** Where a token for this resource is obtained. */
  authorization_servers: string[];
  /** How the token is presented. Only the `Authorization` header is accepted. */
  bearer_methods_supported: string[];
}

/**
 * The origin this request was addressed at.
 *
 * A deployment states `MCP_PUBLIC_URL`, because CloudFront terminates TLS and
 * the origin socket is plain HTTP: nothing in the request says `https` unless a
 * trusted proxy does. Without it the value is derived from `Host`, which is
 * exactly right for a loopback listener and only as right as the forwarded
 * headers behind a proxy.
 */
export function publicOrigin(
  req: Request,
  config: HttpConfig
): string | undefined {
  if (config.publicUrl !== '') {
    return config.publicUrl;
  }

  const host = firstHeader(req.headers.host);
  if (!host) {
    return undefined;
  }

  return `${requestProtocol(req, config)}://${host}`;
}

/** The scheme the client used, as far as the request can say. */
function requestProtocol(req: Request, config: HttpConfig): string {
  if (!config.trustProxy) {
    return req.protocol;
  }

  const forwarded = (firstHeader(req.headers['x-forwarded-proto']) ?? '')
    .split(',')[0]
    ?.trim();

  return forwarded === 'https' || forwarded === 'http'
    ? forwarded
    : req.protocol;
}

/** Where the `WWW-Authenticate` challenge sends a client that has no token. */
export function resourceMetadataUrl(origin: string): string {
  return `${origin}${METADATA_PATH}`;
}

export function protectedResourceMetadata(
  origin: string,
  config: HttpConfig
): ProtectedResourceMetadata {
  return {
    resource: origin,
    authorization_servers: [config.authorizationServer],
    bearer_methods_supported: ['header'],
  };
}
