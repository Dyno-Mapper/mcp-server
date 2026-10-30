# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-10-29

### Breaking

- The package is one artifact of two. `@dynomapper/mcp-server` now serves stdio
  and nothing else, and the Streamable HTTP server ships as the container image
  built from this repository. `--http` and `MCP_TRANSPORT=http` on the npm
  binary exit non-zero with a message naming the image, instead of starting a
  server the package no longer contains.
- The source tree is an npm workspace: `packages/core` (server, tools, API
  client), `packages/stdio` (the published package) and `packages/http` (the
  image). `dist/index.js` is now a single bundled file rather than the tsc
  output of the whole tree; the bin name and the published package name are
  unchanged.
- `MCP_TRANSPORT` no longer selects a transport. The stdio binary accepts
  `stdio`, the image accepts `http`, and either binary refuses the other's value
  with a pointer to the artifact that serves it. `--sse` and
  `MCP_TRANSPORT=sse` are refused with the SSE-removal error.

### Removed

- The `--sse` flag, the `MCP_TRANSPORT=sse` value and the last SSE naming in the
  codebase. Both spellings now exit non-zero with a message naming the
  replacement, instead of starting a server whose transport no longer exists.

### Changed

- The HTTP transport is Streamable HTTP and stateless: every `POST` is answered by
  its own MCP server, no `Mcp-Session-Id` is minted or accepted, and `GET`/`DELETE`
  answer `405`. Replicas need no coordination and a redeploy drops no session.
- The hosted image serves the endpoint at `POST /mcp`; `--http` and
  `MCP_TRANSPORT=http` are accepted there as no-ops, so an existing deployment
  command keeps working. `--stdio` is refused, because quietly serving HTTP to
  something that asked for stdio is how a debug session starts.
- Hosted mode requires `Authorization: Bearer <personal access token>` on every
  request and answers `401` with `WWW-Authenticate` when it is missing or not in
  that form. The token is forwarded to the API unvalidated, so the API stays the
  authority. `DYNOMAPPER_API_KEY` is now read by stdio only; hosted mode warns
  when it is set.
- Hosted responses are one JSON body per call. Set `MCP_JSON_RESPONSES=false` to
  stream SSE instead.
- Hosted mode does not register `upload_file`, and `create_project_from_file`
  drops its `file` argument, because a hosted server cannot read the caller's
  filesystem. `url` and `fileKey` still work.
- A hosted call that outlives `MCP_REQUEST_TIMEOUT_MS` (25s by default) returns a
  `Request Timeout` tool error telling the agent to narrow the query, instead of
  letting a CDN timeout answer with no JSON-RPC body.
- The listener reads `MCP_PORT`/`MCP_HOST` before `PORT`/`HOST`, so an MCP sidecar
  in a shared pod does not inherit the application's port.
- The version is authored once in the root `package.json` and compiled into each
  bundle at build time; `serverInfo.name` and `/health` keep reporting
  `@dynomapper/mcp-server`, so nothing client-visible changes.
- The well-known routes answer `Access-Control-Allow-Origin: *`. They are public
  documents read before a client holds any credential, and without the header a
  browser-hosted client cannot tell a CORS failure from a missing document.
  Anything but `GET` answers `405` with `Allow: GET`, and both paths stay behind
  the `Host` guard.
- `.gitignore` and `.dockerignore` cover `.env.*`, not just `.env`, so a token
  in `.env.local`, `.env.production` or any other variant cannot be committed
  or copied into the image. `.env.example` stays tracked: it holds placeholders.
- `HOSTING.md` describes the CDN and orchestrator requirements without naming
  the deployment this repository is served from. The operational advice is
  unchanged; the topology is generic.

### Added

- `GET /health`, unauthenticated and unthrottled, reporting status, version and
  uptime for load balancers and container probes.
- A per-caller rate limit (60/min, burst 20), a request body limit (256 KB), a
  concurrency cap (100), optional `Host` and `Origin` allowlists, and a SIGTERM
  drain that closes in-flight transports before exit. All configurable.
- `MCP_TRUST_PROXY`, which keys rate limiting on `CloudFront-Viewer-Address` and
  then the last `X-Forwarded-For` entry, so one CDN edge does not throttle
  unrelated callers.
- `HOSTING.md`: the hosted contract, the full settings table, a CDN and
  orchestrator runbook, and the three GitHub Copilot configurations.
- `Dockerfile`, a non-root multi-stage image running the hosted server with a
  `HEALTHCHECK`.
- `README.md` now describes both artifacts; `packages/stdio/README.md` remains
  the document shown on npm.
- `npm run check:artifact`: asserts that the npm tarball contains no hosted
  code, that every bare import in the stdio bundle is a declared dependency,
  that core is not a published dependency, and that the version was compiled
  into both bundles.
- An image build and the artifact check in CI, so a broken image or a leaky
  tarball fails the branch rather than the release.
