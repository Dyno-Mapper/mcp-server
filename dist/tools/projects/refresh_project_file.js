import { z } from 'zod';
export const refresh_project_file = {
    name: 'refresh_project_file',
    description: 'Refresh Project created from text or xml file',
    inputSchema: z.object({
        type: z.enum(['text', 'xml']).describe('Project file type'),
        id: z.coerce.number().describe('Project ID'),
        speed: z.enum(['slower', 'slowest']).optional().describe('Crawl speed'),
        addNewPages: z.boolean().optional().describe('Whether to add new pages'),
        updateTitles: z.boolean().optional().describe('Whether to update titles'),
    }),
    outputSchema: z.object({
        id: z.number().describe('Project ID'),
    }),
    method: 'post',
    path: '/v1/project/{type}/{id}/refresh',
};
