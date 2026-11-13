# Changelog

Notable changes to this repository: the hosted container image, CI, hosting,
packaging and documentation. The npm package keeps its own consumer-facing
changelog at [packages/stdio/CHANGELOG.md](packages/stdio/CHANGELOG.md), and
each release here points at the entry for that version.

Versions are shared: the root manifest, every workspace and both changelogs
carry one version per release, and `npm run check:changelogs` enforces it.

## [0.5.0] - 2026-11-13

The public API reference changed the sitemap item listing: it takes
`maxLevel`, reports the level it covered, no longer returns `total`, and
redefines `nextOffset` and `depth`. This release follows that contract. What a
package consumer sees is in
[packages/stdio/CHANGELOG.md](packages/stdio/CHANGELOG.md); this file records
the repository change behind it.

### Changed

- `get_project_sitemap_items` takes `maxLevel`, capped at 10, and reports the
  effective level in `maxLevel`; its output schema no longer requires `total`.
- `packages/stdio/README.md` describes widening the tree cut and reading below
  it by passing a listed item as `parentId`.
- `resource/api.json` documents the revised listing.

## [0.4.0] - 2026-11-12

The public API reference gained one operation, `POST /v1/project/scratch`, and
adopted a documentation style guide. This release adds the tool for the new
operation and brings every tool description up to that house style. What a
package consumer sees is in
[packages/stdio/CHANGELOG.md](packages/stdio/CHANGELOG.md); this file records
the repository change behind it.

### Added

- `create_project_from_scratch`, registered in `tools.ts`, for
  `POST /v1/project/scratch`: an empty, published project with an optional
  title, a `Home` root at `https://www.example.com`, and no job to poll.
- `packages/stdio/README.md` lists the tool, describes a "Create a project by
  hand" workflow, and names `get_current_user` as the first call.
- `tools.test.ts` enforces the house style's checkable rules — `ID` in prose,
  American spelling, no `this endpoint`, `simply`, `via`, `e.g.`, spaced
  hyphens or settings-screen `ON`/`OFF` — across tool descriptions, input and
  output schemas, and the package README.

### Changed

- Every tool description and schema field follows `dynomapper-public-api`'s
  `docs/style-guide.md` (R1–R10): third-person reference voice, no definitions
  of standard web terms, and field descriptions that lead with the effect and
  end with the default.
- The fifteen crawl settings describe what each flag changes rather than the
  application's settings screen: `ignoreTrailingSlash` now says it collapses
  `/about` and `/about/`, `url` accepts `http` as well as `https`, and
  `uniquePageTitle` says a matching title is dropped rather than duplicated.
- `resource/api.json` now documents the scratch operation and the reference's
  terminology and guide changes.

## [0.3.0] - 2026-11-06

The public API reference gained 27 operations and changed six. This release
brings the tool registry up to it, covering sitemap editing, content blocks,
category and workflow-status maintenance, the project-wide comment feed and
comment writes. What a package consumer sees is in
[packages/stdio/CHANGELOG.md](packages/stdio/CHANGELOG.md); this file records
the repository change behind it.

### Added

- 27 tools under `packages/core/src/tools/`, registered in `tools.ts`:
  - eight for category and workflow-status maintenance, in `projects/`;
  - fifteen for sitemap editing, in a new `sitemap/` directory;
  - four for the project-wide comment feed and comment writes, in `comments/`.
- Shared Zod output schemas in `packages/core/src/tools/schemas/` for
  categories, workflow statuses, sitemap items, content blocks, history steps
  and comments. The item, comment and category reads now use them too, so a
  documented response has one description in the source.
- `resource/api.json` now documents the operations these tools cover.
- `tools.test.ts` registers the new names and rejects `endpoint` and
  `GET /path` syntax in tool descriptions, so a description cannot drift back
  into API terms.
- `api.test.ts` covers a `204 No Content` success.

### Changed

- Six existing tools follow the changed operations: the two category and
  workflow-status reads, the two sitemap item reads, `get_commented_items` and
  `get_item_comments`. See the package changelog for the contract changes.
- `ApiHelper` treats an empty successful body as `{}` rather than a "No data
  received" error. A delete that the API answers with `204` now reports success.
- `packages/stdio/README.md` lists the new tools and describes an "Edit a
  sitemap" workflow.

## [0.2.0] - 2026-10-29

The first release that ships two artifacts: `@dynomapper/mcp-server` on npm and
the hosted container image. What a package consumer sees in this version —
transport refusals, the bundled entrypoint, the license in the tarball — is in
[packages/stdio/CHANGELOG.md](packages/stdio/CHANGELOG.md); this file records
the repository change behind it.

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
- `CHANGELOG.md` is now the repository changelog. The npm package's
  consumer-facing changelog lives at `packages/stdio/CHANGELOG.md` and ships in
  its tarball; the 0.1.x history stays whole there, and this file no longer
  restates it.
- The image and CI run Node.js 26 LTS: `node:26-alpine` in both Dockerfile
  stages, `node:26` in the pipeline, and `@types/node` at 26 so the types match
  the runtime that ships. The npm package is untouched — it is bundled
  JavaScript with no `engines` pin and still runs on the ranges README lists.

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
- `npm run check:changelogs`, which asserts that the root manifest, every
  workspace and both changelogs carry the same version, that each changelog
  opens with an entry for it dated the same day, that the repository changelog
  still points at the package one, and that the package changelog — which ships
  on its own — mentions neither the repository changelog nor CI or hosting. The
  tarball is checked for its changelog by `check:artifact`, which already packs
  it.

## Earlier releases

0.1.1–0.1.7 were npm releases. Their entries live in
[packages/stdio/CHANGELOG.md](packages/stdio/CHANGELOG.md); repository-side
history for those versions is in git.
