# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-10-28

### Removed

- The `--sse` flag, the `MCP_TRANSPORT=sse` value and the last SSE naming in the
  codebase. Both spellings now exit non-zero with a message naming the
  replacement, instead of starting a server whose transport no longer exists.

### Changed

- The HTTP transport is Streamable HTTP and stateless: every `POST` is answered by
  its own MCP server, no `Mcp-Session-Id` is minted or accepted, and `GET`/`DELETE`
  answer `405`. Replicas need no coordination and a redeploy drops no session.
- `--http` (or `MCP_TRANSPORT=http`) starts the hosted endpoint at `POST /mcp`.
  `--stdio` and the default are unchanged.
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

### Added

- `GET /health`, unauthenticated and unthrottled, reporting status, version and
  uptime for load balancers and container probes.
- A per-caller rate limit (60/min, burst 20), a request body limit (256 KB), a
  concurrency cap (100), optional `Host` and `Origin` allowlists, and a SIGTERM
  drain that closes in-flight transports before exit. All configurable.
- `MCP_TRUST_PROXY`, which keys rate limiting on `CloudFront-Viewer-Address` and
  then the last `X-Forwarded-For` entry, so one CloudFront edge does not throttle
  unrelated callers.
- `HOSTING.md`: the hosted contract, the full settings table, a CloudFront and
  EKS runbook, and the three GitHub Copilot configurations.
- `Dockerfile`, a non-root multi-stage image running `--http` with a `HEALTHCHECK`.
- `README.md` gained one pointer line to `HOSTING.md`; it remains the stdio
  document shown on npm.

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
