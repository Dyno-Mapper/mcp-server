# Changelog

All notable changes to this project will be documented in this file.

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
