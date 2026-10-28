import { z } from 'zod';

export const get_projects = {
  name: 'get_projects',
  description:
    'List projects. ' +
    'Lists the projects this account can read, one row per project, newest crawl first unless `order` says otherwise. ' +
    'Only published projects are listed by default: a project whose first crawl is still running does not appear here, though `get_project_details` reads it by id. Pass `filter` set to `archived` to list archived projects instead. ' +
    '`items` on each row is the count stored on the project, not a recount taken for this call. ' +
    '`limit` must be between 10 and 100, `page` is 1-based, and `total` is the number of projects matching the filters across every page. ' +
    'Group ids come from `get_project_groups`, and the categories and workflow statuses that label pages come from `get_project_categories` and `get_project_workflow_statuses`.',
  inputSchema: z.object({
    page: z
      .number()
      .optional()
      .describe(
        'Page of results to return, 1-based. Defaults to 1; the page size is `limit`, so the last page is `total` divided by `limit`, rounded up.'
      ),
    search: z
      .string()
      .optional()
      .describe(
        'Text to match anywhere in the project title; surrounding whitespace is trimmed before the match. Omit it to list projects regardless of title.'
      ),
    order: z
      .enum([
        'latest',
        'title',
        'items',
        'oldest',
        'latest_modified',
        'oldest_modified',
      ])
      .optional()
      .default('latest')
      .describe(
        'Sort order. `latest` (the default) is most recently crawled first, `oldest` the reverse of that, `title` sorts alphabetically, `items` puts the projects with the most items first, and `latest_modified` / `oldest_modified` sort by when the project record was last changed.'
      ),
    filter: z
      .enum(['none', 'scheduled', 'archived'])
      .optional()
      .default('none')
      .describe(
        'Which projects to list. `none` (the default) lists published projects only; `scheduled` narrows that to projects with a weekly or monthly crawl schedule; `archived` lists archived projects and nothing else.'
      ),
    group: z
      .number()
      .optional()
      .default(0)
      .describe(
        'Project group to list, using an id from `get_project_groups`. Pass -1 to list only projects that are in no group. Omit it — or send 0 — to list grouped and ungrouped projects together.'
      ),
    limit: z
      .number()
      .min(10)
      .max(100)
      .optional()
      .describe(
        'Page size. Minimum 10, maximum 100, default 100. A value outside the range is rejected with 400.'
      ),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of projects matching the filters, across every page — not the number of rows in `items`.'
      ),
    limit: z
      .number()
      .describe(
        'Page size this result was built with: `limit` as sent, or the default of 100.'
      ),
    page: z
      .number()
      .describe(
        'Page number this result holds: `page` as sent, or the default of 1.'
      ),
    items: z.array(
      z.object({
        id: z
          .number()
          .describe('Numeric project id, used by every other project tool.'),
        alphaId: z
          .string()
          .describe(
            'Opaque alphanumeric id the application uses in its own URLs, such as `sitemapUrl`. It encodes the same project as `id`, and it is never accepted in place of `id`.'
          ),
        type: z
          .enum(['scratch', 'crawler', 'xml', 'text', 'duplicate', 'merge'])
          .describe(
            'How the project was created. `crawler` is a crawl of a website (`create_project_from_url` or `create_project_from_sharepoint`), `text` an imported text list of URLs (`create_project_from_file` with `type` set to `text`), `xml` an imported XML sitemap (`create_project_from_file` with `type` set to `xml`). `scratch` is a project built by hand in the application, `duplicate` one copied from another project, and `merge` one combined from several; no tool here creates those three.'
          ),
        title: z
          .string()
          .describe(
            'Title of the project: the address it was created from, without the scheme, for a crawled project, or the imported filename. An empty string when the application never recorded one.'
          ),
        items: z
          .number()
          .describe(
            'Item count stored on the project row — the figure the project list of the application shows. It is a saved count rather than one taken for this call, so it is not guaranteed to match the pages and folders currently in the sitemap.'
          ),
        isPublic: z
          .boolean()
          .describe(
            'True when the share record of the project is public. It is stored separately from `isPrivate`, so the two flags can disagree.'
          ),
        isPrivate: z
          .boolean()
          .describe(
            'Private project: not publicly reachable. Every project created by `create_project_from_sharepoint` is stored private.'
          ),
        isSharepoint: z
          .boolean()
          .describe(
            'True when the project was created from a SharePoint site with `create_project_from_sharepoint`.'
          ),
        domain: z
          .string()
          .describe(
            'Hostname the project was created from, for example `example.com`. An empty string for an import that has no host; never null.'
          ),
        groupId: z
          .number()
          .nullish()
          .describe(
            'Project group the project is filed under, as an id from `get_project_groups`. Null when it is in no group.'
          ),
        groupName: z
          .string()
          .nullish()
          .describe(
            'Name of that group. Null when the project is in no group.'
          ),
        groupColor: z
          .string()
          .nullish()
          .describe(
            'Colour the application paints that group with. Null when the project is in no group, or when the group has no colour set.'
          ),
        logoUrl: z
          .string()
          .describe(
            'URL of the logo of the project, served by the DYNO Mapper application and not by this API. It always answers, falling back to a default, and carries a version query when a custom logo is set.'
          ),
        thumbnail: z
          .string()
          .nullish()
          .describe(
            'Screenshot of the project, captured by the application. Null until the first capture finishes, and never set for a private SharePoint project, whose sign-in page is all a capture would show.'
          ),
        allowTextRefresh: z
          .boolean()
          .describe(
            'True when the project can be refreshed with `refresh_project_file` using `type` set to `text`. Only a text import created from a `url` can be: a project created from an uploaded file, or any project that is not a text import, answers false.'
          ),
        allowXmlRefresh: z
          .boolean()
          .describe(
            'True when the project can be refreshed with `refresh_project_file` using `type` set to `xml`. Only an XML import created from a `url` can be: a project created from an uploaded file, or any project that is not an XML import, answers false.'
          ),
        createdAt: z
          .string()
          .describe('ISO 8601 date and time the project was created.'),
        crawlDate: z
          .string()
          .describe(
            'ISO 8601 date and time of the most recent crawl of the project. A project that has never been crawled reports its creation date here instead, so this is never null.'
          ),
        sitemapUrl: z
          .string()
          .describe(
            'URL of the project in the DYNO Mapper web application, built from `alphaId`. Open it in a browser; it is not something this server calls.'
          ),
      })
    ),
  }),
  method: 'get',
  path: '/v1/project',
};
