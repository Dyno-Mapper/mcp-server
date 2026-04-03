import { z } from 'zod';
export const get_project_custom_login_test_result = {
    name: 'get_project_custom_login_test_result',
    description: 'Get custom login test result',
    inputSchema: z.object({
        id: z.string().describe('Test ID retrieved from the start endpoint'),
    }),
    outputSchema: z.object({
        id: z.string().describe('Test ID to retrieve the result'),
        success: z
            .boolean()
            .optional()
            .nullish()
            .default(false)
            .describe('Test success status'),
        reason: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Test result reason or status'),
    }),
    method: 'get',
    path: '/v1/project/custom-login/test',
};
