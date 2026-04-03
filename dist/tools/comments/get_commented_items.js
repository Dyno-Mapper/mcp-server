import { z } from 'zod';
export const get_commented_items = {
    name: 'get_commented_items',
    description: 'Get commented items for a project',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
        limit: z.coerce
            .number()
            .int()
            .positive()
            .transform((n) => Math.min(n, 100))
            .optional()
            .describe('The maximum number of items to return (max 100)'),
        page: z.coerce.number().optional().describe('The page number'),
        search: z
            .string()
            .trim()
            .optional()
            .describe('Search term to filter items'),
        orderBy: z
            .enum(['lastActivity', 'comments'])
            .optional()
            .describe('The field to order results by'),
    }),
    outputSchema: z.object({
        total: z.number().describe('The total number of commented items'),
        limit: z.number().describe('The maximum number of items per page'),
        page: z.number().describe('The current page number'),
        pageSize: z.number().describe('The number of items in the current page'),
        items: z
            .array(z.object({
            id: z.number().describe('The ID of the item'),
            title: z.string().describe('The title of the item'),
            type: z.enum(['link', 'container']).describe('The type of the item'),
            url: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('The URL of the item'),
            comments: z.number().describe('The number of comments on the item'),
            lastActivity: z.iso
                .datetime()
                .describe('The date and time of the last activity'),
        }))
            .describe('An array of commented items'),
    }),
    method: 'get',
    path: '/v1/comments/{projectId}',
};
