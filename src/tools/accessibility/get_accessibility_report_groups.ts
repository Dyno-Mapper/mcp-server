import { z } from 'zod';

export const get_accessibility_report_groups = {
  name: 'get_accessibility_report_groups',
  description: 'Get accessibility report groups and subgroups',
  inputSchema: z.object({
    projectId: z.number(),
    reportId: z.number(),
  }),
  outputSchema: z.object({
    groups: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        pages: z.number(),
        problems: z.number(),
        subgroups: z.array(
          z.object({
            id: z.number(),
            name: z.string(),
            pages: z.number(),
            problems: z.number(),
          })
        ),
      })
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/groups',
};
