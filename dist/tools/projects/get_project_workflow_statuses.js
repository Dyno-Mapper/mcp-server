import { z } from 'zod';
export const get_project_workflow_statuses = {
    name: 'get_project_workflow_statuses',
    description: 'Get the list of project workflow statuses',
    inputSchema: z.object({}).describe('No input required'),
    outputSchema: z.object({
        items: z
            .array(z.object({
            id: z.union([z.number(), z.string()]).describe('Status ID'),
            key: z.string().describe('Status key'),
            name: z.string().describe('Status name'),
            parentId: z.string().nullable().describe('Parent ID'),
            color: z.string().nullable().describe('Status color'),
        }))
            .describe('List of project workflow statuses'),
    }),
    method: 'get',
    path: '/v1/project/workflow-status',
};
