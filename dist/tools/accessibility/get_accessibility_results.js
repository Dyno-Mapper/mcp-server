import { z } from 'zod';
export const get_accessibility_results = {
    name: 'get_accessibility_results',
    description: 'Get accessibility results of a project',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
        limit: z.coerce
            .number()
            .int()
            .positive()
            .transform((n) => Math.min(n, 1000))
            .optional()
            .describe('The number of results per page (max 1000)'),
        page: z.coerce
            .number()
            .int()
            .positive()
            .optional()
            .describe('The page number'),
    }),
    outputSchema: z.object({
        total: z.number().describe('Total number of results'),
        limit: z.number().describe('The number of results per page'),
        page: z.number().describe('The current page number'),
        pageSize: z.number().describe('The number of items in the current page'),
        items: z
            .array(z.object({
            id: z.number().describe('The ID of the accessibility report'),
            scheduled: z.boolean().describe('Whether the report was scheduled'),
            urls: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Number of URLs checked'),
            guidelines: z
                .array(z.string())
                .describe('Accessibility guidelines used'),
            error: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Error message if the report failed'),
            errorReason: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('The reason for the error if the report failed'),
            knownProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Number of known accessibility problems'),
            likelyProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Number of likely accessibility problems'),
            potentialProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Number of potential accessibility problems'),
            groups: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Total number of accessibility groups'),
            groupsFailed: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Number of accessibility groups that failed'),
            groupsPassed: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Number of accessibility groups that passed'),
            score: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Accessibility score (0-100)'),
            created: z.iso
                .datetime()
                .describe('The date and time the report was created'),
        }))
            .describe('An array of accessibility reports'),
    }),
    method: 'get',
    path: '/v1/accessibility/{projectId}',
};
