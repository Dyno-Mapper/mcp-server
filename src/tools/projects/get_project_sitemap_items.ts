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
    items: z
      .array(
        z.object({
          id: z.number().describe('Item ID'),
          title: z.string().describe('Item title'),
          url: z.string().nullable().describe('Item URL'),
          type: z.enum(['link', 'container']).describe('Item type'),
          category: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Category ID'),
          workflowStatus: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Workflow status'),
          parent: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Parent ID'),
          ordering: z.number().describe('Ordering of the item'),
          depth: z.number().describe('Depth of the item in the sitemap'),
          children: z.number().describe('Number of child items'),
          comments: z.number().describe('Number of comments'),
          linkStatus: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Link http status code'),
          linkType: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Link type'),
          backgroundColor: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Background color in hex format'),
          foregroundColor: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Foreground color in hex format'),
        })
      )
      .describe('List of sitemap items'),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/item',
};
