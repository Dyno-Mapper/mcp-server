import { z } from 'zod';

export const get_accessibility_history = {
  name: 'get_accessibility_history',
  description: 'Get results history of a project on a specified date range',
  inputSchema: z.object({
    projectId: z.number(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
  outputSchema: z.object({
    data: z.array(
      z.object({
        id: z.number(),
        date: z.string(),
        knownProblems: z.number(),
        likelyProblems: z.number(),
        potentialProblems: z.number(),
        score: z.number(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/history',
};
