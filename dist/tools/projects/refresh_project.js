import { z } from 'zod';
export const refresh_project = {
    name: 'refresh_project',
    description: 'Refresh a project from URL, text, or XML file',
    inputSchema: z.object({
        id: z.number().describe('Project ID'),
        source: z
            .enum(['url', 'text', 'xml'])
            .describe('Source of project creation'),
        speed: z
            .enum(['slower', 'slowest'])
            .optional()
            .describe('Speed of the crawl'),
        overwriteMetadata: z
            .boolean()
            .optional()
            .describe('Overwrite existing metadata'),
        addNewPages: z
            .boolean()
            .optional()
            .describe('Add new pages to the sitemap'),
        updateTitles: z.boolean().optional().describe('Update existing titles'),
        overwriteContent: z
            .boolean()
            .optional()
            .describe('Overwrite existing content'),
    }),
    outputSchema: z.object({
        id: z.number().describe('Job ID for tracking refresh progress'),
    }),
    method: 'post',
    path: '/v1/project/{source}/{id}/refresh',
};
