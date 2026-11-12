import { z } from 'zod';

export const get_assignments_totals = {
  name: 'get_assignments_totals',
  description:
    'Get assignment totals: how many assignments exist in all, how many are open, how many are completed, how many were created in the last seven days and how many are past due. No individual assignment comes back, so use `get_assignments` when the rows are needed. The figures follow the caller’s reach rather than a named project, and a caller without account-wide visibility is always narrowed to their own assignments. An account holding assignments in zero or one project has no project id to key on, so the call fails rather than answering counts — for a single project use `get_project_assignments_totals`. `recent` and `pastDue` are measured at call time, so they change with no assignment edited.',
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
      .describe(
        'Comma-separated user ids to count assignments for, for example `12,34`; an assignment counts once when at least one of those users is assigned to it. Only a caller who may see other people’s assignments can narrow by somebody else — for everyone else the value is ignored and their own assignments are counted.'
      ),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Assignments in scope, counting both open and completed ones. Assignments in any other stored state are excluded from every count in this object.'
      ),
    completed: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe('Of `total`, the assignments already completed (state 2).'),
    open: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe('Of `total`, the assignments still to be done (state 1).'),
    recent: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Of `total`, the assignments created in the last seven days. The window is rolling and measured at the moment of the call rather than being a calendar week, so the number falls as assignments age past seven days.'
      ),
    pastDue: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Of `total`, the open assignments whose due date falls before today. Completed assignments are never counted here, however late they were finished.'
      ),
  }),
  method: 'get',
  path: '/v1/assignments/totals',
};
