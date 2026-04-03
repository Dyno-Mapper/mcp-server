import { z } from 'zod';
export const get_accessibility_score = {
    name: 'get_accessibility_score',
    description: 'Get accessibility score of a project',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
    }),
    outputSchema: z.object({
        score: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The accessibility score (1 - 100)'),
        avgKnownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The average number of known problems'),
        avgLikelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The average number of likely problems'),
        avgPotentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The average number of potential problems'),
        movedAvgKnownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The difference in the average number of known problems'),
        movedAvgLikelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The difference in the average number of likely problems'),
        movedAvgPotentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The difference in the average number of potential problems'),
    }),
    method: 'get',
    path: '/v1/accessibility/{projectId}/score',
};
