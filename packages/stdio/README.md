# DYNO Mapper MCP Server

[![DYNO Mapper](https://d31ninron5tttf.cloudfront.net/images/logo_dark.c37f697f.png)](https://dynomapper.com)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server for the [DYNO Mapper Public API](https://app.dynomapper.com/developer). This server allows AI agents to interact with your DYNO Mapper projects, perform accessibility audits, manage assignments, and analyze website inventory.

## Features

- **Project Management**: Create, list, and manage sitemap projects.
- **Sitemap Editing**: Add, edit, move, duplicate, sort, and delete pages and containers, with undo and redo.
- **Content Blocks**: Read and replace the content blocks of a sitemap page.
- **Comments**: Read a project's comment feed and post, edit, or delete comments.
- **Accessibility Auditing**: Run and retrieve accessibility reports (WCAG 2.1/2.2).
- **Inventory & Audit**: Get detailed site inventory and SEO audit results.
- **Analytics Integration**: Access project-level and page-level analytics.
- **Content Assignments**: Manage content assignments and workflow statuses.
- **Keyword Tracking**: Monitor search engine visibility and keyword rankings.
- **Private Sites**: Crawl a SharePoint team site and report its DACQ score instead of VACQ.
- **Sign-in Prompts**: Answer an MFA prompt that a crawl or an accessibility run is paused on.

## Prerequisites

- A [DYNO Mapper](https://dynomapper.com) account.
- A DYNO Mapper **Personal Access Token (PAT)**.

## Configuration

### Obtaining a Personal Access Token

To use the DYNO Mapper MCP Server, you must generate a Personal Access Token:

1.  Log in to [DYNO Mapper](https://app.dynomapper.com).
2.  Navigate to [https://app.dynomapper.com/developer](https://app.dynomapper.com/developer).
3.  Go to the **Personal Access Tokens** section.
4.  Click **Generate**, name your token, and copy it.

> [!IMPORTANT]
> Keep your Personal Access Tokens secure and never share them publicly.

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

- **macOS**: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dynomapper": {
      "command": "npx",
      "args": ["-y", "@dynomapper/mcp-server"],
      "env": {
        "MCP_API_KEY": "your_personal_access_token_here"
      }
    }
  }
}
```

### Hosted MCP Server

For MCP clients that cannot launch a process — GitHub's Copilot coding agent
among them — the DYNO Mapper tools are available at
`https://mcp.dynomapper.com/mcp` over Streamable HTTP, except the ones that need
a local file. It needs no installation and keeps no session: every request
authenticates with your personal access token in an `Authorization` header.

Point the client at that URL and pass the token:

```json
{
  "mcpServers": {
    "dynomapper": {
      "type": "http",
      "url": "https://mcp.dynomapper.com/mcp",
      "headers": {
        "Authorization": "Bearer your_personal_access_token_here"
      }
    }
  }
}
```

For Claude Code:

```bash
claude mcp add --transport http dynomapper https://mcp.dynomapper.com/mcp \
  --header "Authorization: Bearer your_personal_access_token_here"
```

`--http` and `MCP_TRANSPORT=http` are refused by this package, which speaks
stdio only; point a client that needs HTTP at the URL above instead.

### First call

`get_current_user` is the cheapest way to prove a token works: it reads no
project and needs no id, and it answers the account the token belongs to.

## Available Tools

The following tools are available through this MCP server:

| Tool                                   | Description                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `get_current_user`                     | Get current user information and account details                                  |
| `get_projects`                         | Get a list of projects                                                            |
| `get_project_details`                  | Get the details of a project                                                      |
| `create_project_from_url`              | Create a Project from URL                                                         |
| `create_project_from_sharepoint`       | Create a private Project from a SharePoint team site                              |
| `create_project_from_scratch`          | Create an empty project to build by hand                                          |
| `create_project_from_file`             | Create a Project from a text or xml file, or from a key returned by `upload_file` |
| `upload_file`                          | Upload a text or XML source and get the key an import accepts                     |
| `get_project_url_job_status`           | Get Project job status created by URL                                             |
| `get_project_file_job_status`          | Get status of project job created from text or xml file                           |
| `cancel_project_url_job`               | Cancel Project job created by URL                                                 |
| `cancel_project_file_job`              | Cancel project job created from text or xml file                                  |
| `refresh_project_url`                  | Refresh Project created by URL                                                    |
| `refresh_project_file`                 | Refresh Project created from text or xml file                                     |
| `cancel_project_url_refresh`           | Cancel Project refresh created by URL                                             |
| `cancel_project_file_refresh`          | Cancel project refresh job created from text or xml file                          |
| `get_project_sitemap_items`            | Get the sitemap items of a project                                                |
| `get_project_sitemap_item_details`     | Get the details of a specific sitemap item in a project                           |
| `create_project_sitemap_item`          | Add a page or container to the sitemap                                            |
| `bulk_update_project_sitemap_items`    | Assign a category, status, tags or colors to several items                        |
| `update_project_sitemap_item`          | Edit a page or container                                                          |
| `delete_project_sitemap_item`          | Delete an item and its subtree                                                    |
| `bulk_delete_project_sitemap_items`    | Delete several items in one call                                                  |
| `move_project_sitemap_item`            | Reparent or reposition an item                                                    |
| `bulk_move_project_sitemap_items`      | Move several items in one call                                                    |
| `duplicate_project_sitemap_item`       | Copy an item and its direct children                                              |
| `sort_project_sitemap_items`           | Sort the children of a container                                                  |
| `get_project_sitemap_undo`             | Inspect the next undo                                                             |
| `undo_project_sitemap_edit`            | Undo the last sitemap edit                                                        |
| `get_project_sitemap_redo`             | Inspect the next redo                                                             |
| `redo_project_sitemap_edit`            | Redo the last undone edit                                                         |
| `get_project_sitemap_item_content`     | List an item's content blocks                                                     |
| `replace_project_sitemap_item_content` | Replace an item's content blocks                                                  |
| `get_project_categories`               | Get the list of project categories                                                |
| `create_project_category`              | Create or restore a category                                                      |
| `update_project_category`              | Rename or recolour a category                                                     |
| `delete_project_category`              | Delete a category, or hide a shared one                                           |
| `move_project_category`                | Move a category among its siblings                                                |
| `get_project_workflow_statuses`        | Get the list of project workflow statuses                                         |
| `create_project_workflow_status`       | Create or restore a workflow status                                               |
| `update_project_workflow_status`       | Rename or recolour a workflow status                                              |
| `delete_project_workflow_status`       | Delete a workflow status, or hide a built-in one                                  |
| `move_project_workflow_status`         | Move a workflow status among its siblings                                         |
| `get_project_groups`                   | Get the list of project groups                                                    |
| `get_project_custom_logins`            | Get the list of custom login definitions                                          |
| `test_project_custom_login`            | Test custom login                                                                 |
| `get_project_custom_login_test_result` | Get custom login test result                                                      |
| `get_project_vacq_score`               | Get the VACQ (Accessibility, Content Quality, Visibility) score for a project     |
| `get_project_dacq_score`               | Get the DACQ score of a private SharePoint project                                |
| `get_project_login_inputs`             | List the sign-in prompts a crawl is waiting on                                    |
| `submit_project_login_input`           | Submit the value of a crawl's sign-in prompt                                      |
| `get_inventory`                        | Get inventory of a project                                                        |
| `get_inventory_summary`                | Get inventory summary of a project                                                |
| `get_inventory_item_links`             | Get links of a project sitemap item                                               |
| `get_inventory_link_occurrences`       | Get occurrences of a link in inventory                                            |
| `get_audit_results`                    | Get audit results of a project                                                    |
| `get_audit_score`                      | Get audit score of a project                                                      |
| `get_audit_broken_links`               | Get broken links audit of a project                                               |
| `get_audit_client_error`               | Get client errors audit of a project                                              |
| `get_audit_duplicate_title`            | Get duplicate title audit of a project                                            |
| `get_audit_missing_title`              | Get missing title audit of a project                                              |
| `get_audit_long_title`                 | Get long title audit of a project                                                 |
| `get_audit_duplicate_description`      | Get duplicate description audit of a project                                      |
| `get_audit_missing_description`        | Get missing description audit of a project                                        |
| `get_audit_long_description`           | Get long description audit of a project                                           |
| `get_audit_non_crawlable`              | Get non-crawlable pages audit of a project                                        |
| `get_audit_non_indexable`              | Get non-indexable pages audit of a project                                        |
| `get_audit_orphan_pages`               | Get orphan pages audit of a project                                               |
| `get_analytics_project`                | Get analytics of a project                                                        |
| `get_analytics_project_daily`          | Get analytics daily data                                                          |
| `get_analytics_project_traffic_source` | Get traffic sources                                                               |
| `get_analytics_project_events`         | Get events                                                                        |
| `get_analytics_project_pages`          | Get analytics of project pages                                                    |
| `get_analytics_sitemap_item`           | Get analytics of a sitemap item                                                   |
| `get_analytics_sitemap_item_daily`     | Get analytics daily data of a sitemap item                                        |
| `get_commented_items`                  | Get commented items for a project                                                 |
| `get_all_project_comments`             | Get every comment in a project                                                    |
| `get_item_comments`                    | Get item comments                                                                 |
| `create_item_comment`                  | Comment on an item                                                                |
| `update_item_comment`                  | Edit a comment                                                                    |
| `delete_item_comment`                  | Delete a comment                                                                  |
| `get_visibility_project_ranking`       | Get keywords ranking of a project                                                 |
| `get_visibility_project_score`         | Get keywords score of a project                                                   |
| `get_visibility_project_groups`        | Get keyword groups                                                                |
| `get_visibility_keyword_ranking`       | Get daily ranking of a keyword in a project                                       |
| `get_visibility_locales`               | Get visibility locales                                                            |
| `create_visibility_keyword_group`      | Create a keyword group                                                            |
| `delete_visibility_keyword_group`      | Delete a keyword group                                                            |
| `create_visibility_keywords`           | Create visibility keywords                                                        |
| `update_visibility_keywords_group`     | Update keyword groups for a project keyword                                       |
| `update_visibility_keyword_setting`    | Update settings for a project keyword                                             |
| `run_accessibility_checker`            | Run accessibility checker on a project                                            |
| `get_accessibility_results`            | Get accessibility results of a project                                            |
| `get_accessibility_login_inputs`       | List the sign-in prompts an accessibility run is waiting on                       |
| `submit_accessibility_login_input`     | Submit the value of an accessibility run's sign-in prompt                         |
| `delete_accessibility_report`          | Delete accessibility results of a project                                         |
| `get_accessibility_report_items`       | Get accessibility report items                                                    |
| `get_accessibility_history`            | Get results history of a project on a specified date range                        |
| `get_accessibility_score`              | Get accessibility score of a project                                              |
| `get_accessibility_report_problems`    | Get accessibility report problems                                                 |
| `get_accessibility_report_groups`      | Get accessibility report groups and subgroups                                     |
| `get_accessibility_report_item_result` | Get accessibility report item result                                              |
| `get_accessibility_pdf_files`          | List PDF accessibility files                                                      |
| `get_accessibility_pdf_guidelines`     | List PDF accessibility guidelines                                                 |
| `get_accessibility_pdf_item_result`    | Get PDF accessibility item result                                                 |
| `get_assignments`                      | Get a paginated list of assignments                                               |
| `get_project_assignments`              | Get a paginated list of assignments by project                                    |
| `get_assignments_totals`               | Get assignment totals                                                             |
| `get_project_assignments_totals`       | Get assignment totals by project                                                  |
| `get_assignment_details`               | Get an assignment by id                                                           |

## Workflows

Most tools stand alone. These sequences do not, and the calls only make sense in order.

### Create a project and wait for it

1. `create_project_from_url` (or `create_project_from_sharepoint`) submits the crawl and answers
   the new project id immediately, while the project still has no pages.
2. `get_project_url_job_status` reports progress: `PENDING` → `RUNNING` → `PERSIST` → `FINISHED`.
3. Once `FINISHED`, read `get_project_details`, `get_project_sitemap_items` and `get_inventory`.

`create_project_from_file` works the same way with its own poll tool,
`get_project_file_job_status`, and takes `type: 'text'` or `type: 'xml'`.

### Import a file without sending it twice

1. `upload_file` with `purpose: 'project_text'` (a plain URL list) or `purpose: 'project_xml'` (a
   sitemap) stores the file and returns a `key`.
2. Pass that `key` as `fileKey` to `create_project_from_file` with the matching `type`.
3. Poll `get_project_file_job_status` as above.

Keys are account-scoped and not consumed, so one upload can back several imports. A project created
from a file or a key cannot be refreshed — send a `url` when you need `refresh_project_file` later.

### Create a project by hand

1. `create_project_from_scratch` publishes an empty project and answers its id. `title` is
   optional; without it the project is called `Untitled Project`. There is no job to poll: the
   project is complete when the call returns.
2. The project starts with one root item, `Home` at `https://www.example.com`. Rename and
   re-address it with `update_project_sitemap_item`; editing the root's URL also rewrites the
   project's domain.
3. Add pages and containers with `create_project_sitemap_item`, and order them with
   `move_project_sitemap_item` or `sort_project_sitemap_items`.
4. Fill a page with `replace_project_sitemap_item_content`, and read it back with
   `get_project_sitemap_item_content`.
5. Read the finished project with `get_project_details` and `get_project_sitemap_items`.

### Answer a sign-in prompt

A crawl of a site behind a login, and an accessibility run on one, can pause for a value such as an
MFA code. The work stays `RUNNING` while it waits.

1. Poll `get_project_login_inputs` for a crawl, or `get_accessibility_login_inputs` for an
   accessibility run.
2. When an item reports `ready: 1`, send its value with `submit_project_login_input` or
   `submit_accessibility_login_input`.
3. Omit `value` to acknowledge a prompt that already carries what the run needs, such as an
   authenticator approval where the run reports the number to match.

An expired prompt is reported as completed rather than disappearing, so an id never comes to mean a
different prompt.

> [!WARNING]
> `create_project_from_sharepoint` takes the Microsoft account's username and password as tool
> arguments. They are forwarded to the crawler and never stored, but tool arguments appear in the
> conversation and in client-side logs.

### Edit a sitemap

1. Read the tree with `get_project_sitemap_items`; pass `parentId` to start at one item, send
   `maxLevel` to list up to 10 levels instead of the project's configured maximum, and follow
   `nextOffset` until it is null — a response holds 100 rows by default. Read a row below the cut by
   passing it as `parentId`, and use `get_project_sitemap_item_details` for the metadata of the item
   you are about to change.
2. `create_project_sitemap_item` adds a page or container, `update_project_sitemap_item` edits one,
   and `move_project_sitemap_item` or `bulk_move_project_sitemap_items` reparents or repositions it.
3. Read `get_project_categories` and `get_project_workflow_statuses` before assigning them with
   `bulk_update_project_sitemap_items`, which also sets tags and colors across a selection.
4. `replace_project_sitemap_item_content` replaces the content blocks of a page;
   `duplicate_project_sitemap_item` copies an item, and `sort_project_sitemap_items` orders a
   container's children.
5. Deletes are reversible: `delete_project_sitemap_item` and
   `bulk_delete_project_sitemap_items` remove a subtree, and `undo_project_sitemap_edit` restores
   it. Inspect the next step with `get_project_sitemap_undo`, and replay an undone step with
   `redo_project_sitemap_edit` after checking `get_project_sitemap_redo`.

## Changelog

The version history ships with the package as `CHANGELOG.md`. The repository's
own changelog also covers the container image, CI and deployment, which are not
part of this package.

## License

Apache-2.0. See [LICENSE](LICENSE).
