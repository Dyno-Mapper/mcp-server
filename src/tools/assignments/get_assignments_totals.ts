import { z } from 'zod';

export const get_assignments_totals = {
  name: 'get_assignments_totals',
  description: 'Get assignment totals',
  inputSchema: z.object({
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
  path: '/v1/assignments/totals',
};
