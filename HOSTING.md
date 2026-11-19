# Hosting the DYNO Mapper MCP server

`packages/stdio/README.md` documents the stdio server an MCP client launches.
This file
documents the hosted alternative: **Streamable HTTP** at `POST /mcp`, for
agents that cannot launch a process — GitHub's Copilot coding agent among them.

Hosted mode is **stateless**. No `Mcp-Session-Id` is minted, every request is
answered by its own MCP server, and `GET`/`DELETE` answer `405`. That is what
lets you run as many replicas as you like, and why a redeploy has no session to
migrate.

## Run it

```bash
# Container
docker build -t dynomapper-mcp .
docker run --rm -p 3000:3000 dynomapper-mcp

# Or from a checkout
npm run build
MCP_HOST=0.0.0.0 node packages/http/dist/index.js
```

Check it:

```bash
curl -s http://127.0.0.1:3000/health
# {"status":"ok","name":"@dynomapper/mcp-server","version":"0.2.0","uptimeSeconds":3}
```

The image serves Streamable HTTP and nothing else, so there is no transport to
select. `--http` is still accepted as a no-op, which keeps an existing
deployment command working; `--stdio` is refused with a pointer to the npm
package, because quietly serving HTTP to something that asked for stdio is how
a debug session starts. `MCP_TRANSPORT=http` is likewise accepted and
`MCP_TRANSPORT=stdio` refused. `--sse` and `MCP_TRANSPORT=sse` are refused with
the SSE-removal error. `--help` lists the flags and the hosted settings.

## The endpoint

One endpoint, `POST /mcp`, speaking JSON-RPC 2.0.

| Concern          | Behaviour                                                         |
| ---------------- | ----------------------------------------------------------------- |
| Authentication   | `Authorization: Bearer <access token>`, on every request          |
| `Accept`         | Must include both `application/json` and `text/event-stream`      |
| `Content-Type`   | `application/json`                                                |
| Responses        | One JSON body per call; `MCP_JSON_RESPONSES=false` streams SSE    |
| Sessions         | None. No `Mcp-Session-Id` is sent or accepted                     |
| `GET` / `DELETE` | `405`, because there is no stream to resume and no session to end |
| Health           | `GET /health`, unauthenticated, not rate limited                  |
| Metadata         | `GET /.well-known/oauth-protected-resource`, unauthenticated      |

```bash
curl -s -X POST http://127.0.0.1:3000/mcp \
  -H 'authorization: Bearer <token>' \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'
```

Every caller authenticates with their own personal access token, so the API's
rate limit applies to their account rather than to the host's. The server keeps
no token: `DYNOMAPPER_API_KEY` is read by the stdio server only, and this one
warns at startup when it is set.

### Errors

Failures that happen before a tool runs are HTTP statuses with a JSON-RPC error
body, so a client never receives an HTML page:

| Status | Meaning                                                                                                                       |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Malformed JSON (`-32700`) or an unsupported protocol version                                                                  |
| `401`  | No token or an expired one (`-32001`); `WWW-Authenticate` names the metadata document                                         |
| `403`  | Bad `Host` or `Origin`                                                                                                        |
| `405`  | `GET`/`DELETE`; `Allow: POST`                                                                                                 |
| `406`  | `Accept` missing `text/event-stream`                                                                                          |
| `413`  | Body over `MCP_MAX_BODY_BYTES`                                                                                                |
| `429`  | Over the per-caller rate limit; honours `Retry-After`                                                                         |
| `503`  | `MCP_MAX_CONCURRENCY` requests in flight, or an upload when `MCP_MAX_UPLOAD_CONCURRENCY` is already in flight for that caller |

A tool that fails — including a rejected token — is a normal `200` with an
`isError` result, because the DYNO Mapper API is the authority on whether a
token works. A call that outlives `MCP_REQUEST_TIMEOUT_MS` returns a
`Request Timeout` tool error telling the agent to narrow the query.

### OAuth and personal access tokens

The endpoint is an OAuth 2.0 protected resource (RFC 9728). A client that arrives
without a token is told where tokens come from, so it can authorize itself
instead of the caller pasting one in:

```bash
curl -s https://mcp.dynomapper.com/.well-known/oauth-protected-resource
```

```json
{
  "resource": "https://mcp.dynomapper.com",
  "authorization_servers": ["https://api.dynomapper.com"],
  "bearer_methods_supported": ["header"]
}
```

