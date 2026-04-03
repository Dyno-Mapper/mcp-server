import { z } from 'zod';
export const cancel_project_url_job = {
    name: 'cancel_project_url_job',
    description: 'Cancel Project job created by URL',
    inputSchema: z.object({
        id: z.coerce.number().describe('Project ID'),
    }),
    outputSchema: z.object({
        id: z.coerce.number().describe('Project ID that was cancelled'),
    }),
    method: 'delete',
    path: '/v1/project/url/{id}',
};
