import { z } from 'zod';
export const delete_accessibility_report = {
    name: 'delete_accessibility_report',
    description: 'Delete accessibility results of a project',
    inputSchema: z.object({
        projectId: z.number().describe('Project ID'),
        reportId: z.number().describe('Accessibility test report ID'),
    }),
    outputSchema: z.object({
        id: z.number().describe('Accessibility test report ID'),
    }),
    method: 'delete',
    path: '/v1/accessibility/{projectId}/{reportId}',
};
