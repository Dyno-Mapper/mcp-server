import { z } from 'zod';

export const get_accessibility_report_problems = {
  name: 'get_accessibility_report_problems',
  description: 'Get accessibility report problems',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    reportId: z.number().describe('The ID of the report'),
  }),
  outputSchema: z.object({
    problems: z
      .array(
        z.object({
          title: z.string().describe('The title of the problem group'),
          totalPages: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The total number of pages in the report'),
          problems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The number of problems in the group'),
          pagesWithProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The number of pages with problems in the group'),
          pagesPassed: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('The number of pages passed in the group'),
        })
      )
      .describe('An array of accessibility report problems'),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/problems',
};
