import { z } from 'zod';

export const get_accessibility_report_problems = {
  name: 'get_accessibility_report_problems',
  description: 'Get accessibility report problems',
  inputSchema: z.object({
    projectId: z.number(),
    reportId: z.number(),
  }),
  outputSchema: z.object({
    problems: z.array(
      z.object({
        title: z.string(),
        totalPages: z.number(),
        problems: z.number(),
        pagesWithProblems: z.number(),
        pagesPassed: z.number(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/problems',
};
