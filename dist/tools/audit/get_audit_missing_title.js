import { z } from 'zod';
export const get_audit_missing_title = {
    name: 'get_audit_missing_title',
    description: 'List pages with no title: the pages the latest run found without a `<title>`, one row per page, with the crawled page’s id and URL. A missing title leaves the search engine to write the headline of the result itself, which is why this list is worth clearing before duplicated or over-long titles. A title that exists but is too long is on `get_audit_long_title`, and a title shared by several pages on `get_audit_duplicate_title`. Reads the latest run only, so a page fixed since that run stays listed until the next audit replaces it; a project that has never been audited answers 500 `Project is not audited.` Requires the Content Audit feature, else 403 `feature_disabled`.',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
        search: z
            .string()
            .trim()
            .describe('Term matched against the URL of the affected page: one starting with `http` is matched as a URL prefix, any other is matched anywhere in the URL. Case sensitivity follows the database column’s collation; omitted returns every row.')
            .optional(),
        archived: z
            .enum(['1', '0'])
            .transform((v) => v === '1')
            .describe('Which archived state to list, as a string: `1` for issues the account has archived in the application, `0` for issues it has not. Defaults to `0`, so archived issues stay hidden unless asked for.')
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
            .describe('Number of pages matching the filters, across every page of results rather than just this one.'),
        limit: z
            .number()
            .describe('Page size used: the `limit` sent, or 20 when none was sent.'),
        page: z.number().describe('1-based number of the page returned.'),
        pageSize: z
            .number()
            .describe('Number of pages of results, `ceil(total / limit)` — how many pages the full list takes to read, not how many rows are on this page.'),
        items: z
            .array(z.object({
            id: z
                .number()
                .describe('Id of the crawled page record that has no title.'),
            url: z
                .string()
                .describe('URL of the page the run found without a title.'),
        }))
            .describe('The pages without a title on this page.'),
    }),
    method: 'get',
    path: '/v1/audit/{projectId}/missing-title',
};
