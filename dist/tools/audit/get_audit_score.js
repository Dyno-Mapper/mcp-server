import { z } from 'zod';
export const get_audit_score = {
    name: 'get_audit_score',
    description: 'Get a project’s content audit score, computed from its latest run and reported on a 0-100 scale. Before the project’s first audit there is no latest run and the call answers zeros rather than failing, so it is safe to call for any project without checking first. `crawlability` and `indexability` stay null until the project has been crawled, and are always null for a private SharePoint project, whose site is not publicly indexable; `score` is unaffected either way, because it measures duplicated and orphaned content rather than search visibility. `get_audit_results` lists the runs behind the figure and the eleven issue tools break the same run down. Requires the Content Audit feature, else 403 `feature_disabled`.',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
    }),
    outputSchema: z.object({
        score: z
            .number()
            .describe('Content score for the latest run, 0-100. It starts from the share of crawled pages the run recorded no content issue for; when the run found orphan pages, the reported figure is 91% of that share plus 9% of the share of orphan pages that have been archived, rounded. A run with no orphan pages reports the page share alone.'),
        crawlability: z
            .number()
            .nullable()
            .describe('Share of the latest run’s URLs whose robots directives allow a crawl, as a percentage. Null until the project has been crawled, and always null for a private SharePoint project.'),
        indexability: z
            .number()
            .nullable()
            .describe('Share of the latest run’s URLs whose robots directives allow indexing, as a percentage. Null under the same conditions as `crawlability`.'),
    }),
    method: 'get',
    path: '/v1/audit/{projectId}/score',
};