The same document answers at the path-inserted form
`/.well-known/oauth-protected-resource/mcp`, because the MCP SDK asks for that
first and only falls back to the root path on a `404`. Both carry
`Access-Control-Allow-Origin: *` and are cached for five minutes; neither needs a
token, and both stay behind the `Host` guard.

The `401` names that document in its challenge:

```
WWW-Authenticate: Bearer realm="dynomapper-mcp",
  resource_metadata="https://mcp.dynomapper.com/.well-known/oauth-protected-resource"
```

Without the parameter a client falls back to guessing `<origin>/register`,
receives an HTML `404` and reports a JSON parse error — which is what a missing
protected-resource document looks like from the outside.

An access token is either a DYNO Mapper personal access token or an OAuth 2.0
access token; the endpoint forwards whichever it receives, and the API decides
whether it is valid. No signature is verified here. The `exp` claim is read for
one purpose: an expired JWT is refused with a `401` that carries
`error="invalid_token"`, before the body is read or the API is called, so the
client can refresh instead of the agent seeing a tool call that failed for a
reason it cannot interpret. Opaque tokens, including personal access tokens, are
forwarded unchanged.

Set `MCP_PUBLIC_URL` in a deployment. Without it the advertised URLs are derived
from the request `Host`, which is only as right as the forwarded headers behind
your CDN.

The authorization server is operated separately from this endpoint. This
service only tells a client where it is; whether that server wants a
pre-registered client, which redirect URIs it accepts and how it presents its own
metadata are its to decide. A failure during authorization therefore belongs to
the server named in `authorization_servers`, not to this one.

### Tool surface

The tool surface is the stdio server's, with one tool's argument exchanged for
another. `upload_file` reads a path on the stdio server, where the caller and
the server share a filesystem, and takes the caller's bytes here, where they do
not:

| Transport | Source of the file                                     |
| --------- | ------------------------------------------------------ |
| stdio     | `file`, an absolute path on the caller's machine       |
| hosted    | `content`, base64 plus `name` and `mimeType`, or `url` |

