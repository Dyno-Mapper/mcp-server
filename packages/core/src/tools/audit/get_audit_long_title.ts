import { z } from 'zod';

export const get_audit_long_title = {
  name: 'get_audit_long_title',
  description:
    'List pages with a long title: the pages whose title is longer than the application allows, one row per page, with the title text, its `length` in characters and the page URL. The threshold that put the page on the list is the application’s and is not returned, so compare `length` against the limit you intend to enforce. Search results truncate long titles, so their ends may never be shown. Pages with no title at all are on `get_audit_missing_title`, and titles shared by several pages on `get_audit_duplicate_title`. Reads the latest run only; a project that has never been audited answers 500 `Project is not audited.` Requires the Content Audit feature, else 403 `feature_disabled`.',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    search: z
      .string()
      .trim()
      .describe(
        'Term matched against the URL of the affected page: one starting with `http` is matched as a URL prefix, any other is matched anywhere in the URL. Case sensitivity follows the database column’s collation; omitted returns every row.'
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
        'Number of pages with a long title, across every page of results rather than just this one.'
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
          id: z.number().describe('Id of the crawled page record.'),
          title: z
            .string()
            .describe('The page’s title text, as the run recorded it.'),
          length: z
            .number()
            .describe(
              'Characters in `title` as measured by the run. The threshold that put the page on this list is the application’s and is not returned here.'
            ),
          url: z.string().describe('URL of the page with the long title.'),
        })
      )
      .describe('The pages with a long title on this page.'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/long-title',
};
