import { z } from 'zod';

export const get_audit_duplicate_title = {
  name: 'get_audit_duplicate_title',
  description:
    'List duplicated titles: the titles the latest run found on more than one page, one row per duplicated title rather than per page. `links` is how many pages the run recorded sharing it and `urls` lists their addresses, which together show whether a template is repeating a title or two pages merely collided. A page with no title is on `get_audit_missing_title` instead, and one whose title is too long on `get_audit_long_title`. Reads the latest run only, so a page fixed since that run stays listed until the next audit; a project that has never been audited answers 500 `Project is not audited.` Requires the Content Audit feature, else 403 `feature_disabled`.',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    search: z
      .string()
      .trim()
      .describe(
        'Term matched against the URL of the affected page: one starting with `http` is matched as a URL prefix, any other is matched anywhere in the URL. It narrows the groups to those with a matching page URL and filters `urls` to the matches, while `links` keeps counting the whole group; omitted lists every group.'
      )
      .optional(),
    archived: z
      .enum(['1', '0'])
      .transform((v) => v === '1')
      .describe(
        'Which archived state to list, as a string: `1` for issues the account has archived in the application, `0` for issues it has not. Defaults to `0`, so archived issues stay hidden unless asked for.'
      )
      .optional(),
    limit: z.coerce
      .number()
      .describe('Number of rows to return per page. Defaults to 20.')
      .optional(),
    page: z.coerce
      .number()
      .describe('Page to return, 1-based. Defaults to 1.')
      .optional(),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of duplicated titles matching the filters, across every page rather than just this one.'
      ),
    limit: z
      .number()
      .describe('Page size used: the `limit` sent, or 20 when none was sent.'),
    page: z.number().describe('1-based number of the page returned.'),
    pageSize: z
      .number()
      .describe(
        'Number of pages of results, `ceil(total / limit)` — how many pages the full list takes to read, not how many rows are on this page.'
      ),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Id of the run’s duplicated-title record. Identify the group by `title`, not by this id.'
            ),
          title: z
            .string()
            .describe('Title text the run found on more than one page.'),
          links: z
            .number()
            .describe(
              'Number of pages the run recorded sharing this title. Not narrowed by `search` — only `urls` is.'
            ),
          urls: z
            .array(z.string())
            .describe(
              'URLs of the pages sharing this title. With `search` set, only the pages whose URL matches are listed, so this can be shorter than `links`.'
            ),
        })
      )
      .describe(
        'The duplicated titles on this page, with the pages sharing each one.'
      ),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/duplicate-title',
};
