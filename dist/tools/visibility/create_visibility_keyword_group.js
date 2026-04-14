import { z } from 'zod';
export const create_visibility_keyword_group = {
    name: 'create_visibility_keyword_group',
    description: 'Add a keyword group to a project',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
        name: z.string().min(1).max(255).describe('The name of the keyword group'),
    }),
    outputSchema: z.object({
        id: z.number().describe('The ID of the created keyword group'),
        name: z.string().describe('The name of the created keyword group'),
    }),
    method: 'post',
    path: '/v1/visibility/{projectId}/group',
};
