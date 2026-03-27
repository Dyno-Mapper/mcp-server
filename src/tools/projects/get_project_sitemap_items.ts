import { z } from 'zod';

export const get_project_sitemap_items = {
  name: 'get_project_sitemap_items',
  description: 'Get the sitemap items of a project',
  inputSchema: z.object({
    projectId: z.number().describe('Project ID'),
    parentId: z.number().optional().describe('Parent item ID to filter by'),
    limit: z.number().optional().describe('Number of items to return'),
    offset: z.number().optional().describe('Offset for pagination'),
  }),
  outputSchema: z.object({
    parentId: z.number().nullable().describe('Parent ID'),
    total: z.number().describe('Total number of items'),
    limit: z.number().nullable().describe('Results per page'),
    offset: z.number().nullable().describe('Current offset'),
    nextOffset: z.number().nullable().describe('Next offset for pagination'),
    items: z.array(
      z.object({
        id: z.number().describe('Item ID'),
        title: z.string().describe('Item title'),
        url: z.string().nullable().describe('Item URL'),
        type: z.enum(['link', 'container']).describe('Item type'),
        category: z.number().nullable().describe('Category ID'),
        workflowStatus: z.string().nullable().describe('Workflow status'),
        parent: z.number().nullable().describe('Parent item ID'),
      })
    ),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/item',
};
