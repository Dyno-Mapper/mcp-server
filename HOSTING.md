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
| Authentication   | `Authorization: Bearer <personal access token>`, on every request |
| `Accept`         | Must include both `application/json` and `text/event-stream`      |
| `Content-Type`   | `application/json`                                                |
| Responses        | One JSON body per call; `MCP_JSON_RESPONSES=false` streams SSE    |
| Sessions         | None. No `Mcp-Session-Id` is sent or accepted                     |
| `GET` / `DELETE` | `405`, because there is no stream to resume and no session to end |
| Health           | `GET /health`, unauthenticated, not rate limited                  |

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

| Status | Meaning                                                      |
| ------ | ------------------------------------------------------------ |
| `400`  | Malformed JSON (`-32700`) or an unsupported protocol version |
| `401`  | No bearer token (`-32001`); `WWW-Authenticate` says so       |
| `403`  | Bad `Host` or `Origin`                                       |
| `405`  | `GET`/`DELETE`; `Allow: POST`                                |
| `406`  | `Accept` missing `text/event-stream`                         |
| `413`  | Body over `MCP_MAX_BODY_BYTES`                               |
| `429`  | Over the per-caller rate limit; honours `Retry-After`        |
| `503`  | `MCP_MAX_CONCURRENCY` requests already in flight             |

A tool that fails — including a rejected token — is a normal `200` with an
`isError` result, because the DYNO Mapper API is the authority on whether a
token works. A call that outlives `MCP_REQUEST_TIMEOUT_MS` returns a
`Request Timeout` tool error telling the agent to narrow the query.

### Tool surface

Hosted mode drops the two things that only work against a local filesystem:

- `upload_file` is not registered.
- `create_project_from_file` loses its `file` argument; `url` and `fileKey`
  remain.

Everything else is identical to the stdio server in `packages/stdio`.

## Configuration

| Variable                 | Default     | Meaning                                                                                                                                                                                                      |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MCP_PORT` / `PORT`      | `3000`      | Listener port.                                                                                                                                                                                               |
| `MCP_HOST` / `HOST`      | `127.0.0.1` | Listener interface. A container sets `0.0.0.0`.                                                                                                                                                              |
| `MCP_ALLOWED_HOSTS`      | —           | Comma-separated `Host` allowlist. Unset, a loopback listener accepts only localhost names; a public one is not checked at all.                                                                               |
| `MCP_ALLOWED_ORIGINS`    | —           | Comma-separated `Origin` allowlist. Unset, `Origin` is not checked. A request without `Origin` is always allowed. This rejects foreign origins; it does not turn on CORS, which the endpoint does not speak. |
| `MCP_TRUST_PROXY`        | `false`     | Read the caller IP from `CloudFront-Viewer-Address`, then the last `X-Forwarded-For` entry.                                                                                                                  |
| `MCP_RATE_LIMIT`         | `60`        | Sustained requests per minute per caller.                                                                                                                                                                    |
| `MCP_RATE_BURST`         | `20`        | Burst allowance per caller.                                                                                                                                                                                  |
| `MCP_MAX_BODY_BYTES`     | `262144`    | Largest accepted request body.                                                                                                                                                                               |
| `MCP_MAX_CONCURRENCY`    | `100`       | Requests in flight before `503`.                                                                                                                                                                             |
| `MCP_REQUEST_TIMEOUT_MS` | `25000`     | Deadline for one DYNO Mapper API call. Hosted mode only.                                                                                                                                                     |
| `MCP_JSON_RESPONSES`     | `true`      | `false` answers with an SSE stream instead of one JSON body.                                                                                                                                                 |

`MCP_`-prefixed names win over the generic ones, which matters when a shared pod
injects `PORT` for the application container.

## Deploying behind CloudFront

A working topology for EKS is CloudFront → VPC origin → internal NLB → pod.
CloudFront needs configuring; the defaults break MCP in ways that look like
server bugs:

- **Origin request policy: forward everything.** CloudFront removes `Accept`,
  `Authorization` and `Host` unless the policy forwards them; `AllViewer`
  forwards all viewer headers, including the viewer `Host`. Without it you get
  `406`, then `401`, then a `403` from the host allowlist. Also add
  `CloudFront-Viewer-Address` to the policy so rate limiting keys on the viewer.
- **Cache policy: `CachingDisabled`.** Not for speed — an origin `503` is
  otherwise cached for the error-caching minimum TTL (10 seconds) and served to
  callers who would have succeeded a moment later.
- **Origin response timeout: raise it.** Default 30s, maximum 120s, and it
  measures the gap between response packets, not just time to first byte. The
  server's own `MCP_REQUEST_TIMEOUT_MS` (25s) is deliberately inside it, so a
  slow call ends as a tool error the agent can read instead of a `504`.
- **No custom error responses for 4xx.** A configured page replaces the
  JSON-RPC body. Only `400`, `403`, `404`, `405`, `414`, `416` and `5xx` are
  replaceable at all; `401` and `429` pass through untouched.
- **VPC origin caveats:** an internal NLB is supported as a VPC origin, but an
  NLB with a **TLS listener is not** — CloudFront reaches it over plain HTTP
  inside your VPC. The NLB needs a security group allowing the
  `com.amazonaws.global.cloudfront.origin-facing` managed prefix list, and
  inbound NACLs are not evaluated.
- **Set `MCP_ALLOWED_HOSTS`** to the public name (`mcp.dynomapper.com`) since
  the viewer `Host` is what arrives, and `MCP_TRUST_PROXY=true` so callers are
  limited individually rather than per CloudFront edge.

### On Kubernetes

The container is a sidecar in the application pod, so:

- Give it its own `MCP_PORT` — the pod's `PORT` may already belong to the app.
- Probe `/health` for readiness and liveness; it needs no token, and it ignores
  `MCP_ALLOWED_HOSTS` because a probe addresses the pod by its own address
  rather than the public name.
- Do not mount a PAT. Requests carry their own; a `DYNOMAPPER_API_KEY` inherited
  from the app's environment is ignored with a warning.
- Keep `terminationGracePeriodSeconds` at 30 or more. SIGTERM stops accepting,
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

| Symptom                             | Cause                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `406 Not Acceptable`                | `Accept` did not reach the server, or omitted `text/event-stream`.                    |
| `401` despite a configured header   | CloudFront dropped `Authorization`; forward it in the origin request policy.          |
| `403 Invalid Host`                  | Viewer `Host` not forwarded, or missing from `MCP_ALLOWED_HOSTS`.                     |
| `504` from the CDN                  | CloudFront's response timeout is below the call's duration; raise it to 120s.         |
| A tool always says "File not found" | A local path was sent. Hosted mode cannot read the caller's filesystem.               |
| `503` under load                    | `MCP_MAX_CONCURRENCY` reached; the load is real, not a session leak — there are none. |
