import { z } from 'zod';
export const update_visibility_keyword_setting = {
    name: 'update_visibility_keyword_setting',
    description: 'Set locale and device for multiple keywords',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
        ids: z.array(z.number()).min(1).describe('List of keyword IDs'),
        locale: z.string().describe('The locale of the keywords (e.g., en-us)'),
        device: z
            .enum(['desktop', 'tablet', 'mobile'])
            .describe('The device used for tracking'),
    }),
    outputSchema: z.object({
        result: z
            .array(z.object({
            id: z.number().describe('The ID of the keyword'),
            updated: z.boolean().describe('Whether the keyword was updated'),
            error: z
                .string()
                .optional()
                .nullish()
                .describe('Error message if the update failed'),
        }))
            .describe('The result of the update operation'),
    }),
    method: 'patch',
    path: '/v1/visibility/{projectId}/keyword-setting',
};
