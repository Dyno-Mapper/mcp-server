import { z } from 'zod';

export const get_accessibility_report_groups = {
  name: 'get_accessibility_report_groups',
  description: 'Get accessibility report groups and subgroups',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    reportId: z.number().describe('The ID of the report'),
  }),
  outputSchema: z.object({
    groups: z
      .array(
        z.object({
          id: z.number().describe('The ID of the group'),
          name: z.string().describe('The name of the group'),
          pages: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of pages in the group'),
          problems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of problems in the group'),
          subgroups: z
            .array(
              z.object({
                id: z.number().describe('The ID of the subgroup'),
                name: z.string().describe('The name of the subgroup'),
                pages: z
                  .number()
                  .optional()
                  .nullish()
                  .default(null)
                  .describe('Number of pages in the subgroup'),
                problems: z
                  .number()
                  .optional()
                  .nullish()
                  .default(null)
                  .describe('Number of problems in the subgroup'),
              })
            )
            .describe('An array of subgroups'),
        })
      )
      .describe('An array of accessibility report groups'),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/groups',
};
