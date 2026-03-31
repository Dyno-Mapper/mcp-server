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
            .describe('Workflow status name'),
        priority: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Item priority'),
        changeFrequency: z.string().describe('Change frequency'),
        metaKeywords: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Meta keywords'),
        metaDescription: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Meta description'),
        tags: z
            .array(z.string().describe('Tag name'))
            .describe('List of tags associated with the item'),
        thumbnail: z
            .object({
            title: z.string().describe('Thumbnail title'),
            sm: z.string().describe('Small thumbnail URL'),
            lg: z.string().describe('Large thumbnail URL'),
        })
            .optional()
            .nullish()
            .default(null)
            .describe('Thumbnail information'),
        mode: z.enum(['', 'Slug', 'Static']).describe('URL mode'),
        slug: z.string().describe('URL slug'),
        staticUrl: z.string().describe('Static URL'),
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
        hreflang: z
            .array(z.object({
            href: z.string().describe('Hreflang URL'),
            lang: z.string().describe('Hreflang language code'),
        }))
            .describe('List of hreflang annotations'),
    }),
    method: 'get',
    path: '/v1/project/{projectId}/item/{itemId}',
};
