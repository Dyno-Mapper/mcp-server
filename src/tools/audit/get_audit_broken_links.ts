import { z } from 'zod';

export const get_audit_broken_links = {
  name: 'get_audit_broken_links',
  description: 'Get broken links audit of a project',
  inputSchema: z.object({
    projectId: z.number().describe('Project ID'),
    search: z.string().trim().describe('Search term').optional(),
    archived: z
      .enum(['1', '0'])
      .transform((v) => v === '1')
      .describe('Filter by archived status (1 or 0)')
      .optional(),
    limit: z.coerce
      .number()
      .describe('Maximum number of items per page')
      .optional(),
    page: z.coerce.number().describe('Page number').optional(),
  }),
  outputSchema: z.object({
    total: z.number().describe('Total number of broken links'),
    limit: z.number().describe('Maximum number of items per page'),
    page: z.number().describe('Current page number'),
    pageSize: z.number().describe('Number of items in the current page'),
    items: z
      .array(
        z.object({
          id: z.number().describe('Broken link ID'),
          url: z.string().describe('Broken link URL'),
          status: z.number().describe('HTTP status code'),
          occurrences: z.number().describe('Number of occurrences'),
        })
      )
      .describe('List of broken links'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/broken-links',
};
