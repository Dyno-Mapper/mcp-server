import { z } from 'zod';
export const update_visibility_keywords_group = {
    name: 'update_visibility_keywords_group',
    description: 'Set keyword group for multiple keywords',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
        ids: z.array(z.number()).min(1).describe('List of keyword IDs to update'),
        groupId: z
            .number()
            .nullable()
            .optional()
            .describe('The ID of the keyword group to set. If null, the keyword will be removed from the group.'),
    }),
    outputSchema: z.object({
        ids: z.array(z.number()).describe('The IDs of the updated keywords'),
    }),
    method: 'patch',
    path: '/v1/visibility/{projectId}/keyword-group',
};
