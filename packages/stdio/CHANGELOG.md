# Changelog

Notable changes to `@dynomapper/mcp-server`, the stdio server published to npm.

The version tracks the release it ships with. `0.1.0` was the first publish and
predates this file.

## [0.4.0] - 2026-11-12

The public API gained one operation and a documentation style guide. This
release adds the tool for the new operation and aligns every tool description
with that style. No tool, argument or response shape changed.

### Added

- `create_project_from_scratch` — create an empty, published project and build
  its sitemap by hand. `title` is optional and defaults to `Untitled Project`;
  the call returns the new project `id`, and there is no job to poll.
- The README lists the tool, describes a "Create a project by hand" workflow,
  and names `get_current_user` as the first call.

### Changed

- Tool descriptions and schema fields now use `ID` in prose, American spelling,
  third-person voice and effect-first field text, following the API reference's
  documentation style. The fifteen crawl settings describe their effect and
  default instead of the application's settings screen. No contract changed.

## [0.3.0] - 2026-11-06

Brings the tools up to the updated public API reference: 27 operations are new
and six that already had tools changed shape.

### Breaking

- `get_item_comments` no longer takes `orderBy` or `orderDir`. It takes `page`,
  `limit`, `order` and `search`, and its response is paged, with `total`,
  `limit`, `page`, `pageSize` and `itemId` alongside `items`. `order: 'asc'` is
  the default and still reads oldest first.
- `get_project_workflow_statuses` reports `parentKey` instead of `parentId`, and
  a status `id` may be a string, because a built-in status uses its key as its
  id. Code that assumed a numeric id needs a string branch.
- `get_project_sitemap_items` reads `parentId` as the root of a subtree: the
  item itself comes first, followed by everything published beneath it, rather
  than only its direct children.
- `get_project_categories` and `get_project_workflow_statuses` report
  `editable`, and `get_project_sitemap_items` reports `contentCount`.

### Added

- Sitemap editing tools:
  - `create_project_sitemap_item`, `update_project_sitemap_item`,
    `delete_project_sitemap_item` — add, edit and delete one page or container.
  - `bulk_update_project_sitemap_items`, `bulk_delete_project_sitemap_items`,
    `bulk_move_project_sitemap_items` — assign attributes, delete or move up to
    500 items in one call.
  - `move_project_sitemap_item`, `duplicate_project_sitemap_item`,
    `sort_project_sitemap_items` — reparent, copy and order items.
  - `get_project_sitemap_undo`, `undo_project_sitemap_edit`,
    `get_project_sitemap_redo`, `redo_project_sitemap_edit` — inspect and walk
    the project's shared edit history.
  - `get_project_sitemap_item_content`, `replace_project_sitemap_item_content` —
    read and replace a page's content blocks.
- Category and workflow-status maintenance:
  `create_project_category`, `update_project_category`, `delete_project_category`,
  `move_project_category`, `create_project_workflow_status`,
  `update_project_workflow_status`, `delete_project_workflow_status`,
  `move_project_workflow_status`.
- Comment tools: `get_all_project_comments`, `create_item_comment`,
  `update_item_comment`, `delete_item_comment`.
- A successful response with no body, such as a `204` delete, now answers `{}`
  instead of a "No data received from the API" tool error.

### Changed

- `get_commented_items` reports a nullable `lastActivity` and validates `page`
  as a positive whole number.
- `get_project_sitemap_item_details` reports a nullable `url`, matching the
  documented response for a container.
- Tool descriptions name the tool to call next rather than an API route.

## [0.2.0] - 2026-10-29

First npm release since 0.1.7, carrying the tools and contract changes made in
the meantime.

### Breaking

- `--http` and `MCP_TRANSPORT=http` exit non-zero instead of starting a server
  this package no longer contains. The error says what to use instead.
- `MCP_TRANSPORT` no longer selects a transport. The binary accepts `stdio` and
  still accepts `--stdio` for compatibility; any other value is refused.
- The `--sse` flag and the `MCP_TRANSPORT=sse` value are gone. Both spellings
  exit non-zero with a message naming the replacement.

### Changed

- `dist/index.js` is one bundled file rather than the compiler output of the
  whole source tree. The package name and the `dynomapper-mcp` bin are
  unchanged.
- No existing tool, argument or output schema was renamed or removed, and no
  environment variable changed: `DYNOMAPPER_API_KEY`, `MCP_API_KEY` and
  `API_KEY` are still accepted, in that order. The additions are under Added.
- `create_project_from_file` sends a JSON body when no local file is given,
  instead of an empty file part. The API refuses an empty file and refuses a
  file alongside a URL, so URL-only and key-only imports now work.
- Error results for a 429 now carry `retryAfter`, `rateLimitLimit`,
  `rateLimitRemaining` and `rateLimitReset` from the response headers, so a
  client can wait the documented time.
- Tool output schemas now follow the documented responses:
  `create_project_from_url` and `refresh_project_url` report `loginInputs`,
  `run_accessibility_checker` and `get_accessibility_results` report them for a
  run, `get_projects` and `get_project_details` report `isPrivate` and
  `isSharepoint`, and `get_audit_score` allows null crawlability and
  indexability. No output schema requires a field the API calls optional, so a
  documented response can no longer fail validation.
- Every tool description and field description was rewritten from the updated
  API reference and now points at the equivalent tool instead of an API
  endpoint.
- The server reports the package version in its MCP server metadata instead of a
  hard-coded `0.1.0`.
- The toolchain moved to TypeScript 7 (the native compiler), Vite+ 1.4 and
  Vitest, and every dependency was updated, `dotenv` 17 → 18 included.
- `dist/` is no longer committed. `npm run build` produces it, and `prepack`
  still builds before publishing, so the tarball is unaffected.
- The README now covers clients that cannot launch a process, and no longer
  carries development instructions.

### Added

- Tools for the endpoints added to the public API:
  - `get_project_dacq_score` — DACQ score for private SharePoint projects, in
    place of VACQ.
  - `create_project_from_sharepoint` — create a private SharePoint project.
    Credentials are forwarded to the crawler and never stored, but they travel
    as tool arguments.
  - `get_project_login_inputs`, `submit_project_login_input` — answer a sign-in
    prompt a crawl is paused on (an MFA code, for example).
  - `get_accessibility_login_inputs`, `submit_accessibility_login_input` — the
    same for an accessibility run.
  - `upload_file` — upload a text or XML source once and get a `fileKey` the
    import accepts, so the file does not have to be sent again.
- `create_project_from_file` accepts a `fileKey` from `upload_file`.
- `CHANGELOG.md` ships in the package, so the version history travels with the
  install.
- `LICENSE`, Apache-2.0, ships in the package.

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
