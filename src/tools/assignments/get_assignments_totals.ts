import { z } from 'zod';

export const get_assignments_totals = {
  name: 'get_assignments_totals',
  description: 'Get assignment totals',
  inputSchema: z.object({
    filterByUserId: z
      .string()
      .transform((val) =>
        val
          .split(',')
          .map((id) => Number(id.trim()))
          .filter((id) => !isNaN(id))
      )
      .optional()
      .describe('A comma-separated list of user IDs to filter by'),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe('The total number of assignments'),
    completed: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe('The number of completed assignments'),
    open: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe('The number of open assignments'),
    recent: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe('The number of recent assignments'),
    pastDue: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe('The number of past due assignments'),
  }),
  method: 'get',
  path: '/v1/assignments/totals',
};
