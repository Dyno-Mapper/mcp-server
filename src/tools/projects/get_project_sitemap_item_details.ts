import { z } from 'zod';

export const get_project_sitemap_item_details = {
  name: 'get_project_sitemap_item_details',
  description: 'Get the details of a specific sitemap item in a project',
  inputSchema: z.object({
    projectId: z.number().describe('Project ID'),
    itemId: z.number().describe('Item ID'),
  }),
  outputSchema: z.object({
    id: z.number().describe('Item ID'),
    title: z.string().describe('Item title'),
    url: z.string().describe('Item URL'),
    type: z.enum(['link', 'container']).describe('Item type'),
    category: z.number().nullable().describe('Category ID'),
    workflowStatus: z.string().nullable().describe('Workflow status'),
    priority: z.number().nullable().describe('Sitemap priority'),
    changeFrequency: z.string().describe('Sitemap change frequency'),
    metaKeywords: z.string().nullable().describe('Meta keywords'),
    metaDescription: z.string().nullable().describe('Meta description'),
    tags: z.array(z.string()).describe('Item tags'),
    thumbnail: z
      .object({
        title: z.string().describe('Thumbnail title'),
        sm: z.string().describe('Small thumbnail URL'),
        lg: z.string().describe('Large thumbnail URL'),
      })
      .nullable()
      .describe('Item thumbnails'),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/item/{itemId}',
};
