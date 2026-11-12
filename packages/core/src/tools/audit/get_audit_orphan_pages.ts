import { z } from 'zod';

export const get_audit_orphan_pages = {
  name: 'get_audit_orphan_pages',
  description:
    'List orphan pages: the pages the latest run found with no inbound link, one row per page that nothing else on the site links to, so a visitor reaches it only from outside the site or a bookmark. `id` identifies the run’s orphan-page record, not a crawled page — use `url` instead — and rows are in no guaranteed order. `get_audit_score` weights these: 9% of the score is the share of them archived. A page can be an orphan and miss a title or description too, so expect it on several lists. Reads the latest run only; a project that has never been audited answers 500 `Project is not audited.` Requires the Content Audit feature, else 403 `feature_disabled`.',
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
        'Number of orphan pages matching the filters, across every page of results rather than just this one.'
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
              'ID of the run’s orphan-page record. It is not a crawled page id — identify the page by `url`.'
            ),
          url: z
            .string()
            .describe('URL of a page on the site that nothing else links to.'),
        })
      )
      .describe('The pages nothing on the site links to, on this page.'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/orphan-pages',
};
