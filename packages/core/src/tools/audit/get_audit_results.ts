import { z } from 'zod';

export const get_audit_results = {
  name: 'get_audit_results',
  description:
    'List a project’s audit runs, newest first: one row per run with the issue counts that run recorded. This is the audit history, not the current state — the eleven issue tools and `get_audit_score` read the latest run alone, so use this to show progress between runs or to find out when a count was taken. Each count is what the run found minus what the account has archived since. A project that has never been audited answers an empty page, `total` 0 with no items, rather than an error, and audits themselves are started in the application. Requires the Content Audit feature, else 403 `feature_disabled`.',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    limit: z.coerce
      .number()
      .optional()
      .describe('Number of runs to return per page. Defaults to 20.'),
    page: z.coerce
      .number()
      .optional()
      .describe('Page to return, 1-based. Defaults to 1.'),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of audit runs the project has, across every page rather than just this one.'
      ),
    limit: z
      .number()
      .describe('Page size used: the `limit` sent, or 20 when none was sent.'),
    page: z.number().describe('1-based number of the page returned.'),
    pageSize: z
      .number()
      .describe(
        'Number of pages of runs, `ceil(total / limit)` — how many pages the full history takes to read, not how many runs are on this page.'
      ),
    items: z
      .array(
        z.object({
          date: z.iso
            .datetime()
            .describe(
              'When the run was recorded, as an ISO 8601 date and time in UTC. Runs have no id, so order and key on this field.'
            ),
          brokenLinks: z
            .number()
            .describe(
              'Links the run found broken (a status of 400 or above), minus those archived since.'
            ),
          clientError: z
            .number()
            .describe(
              'Links the run found answering with a 4xx status, minus those archived since.'
            ),
          duplicateTitle: z
            .number()
            .describe(
              'Duplicated titles the run found, minus those archived since.'
            ),
          missingTitle: z
            .number()
            .describe(
              'Pages the run found without a title, minus those archived since.'
            ),
          longTitle: z
            .number()
            .describe(
              'Pages the run found with a title over the application’s limit, minus those archived since.'
            ),
          duplicateDescription: z
            .number()
            .describe(
              'Duplicated meta descriptions the run found, minus those archived since.'
            ),
          missingDescription: z
            .number()
            .describe(
              'Pages the run found without a meta description, minus those archived since.'
            ),
          longDescription: z
            .number()
            .describe(
              'Pages the run found with a meta description over the application’s limit, minus those archived since.'
            ),
          nonCrawlable: z
            .number()
            .describe(
              'Pages robots directives stopped the run crawling, minus those archived since.'
            ),
          nonIndexable: z
            .number()
            .describe(
              'Pages the run recorded as excluded from search indexes, minus those archived since.'
            ),
          orphan: z
            .number()
            .describe(
              'Pages the run found with no inbound link, minus those archived since.'
            ),
          totalLinks: z
            .number()
            .describe(
              'Links the run recorded in total. It is the denominator of the content score in `get_audit_score`.'
            ),
        })
      )
      .describe('The runs on this page, newest first.'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}',
};
