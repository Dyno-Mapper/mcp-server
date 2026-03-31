import { z } from 'zod';
export const get_inventory_item_links = {
    name: 'get_inventory_item_links',
    description: 'Get links of a project sitemap item',
    inputSchema: z.object({
        projectId: z.number().describe('Project ID'),
        itemId: z.number().describe('Sitemap item ID'),
        limit: z.coerce
            .number()
            .optional()
            .describe('Maximum number of items per page'),
        page: z.coerce.number().optional().describe('Page number'),
        orderBy: z
            .enum(['occurrence', 'status', 'id', 'last_modified'])
            .optional()
            .describe('Order by field'),
        search: z.string().trim().optional().describe('Search query'),
        status: z
            .enum(['ok', 'bad', 'redirect', 'unexpected'])
            .optional()
            .describe('Filter by status'),
        type: z
            .enum(['page', 'image', 'file', 'document', 'audio', 'video'])
            .optional()
            .describe('Filter by type'),
        location: z
            .enum(['internal', 'external'])
            .optional()
            .describe('Filter by location'),
        language: z.string().optional().describe('Filter by language'),
    }),
    outputSchema: z.object({
        total: z.number().describe('Total number of items'),
        limit: z.number().describe('Number of items per page'),
        page: z.number().describe('Current page number'),
        pageSize: z.number().describe('Number of items on the current page'),
        items: z
            .array(z.object({
            id: z.number().describe('Item ID'),
            sourceTag: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Source tag'),
            url: z.string().describe('URL of the item'),
            title: z.string().describe('Title of the item'),
            status: z.number().describe('HTTP status code'),
            mimetype: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('MIME type'),
            encoding: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Character encoding'),
            isExternal: z.boolean().describe('Whether the link is external'),
            occurrences: z.number().describe('Number of occurrences'),
            linkText: z.string().describe('Text of the link'),
            metaDescription: z.string().describe('Meta description'),
            metaKeywords: z.string().describe('Meta keywords'),
            language: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Language code'),
            lastModified: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Last modified date'),
        }))
            .describe('List of inventory item links'),
    }),
    method: 'get',
    path: '/v1/inventory/{projectId}/{itemId}',
};
