import { z } from 'zod';

export const get_audit_results = {
  name: 'get_audit_results',
  description: 'Get audit results of a project',
  inputSchema: z.object({
    projectId: z.coerce.string().describe('Project ID'),
    limit: z.coerce
      .number()
      .optional()
      .describe('The number of results to return'),
    page: z.coerce
      .number()
      .optional()
      .describe('The page number of results to return'),
  }),
  outputSchema: z.object({
    total: z.number().describe('Total number of audit results'),
    limit: z.number().describe('The number of results returned per page'),
    page: z.number().describe('The current page number of results'),
    pageSize: z.number().describe('The number of results on the current page'),
    items: z
      .array(
        z.object({
          date: z.iso.datetime().describe('The date the audit was performed'),
          brokenLinks: z.number().describe('The number of broken links found'),
          clientError: z.number().describe('The number of client errors found'),
          duplicateTitle: z
            .number()
            .describe('The number of duplicate titles found'),
          missingTitle: z
            .number()
            .describe('The number of missing titles found'),
          longTitle: z
            .number()
            .describe('The number of titles that are too long'),
          duplicateDescription: z
            .number()
            .describe('The number of duplicate descriptions found'),
          missingDescription: z
            .number()
            .describe('The number of missing descriptions found'),
          longDescription: z
            .number()
            .describe('The number of descriptions that are too long'),
          nonCrawlable: z
            .number()
            .describe('The number of non-crawlable pages found'),
          nonIndexable: z
            .number()
            .describe('The number of non-indexable pages found'),
          orphan: z.number().describe('The number of orphan pages found'),
          totalLinks: z.number().describe('The total number of links analyzed'),
        })
      )
      .describe('The list of audit results'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}',
};
