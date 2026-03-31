import { z } from 'zod';

export const get_accessibility_score = {
  name: 'get_accessibility_score',
  description: 'Get accessibility score of a project',
  inputSchema: z.object({
    projectId: z.number(),
  }),
  outputSchema: z.object({
    score: z.number(),
    avgKnownProblems: z.number(),
    avgLikelyProblems: z.number(),
    avgPotentialProblems: z.number(),
    movedAvgKnownProblems: z.number(),
    movedAvgLikelyProblems: z.number(),
    movedAvgPotentialProblems: z.number(),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/score',
};
