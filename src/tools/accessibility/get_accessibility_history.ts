import { z } from 'zod';

export const get_accessibility_history = {
  name: 'get_accessibility_history',
  description: 'Get results history of a project on a specified date range',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    startDate: z.iso.date().optional().describe('The start date (YYYY-MM-DD)'),
    endDate: z.iso.date().optional().describe('The end date (YYYY-MM-DD)'),
  }),
  outputSchema: z.object({
    data: z
      .array(
        z.object({
          id: z.number().describe('The ID of the history entry'),
          date: z.iso.datetime().describe('The date of the history entry'),
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
          score: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Accessibility score (0.0 - 1.0)'),
        })
      )
      .describe('An array of accessibility history results'),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/history',
};
