import { z } from 'zod';

export const get_project_assignments_totals = {
  name: 'get_project_assignments_totals',
  description: 'Get assignment totals by project',
  inputSchema: z.object({
    projectId: z.string(),
    filterByUserId: z.string().optional(),
  }),
  outputSchema: z.object({
    total: z.number(),
    completed: z.number(),
    open: z.number(),
    recent: z.number(),
    pastDue: z.number(),
  }),
  method: 'get',
  path: '/v1/assignments/{projectId}/totals',
};
