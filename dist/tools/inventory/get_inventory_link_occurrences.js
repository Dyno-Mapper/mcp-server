import { z } from 'zod';
export const get_inventory_link_occurrences = {
    name: 'get_inventory_link_occurrences',
    description: 'Get occurrences of a link in inventory',
    inputSchema: z.object({
        projectId: z.number().describe('Project ID'),
        linkId: z.number().describe('Link ID'),
        limit: z.coerce
            .number()
            .optional()
            .describe('Limit the number of results returned per page'),
        page: z.coerce.number().optional().describe('Page number to retrieve'),
        search: z
            .string()
            .trim()
            .optional()
            .describe('Search for a specific URL or title'),
    }),
    outputSchema: z.object({
        total: z.number().describe('Total number of items found'),
        limit: z.number().describe('Number of items per page'),
        page: z.number().describe('Current page number'),
        pageSize: z
            .number()
            .describe('Actual number of items in the current response'),
        items: z
            .array(z.object({
            id: z.number().describe('Unique identifier for the item'),
            url: z.string().describe('Full URL of the item'),
            title: z.string().describe('Page title or filename'),
            status: z.number().describe('HTTP status code'),
            linkText: z
                .string()
                .describe('Text of the link leading to this item'),
            metaDescription: z.string().describe('Meta description of the page'),
            metaKeywords: z.string().describe('Meta keywords of the page'),
        }))
            .describe('List of link occurrences'),
    }),
    method: 'get',
    path: '/v1/inventory/{projectId}/{linkId}/occurrences',
};
