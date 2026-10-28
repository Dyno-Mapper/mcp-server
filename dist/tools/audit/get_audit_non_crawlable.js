import { z } from 'zod';
export const get_audit_non_crawlable = {
    name: 'get_audit_non_crawlable',
    description: 'List non-crawlable pages: the pages the latest run was not allowed to crawl, one row per page whose robots directives kept the crawler out. `robotsAllowed` is the crawl decision the run recorded, `robotsNofollow` whether the page also tells crawlers not to follow its links, and `status` the HTTP status the run recorded when it fetched the page. Crawling and indexing are separate decisions: a crawlable page can still be kept out of the index. The pages robots exclude from the index are on `get_audit_non_indexable`. Reads the latest run only; a project that has never been audited answers 500 `Project is not audited.` Requires the Content Audit feature, else 403 `feature_disabled`.',
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
            .describe('Number of pages the run could not crawl, across every page of results rather than just this one.'),
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
                .describe('URL of the page the run was not allowed to crawl.'),
            status: z
                .number()
                .describe('HTTP status the run recorded for the page when it fetched it.'),
            robotsAllowed: z
                .boolean()
                .describe('Crawl decision the run recorded for the page: false when robots directives forbade the crawl. A run that recorded no decision also reports false.'),
            robotsNofollow: z
                .boolean()
                .describe('Whether the page’s robots directives tell crawlers not to follow its links.'),
        }))
            .describe('The pages the crawler was not allowed to fetch, on this page.'),
    }),
    method: 'get',
    path: '/v1/audit/{projectId}/non-crawlable',
};
