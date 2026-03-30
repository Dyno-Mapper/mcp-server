import { z } from 'zod';

export const get_audit_missing_title = {
  name: 'get_audit_missing_title',
  description: 'Get missing title audit of a project',
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
    total: z.number().describe('Total number of pages missing a title'),
    limit: z.number().describe('Maximum number of items per page'),
    page: z.number().describe('Current page number'),
    pageSize: z.number().describe('Number of items in the current page'),
    items: z
      .array(
        z.object({
          id: z.number().describe('Unique identifier for the page'),
          url: z.string().describe('The URL of the page missing a title'),
        })
      )
      .describe('List of pages missing a title'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/missing-title',
};
