import { z } from 'zod';
export const get_projects = {
    name: 'get_projects',
    description: 'Get a list of projects',
    inputSchema: z.object({
        page: z.number().optional().describe('Page number (default: 1)'),
        search: z.string().optional().describe('Search query'),
        order: z
            .enum([
            'latest',
            'title',
            'items',
            'oldest',
            'latest_modified',
            'oldest_modified',
        ])
            .optional()
            .default('latest')
            .describe('Sort order (default: latest)'),
        filter: z
            .enum(['none', 'scheduled', 'archived'])
            .optional()
            .default('none')
            .describe('Filter projects by status'),
        group: z
            .number()
            .optional()
            .default(0)
            .describe('Filter by group ID (default: 0). Pass -1 to filter ungrouped projects'),
        limit: z
            .number()
            .min(10)
            .max(100)
            .optional()
            .describe('Results per page (Min: 10, Max: 100, default: 100)'),
    }),
    outputSchema: z.object({
        total: z.number().describe('Total number of projects'),
        limit: z.number().describe('Results per page'),
        page: z.number().describe('Current page number'),
        items: z.array(z.object({
            id: z.number().describe('Project ID'),
            alphaId: z.string().describe('Alpha ID'),
            type: z
                .enum(['scratch', 'crawler', 'xml', 'text', 'duplicate', 'merge'])
                .describe('Project type'),
            title: z.string().describe('Project title'),
            items: z.number().describe('Number of items in the project'),
            isPublic: z.boolean().describe('Whether the project is public'),
            domain: z.string().describe('Project domain'),
            groupId: z.number().nullable().describe('Group ID'),
            groupName: z.string().nullable().describe('Group name'),
            groupColor: z.string().nullable().describe('Group color'),
            logoUrl: z.string().describe('Logo URL'),
            thumbnail: z.string().nullable().describe('Thumbnail URL'),
            allowTextRefresh: z
                .boolean()
                .describe('Whether text refresh is allowed'),
            allowXmlRefresh: z.boolean().describe('Whether XML refresh is allowed'),
            createdAt: z.string().describe('Creation timestamp'),
            crawlDate: z.string().describe('Crawl timestamp'),
            sitemapUrl: z.string().describe('Sitemap URL'),
        })),
    }),
    method: 'get',
    path: '/v1/project',
};
