import { z } from 'zod';

export const get_audit_duplicate_title = {
  name: 'get_audit_duplicate_title',
  description: 'Get duplicate title audit of a project',
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
    total: z.number().describe('Total number of duplicate title records'),
    limit: z.number().describe('Maximum number of items per page'),
    page: z.number().describe('Current page number'),
    pageSize: z.number().describe('Number of items in the current page'),
    items: z
      .array(
        z.object({
          id: z.number().describe('Unique identifier for the page'),
          title: z.string().describe('The duplicate title string'),
          links: z.number().describe('Number of pages sharing this title'),
          urls: z.array(z.string()).describe('List of URLs sharing this title'),
        })
      )
      .describe('List of duplicate title audit items'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/duplicate-title',
};