- The hosted endpoint publishes OAuth 2.0 Protected Resource Metadata
  (RFC 9728) at `/.well-known/oauth-protected-resource`, and at the
  path-inserted form `/.well-known/oauth-protected-resource/mcp` that the MCP SDK
  asks for first. The document names the endpoint as the resource, the DYNO
  Mapper API as its authorization server, and the `Authorization` header as the
  only bearer method. It carries no scopes, because there are none to ask for.
- `WWW-Authenticate` names that document with `resource_metadata="…"`. This is
  the difference between a client authorizing itself and a client guessing
  `<origin>/register`, receiving an HTML `404` and reporting the whole thing as
  `Invalid OAuth error response: Unexpected token '<'`.
- An expired JWT is refused with `401` and `error="invalid_token"` before the
  request body is read or the API is called, so a client refreshes instead of an
  agent seeing a tool call fail for a reason it cannot interpret. Signatures are
  still not verified anywhere in this process: reading `exp` can only reject a
  token early, never accept one. A personal access token is opaque and forwarded
  unchanged.
- `MCP_PUBLIC_URL`, which states the origin a deployment answers at so advertised
  URLs do not depend on forwarded headers. Unset, they are derived per request,
  which keeps a loopback listener working with no configuration.
- `MCP_AUTHORIZATION_SERVER` (default `https://api.dynomapper.com`), the issuer
  advertised in the protected-resource document.
- `LICENSE`, Apache-2.0. The package already declined to be anonymous — it
  publishes with `access: public` — but without a license a public repository
  defaults to all-rights-reserved, which is the opposite of what publishing it
  means. A copy ships inside the npm tarball, and `check:artifact` fails if it
  stops doing so.
- `npm run check:secrets`, which fails the build when a credential-shaped value
  appears in any file git would commit. It reads tracked files and untracked
  ones that are not ignored, so a stray `.env.local` is caught before `git add
  -A` is, and it reports a hit redacted rather than printing the secret into a
  CI log.

## [0.1.8] - 2026-10-28

### Added

- Tools for the endpoints added to the public API:
  - `get_project_dacq_score` — DACQ score for private SharePoint projects, in place of VACQ.
  - `create_project_from_sharepoint` — create a private SharePoint project. Credentials are
    forwarded to the crawler and never stored, but they travel as tool arguments.
  - `get_project_login_inputs`, `submit_project_login_input` — answer a sign-in prompt a crawl
    is paused on (an MFA code, for example).
  - `get_accessibility_login_inputs`, `submit_accessibility_login_input` — the same for an
    accessibility run.
  - `upload_file` — upload a text or XML source once and get a `fileKey` the import accepts,
    so the file does not have to be sent again.
- `create_project_from_file` accepts a `fileKey` from `upload_file`.

### Changed

- `create_project_from_file` sends a JSON body when no local file is given, instead of an empty
  file part. The API refuses an empty file and refuses a file alongside a URL, so URL-only and
  key-only imports now work.
- Error results for a 429 now carry `retryAfter`, `rateLimitLimit`, `rateLimitRemaining` and
  `rateLimitReset` from the response headers, so a client can wait the documented time.
- Tool output schemas now follow the documented responses: `create_project_from_url` and
  `refresh_project_url` report `loginInputs`, `run_accessibility_checker` and
  `get_accessibility_results` report them for a run, `get_projects` and `get_project_details`
  report `isPrivate` and `isSharepoint`, and `get_audit_score` allows null crawlability and
  indexability. No output schema requires a field the API calls optional, so a documented
  response can no longer fail validation.
- Every tool description and field description was rewritten from the updated API reference and
  now points at the equivalent tool instead of an API endpoint.
- The server reports the package version in its MCP server metadata instead of a hard-coded
  `0.1.0`.
- The toolchain moved to TypeScript 7 (the native compiler), Vite+ 1.4 and Vitest, and every
  dependency was updated, `dotenv` 17 → 18 included. Nothing in the published tool surface
  changed.
- `dist/` is no longer committed. `npm run build` produces it, and `prepublishOnly` still builds
  before publishing, so the tarball is unaffected.

## [0.1.7] - 2026-04-14

### Added

- Added visibility-related tools:
  - `update_visibility_keyword_setting`
  - `update_visibility_keywords_group`
  - `create_visibility_keywords`
  - `delete_visibility_keyword_group`
  - `create_visibility_keyword_group`
  - `get_visibility_locales`

## [0.1.6] - 2026-04-07

### Changed

- Added keywords to the npm registry.

## [0.1.5] - 2026-04-07

### Changed

- Updated the project logo.

## [0.1.4] - 2026-04-07

### Changed

- Updated documentation in the README file.

## [0.1.3] - 2026-04-06

### Added

- Added default filters for project retrieval.

## [0.1.2] - 2026-04-06

### Changed

- Fixed execution permissions for the index file.

## [0.1.1] - 2026-04-06

### Added

- Initial release of the DYNO Mapper MCP Server.
- Support for project management (create from URL/Sitemap, refresh, status).
- Integration with various DYNO Mapper tools:
  - Accessibility & PDF Accessibility
  - Analytics & Visibility
  - Content Audits & Inventory
  - Assignments & Comments
- Support for both Stdio and HTTP transport with authentication.
