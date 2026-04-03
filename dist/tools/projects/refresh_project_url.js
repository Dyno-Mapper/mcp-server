import { z } from 'zod';
export const refresh_project_url = {
    name: 'refresh_project_url',
    description: 'Refresh Project created by URL',
    inputSchema: z.object({
        id: z.coerce.number().describe('Project ID'),
        speed: z
            .enum(['slower', 'slowest'])
            .optional()
            .describe('Crawl speed. Default: as fast as possible'),
        overwriteMetadata: z
            .boolean()
            .optional()
            .describe('Overwrite existing metadata'),
        addNewPages: z
            .boolean()
            .optional()
            .default(true)
            .describe('Add new pages to the sitemap'),
        updateTitles: z.boolean().optional().describe('Update existing titles'),
        overwriteContent: z
            .boolean()
            .optional()
            .describe('Overwrite existing content'),
        authOptions: z
            .object({
            inputs: z
                .array(z.string())
                .optional()
                .describe('Website authentication inputs (e.g., [email, password])'),
            basicAuth: z
                .object({
                username: z
                    .string()
                    .optional()
                    .describe('Website basic auth username'),
                password: z
                    .string()
                    .optional()
                    .describe('Website basic auth password'),
            })
                .optional()
                .describe('Website basic auth credentials'),
        })
            .optional()
            .describe('Website authentication options'),
    }),
    outputSchema: z.object({
        id: z.coerce.number().describe('Project ID'),
    }),
    method: 'post',
    path: '/v1/project/url/{id}/refresh',
};
