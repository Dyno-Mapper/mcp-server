import { z } from 'zod';

export const get_audit_non_indexable = {
  name: 'get_audit_non_indexable',
  description: 'Get non-indexable pages audit of a project',
  inputSchema: z.object({
    projectId: z.coerce.string().describe('Project ID'),
    search: z.string().optional().describe('Search for a specific URL'),
    archived: z
      .enum(['0', '1'])
      .optional()
      .describe('Filter by archived status'),
    limit: z.coerce
      .number()
      .optional()
      .describe('Limit the number of results returned per page'),
    page: z.coerce.number().optional().describe('Page number to retrieve'),
  }),
  outputSchema: z.object({
    total: z.number().describe('Total number of items'),
    limit: z.number().describe('Maximum number of items per page'),
    page: z.number().describe('Current page number'),
    pageSize: z.number().describe('Number of items on the current page'),
    items: z
      .array(
        z.object({
          id: z.number().describe('Page ID'),
          url: z.string().describe('Page URL'),
          status: z.number().describe('HTTP status code'),
          isExternal: z.boolean().describe('Whether the page is external'),
          robotsNoindex: z
            .boolean()
            .describe('Whether the page has a noindex directive'),
          robotsCrawlable: z
            .boolean()
            .describe('Whether the page is crawlable'),
          canonicalLink: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Canonical link of the page'),
        })
      )
      .describe('List of non-indexable pages'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/non-indexable',
};
