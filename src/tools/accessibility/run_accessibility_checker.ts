import { z } from 'zod';

export const run_accessibility_checker = {
  name: 'run_accessibility_checker',
  description: 'Run accessibility checker on a project',
  inputSchema: z.object({
    projectId: z.number(),
    guidelines: z
      .array(
        z.enum([
          'BITV1',
          '508',
          'STANCA',
          'WCAG1-A',
          'WCAG1-AA',
          'WCAG1-AAA',
          'WCAG2-A',
          'WCAG2-AA',
          'WCAG2-AAA',
          'WCAG21-A',
          'WCAG21-AA',
          'WCAG21-AAA',
          'WCAG22-A',
          'WCAG22-AA',
          'WCAG22-AAA',
        ])
      )
      .optional(),
    reportSettings: z
      .object({
        likelyProblems: z.boolean().optional(),
        potentialProblems: z.boolean().optional(),
        manualTests: z.boolean().optional(),
      })
      .optional(),
    authOptions: z
      .object({
        inputs: z.array(z.string()).optional(),
        basicAuth: z
          .object({
            username: z.string().optional(),
            password: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
  outputSchema: z.object({
    id: z.number(),
  }),
  method: 'post',
  path: '/v1/accessibility/{projectId}',
};