Everything else is identical to the stdio server in `packages/stdio`. Uploads
are what a deployment has to be sized for; see [Uploads](#uploads).

## Configuration

| Variable                     | Default                      | Meaning                                                                                                                                                                                                                    |
| ---------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MCP_PORT` / `PORT`          | `3000`                       | Listener port.                                                                                                                                                                                                             |
| `MCP_HOST` / `HOST`          | `127.0.0.1`                  | Listener interface. A container sets `0.0.0.0`.                                                                                                                                                                            |
| `MCP_ALLOWED_HOSTS`          | —                            | Comma-separated `Host` allowlist. Unset, a loopback listener accepts only localhost names; a public one is not checked at all.                                                                                             |
| `MCP_ALLOWED_ORIGINS`        | —                            | Comma-separated `Origin` allowlist. Unset, `Origin` is not checked. A request without `Origin` is always allowed. This rejects foreign origins; it does not turn on CORS, which only the well-known metadata routes speak. |
| `MCP_TRUST_PROXY`            | `false`                      | Read the caller IP from the CDN's viewer-address header when present, then the last `X-Forwarded-For` entry.                                                                                                               |
| `MCP_RATE_LIMIT`             | `60`                         | Sustained requests per minute per caller.                                                                                                                                                                                  |
| `MCP_RATE_BURST`             | `20`                         | Burst allowance per caller.                                                                                                                                                                                                |
| `MCP_MAX_BODY_BYTES`         | `100663296`                  | Largest accepted request body: 96 MiB, which holds a 64 MB file as base64. A body above 8 MiB is charged to an upload slot.                                                                                                |
| `MCP_MAX_CONCURRENCY`        | `100`                        | Requests in flight before `503`.                                                                                                                                                                                           |
| `MCP_MAX_UPLOAD_CONCURRENCY` | `2`                          | Uploads in flight **per caller** before `503`. Keyed on the JWT `sub`, or a digest of an opaque token.                                                                                                                     |
| `MCP_UPLOAD_GATE_BYTES`      | `8388608`                    | Body size at which a request is treated as an upload and charged a slot before it is read.                                                                                                                                 |
| `MCP_REQUEST_TIMEOUT_MS`     | `25000`                      | Deadline for the whole tool call, a `url` fetch included. Hosted mode only.                                                                                                                                                |
| `MCP_JSON_RESPONSES`         | `true`                       | `false` answers with an SSE stream instead of one JSON body.                                                                                                                                                               |
| `MCP_PUBLIC_URL`             | —                            | Origin this deployment answers at, such as `https://mcp.dynomapper.com`. Unset, every advertised URL is derived from the request `Host`.                                                                                   |
| `MCP_AUTHORIZATION_SERVER`   | `https://api.dynomapper.com` | Issuer advertised in the protected-resource document. It must match that server's own `issuer` exactly, or a client rejects the document.                                                                                  |

`MCP_`-prefixed names win over the generic ones, which matters when a shared pod
injects `PORT` for the application container.

## Uploads

`upload_file` is how a file reaches the API: an import, a PDF accessibility
run, or an image or document a page points at. The API takes the file as
`multipart/form-data` and answers a key, and every call that spends that key
takes `fileKey` instead of a file.

This server cannot read the caller's disk, so the bytes arrive one of two ways
— and only on this server, because the stdio one shares the caller's filesystem:

- **`content`** — the file's bytes as base64, with `name` and `mimeType`
  alongside. Nothing about this is free: base64 carries three bytes in four, so
  a 64 MB file is 87.4 MB of request body, and the process holds it several
  times over while it decodes, types and re-sends it.
- **`url`** — the server fetches it. The response's `Content-Type` is the
  declared media type and its filename is the name, unless `mimeType` or `name`
  overrides them. Reading stops the moment the file passes the purpose's limit,
  whether or not the response declared a length.

Send exactly one, or the call answers `invalid_file_source`.

### What a deployment has to be sized for

An upload costs roughly five times the file: the base64 string inside the
parsed body, the raw body buffer, the decoded bytes, the `Blob` the form is
built from, and the serialised request. Two concurrent 64 MB uploads are
therefore around 600 MB of transient heap, which is what
`MCP_MAX_UPLOAD_CONCURRENCY` bounds. Size the container for
`MCP_MAX_UPLOAD_CONCURRENCY x 5 x 64 MB` on top of everything else the pod does.

Two guards keep that bounded:

- **Per-caller upload slots.** A body over `MCP_UPLOAD_GATE_BYTES` is treated as
  an upload — no other tool carries that much argument — and is charged a slot
  before it is read, answering `503` with `Retry-After` when the caller already
  has `MCP_MAX_UPLOAD_CONCURRENCY` in flight. The slot is keyed on the account,
  not the address: a platform calling on behalf of many accounts shares an
  address and nothing else.
- **The body limit.** `MCP_MAX_BODY_BYTES` defaults to 96 MiB, which is what a
  64 MB file needs as base64. A request with no `Content-Length` cannot be
  charged a slot before it is read, and is bounded only by
  `MCP_MAX_CONCURRENCY`.

Lowering `MCP_MAX_BODY_BYTES` is supported; the server warns at startup when it
is below what a 64 MB upload needs. The effect is that `content` uploads above
three quarters of the limit are refused with `413`, while `url` uploads are
unaffected.

### What a URL may be

A caller-supplied URL is fetched from inside the network this container runs in,
and the caller learns only whether it worked — never the body that was fetched.
Left open, that is a blind SSRF primitive. A hosted server therefore refuses any
URL whose host resolves to a loopback, private, link-local (including the
metadata endpoint), CGNAT, multicast or reserved address, in either family,
including the IPv4-mapped and NAT64 spellings. It follows at most three
redirects and re-checks every hop.

Two things stay the operator's:

- The check runs on the addresses DNS returned and the connection resolves
  again, so a rebinding attack narrows the window rather than closing it.
- The pod's egress rules decide what is reachable regardless. Restrict egress to
  the API and the public internet, never the internal network.

None of this reaches the stdio server: it reads a path and never fetches a URL,
so there is no address for it to refuse. A file the stdio user has is a file
they can name.

## Deploying behind a CDN

A working topology is CDN → load balancer → container. The CDN needs
configuring; its defaults break MCP in ways that look like server bugs:

- **Forward the headers.** The CDN drops `Accept`, `Authorization` and `Host`
  unless it is told to pass them through, and it must pass the viewer `Host`
  rather than its own. Without that you get `406`, then `401`, then a `403` from
  the host allowlist. Forward the viewer-address header too, so rate limiting
  keys on the caller instead of the CDN edge.
- **Disable caching on the endpoint.** Not for speed — an origin `503`
  otherwise sits in the CDN's error cache for its minimum TTL, typically ten
  seconds, and is served to callers who would have succeeded a moment later.
- **Raise the origin response timeout.** A common default is 30s with a 120s
  ceiling, and it measures the gap between response packets, not just time to
  first byte. The server's own `MCP_REQUEST_TIMEOUT_MS` (25s) is deliberately
  inside it, so a slow call ends as a tool error the agent can read instead of a
  `504`.
- **No custom error responses for 4xx.** A configured page replaces the
  JSON-RPC body. Only some statuses are replaceable at all; `401` and `429`
  pass through untouched.
- **Terminate TLS at the CDN.** A CDN usually reaches a private origin over
  plain HTTP, so an origin load balancer with a **TLS listener will not work**
  behind one. Restrict origin ingress to the CDN's published egress ranges —
  most publish them, some as a managed prefix list — and check whether your
  network layer evaluates inbound ACLs at all.
- **Set `MCP_ALLOWED_HOSTS`** to the public name since the viewer `Host` is what
  arrives, and `MCP_TRUST_PROXY=true` so callers are limited individually
  rather than per CDN edge.

### In a container orchestrator

The container is usually run beside the application it serves, so:

- Give it its own `MCP_PORT` — the generic `PORT` may already be claimed by the
  process it shares a container group with.
- Probe `/health` for readiness and liveness; it needs no token, and it ignores
  `MCP_ALLOWED_HOSTS` because a probe addresses the container by its own address
  rather than the public name.
- Do not mount a PAT. Requests carry their own; a `DYNOMAPPER_API_KEY` inherited
  from a shared environment is ignored with a warning.
- Keep the termination grace period at 30s or more. SIGTERM stops accepting,
  drains in-flight calls for up to 10s, then exits.
- Replicas need no coordination: no session state exists to share.

## GitHub Copilot

The coding agent cannot run a stdio server and cannot do OAuth for a remote MCP
server, so it needs the hosted URL and a token in a header. Tokens stay in
Copilot's secrets as `COPILOT_MCP_`-prefixed variables.

**GitHub coding agent** — repository Settings → Copilot → MCP servers:

```json
{
  "mcpServers": {
    "dynomapper": {
      "type": "http",
      "url": "https://mcp.dynomapper.com/mcp",
      "headers": { "Authorization": "Bearer $COPILOT_MCP_DYNO_TOKEN" },
      "tools": ["*"]
    }
  }
}
```

`tools` is required. The coding agent uses tools only — no resources or prompts
— and calls them without asking. For code review it only uses tools annotated
`readOnlyHint: true`, which this server already sets on every `GET` tool.

**VS Code agent mode** — `.vscode/mcp.json`, with the token prompted once and
stored by the editor:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "dyno-token",
      "description": "DYNO Mapper personal access token",
      "password": true
    }
  ],
  "servers": {
    "dynomapper": {
      "type": "http",
      "url": "https://mcp.dynomapper.com/mcp",
      "headers": { "Authorization": "Bearer ${input:dyno-token}" }
    }
  }
}
```

**Portable `.mcp.json`** — the file the Copilot harness itself reads, which does
not understand `${input:...}`. Use an environment variable instead:

```json
{
  "mcpServers": {
    "dynomapper": {
      "type": "http",
      "url": "https://mcp.dynomapper.com/mcp",
      "headers": { "Authorization": "Bearer ${DYNO_TOKEN}" }
    }
  }
}
```

## Troubleshooting

| Symptom                                                             | Cause                                                                                                                                                            |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `406 Not Acceptable`                                                | `Accept` did not reach the server, or omitted `text/event-stream`.                                                                                               |
| `401` despite a configured header                                   | The CDN dropped `Authorization`; forward it in its origin request policy.                                                                                        |
| `403 Invalid Host`                                                  | Viewer `Host` not forwarded, or missing from `MCP_ALLOWED_HOSTS`.                                                                                                |
| `504` from the CDN                                                  | The CDN's response timeout is below the call's duration; raise it to 120s.                                                                                       |
| `413` on an upload                                                  | The body is over `MCP_MAX_BODY_BYTES`, or the file is over its purpose's limit. See [Uploads](#uploads).                                                         |
| `blocked_address` on an upload                                      | The URL resolved to a private, loopback or link-local address. A hosted server fetches only public ones; send the bytes as `content` instead.                    |
| `503` under load                                                    | `MCP_MAX_CONCURRENCY` reached; the load is real, not a session leak — there are none.                                                                            |
| Client reports a JSON parse error where a token should be requested | It guessed `/register` on this origin, so it never found the protected-resource document. Check `MCP_PUBLIC_URL` and that the URL in the challenge is reachable. |
| Client cannot complete authorization                                | The server named in `authorization_servers` refused or could not be reached. This endpoint does not sit on that hop.                                             |
