import { z } from 'zod';
export const get_audit_non_indexable = {
    name: 'get_audit_non_indexable',
    description: 'List non-indexable pages: the pages the latest run recorded as excluded from search indexes. `robotsNoindex` reports whether robots directives tell search engines not to index it, `robotsCrawlable` whether those directives still allowed the crawler in, `isExternal` whether the page sits outside the project’s host, and `canonicalLink` the address the page declares as its canonical version, or `null` when it declares none. Crawling and indexing are separate decisions, so this is not the other half of `get_audit_non_crawlable`: a crawlable page can still be kept out of the index, so read the two together. Reads the latest run only; a project that has never been audited answers 500 `Project is not audited.` Requires the Content Audit feature, else 403 `feature_disabled`.',
    inputSchema: z.object({
        projectId: z.coerce.string().describe('The ID of the project'),
        search: z
            .string()
            .optional()
            .describe('Term matched against the URL of the affected page: one starting with `http` is matched as a URL prefix, any other is matched anywhere in the URL. Case sensitivity follows the database column’s collation; omitted returns every row.'),
        archived: z
            .enum(['0', '1'])
            .optional()
            .describe('Which archived state to list, as a string: `1` for issues the account has archived in the application, `0` for issues it has not. Defaults to `0`, so archived issues stay hidden unless asked for.'),
        limit: z.coerce
            .number()
            .optional()
            .describe('Number of rows to return per page. Defaults to 20.'),
        page: z.coerce
            .number()
            .optional()
            .describe('Page to return, 1-based. Defaults to 1.'),
    }),
    outputSchema: z.object({
        total: z
            .number()
            .describe('Number of pages excluded from search indexes, across every page of results rather than just this one.'),
        limit: z
            .number()
            .describe('Page size used: the `limit` sent, or 20 when none was sent.'),
        page: z.number().describe('1-based number of the page returned.'),
        pageSize: z
            .number()
            .describe('Number of pages of results, `ceil(total / limit)` — how many pages the full list takes to read, not how many rows are on this page.'),
        items: z
            .array(z.object({
            id: z.number().describe('Id of the crawled page record.'),
            url: z
                .string()
                .describe('URL of the page recorded as excluded from search indexes.'),
            status: z
                .number()
                .describe('HTTP status the run recorded for the page when it fetched it.'),
            isExternal: z
                .boolean()
                .describe('Whether the page is outside the project’s own host.'),
            robotsNoindex: z
                .boolean()
                .describe('Whether the page’s robots directives tell search engines not to index it.'),
            robotsCrawlable: z
                .boolean()
                .describe('Whether robots directives still allowed the run to crawl the page, so index exclusion can be read separately from access.'),
            canonicalLink: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('URL the page declares as its canonical version. Null when the page declares none.'),
        }))
            .describe('The pages excluded from search indexes, on this page.'),
    }),
    method: 'get',
    path: '/v1/audit/{projectId}/non-indexable',
};
