import { z } from 'zod';
export const get_project_assignments_totals = {
    name: 'get_project_assignments_totals',
    description: 'Get totals for a project: the same five counts as `get_assignments_totals`, restricted to one project’s assignments — `total`, `open`, `completed`, `recent` (created in the last seven days) and `pastDue` (open and overdue). The numbers come from every assignment in the project, including any whose page no longer exists, so this is also the call to make when the account-wide totals fail. An id that is not in the account fails with `project_not_found` and one the caller may not read fails with `unauthorized_access`; a project with no assignments answers zeros rather than an error. `filterByUserId` narrows the counts only for a caller who may see other people’s assignments. Use `get_project_assignments` to list the assignments behind the numbers.',
    inputSchema: z.object({
        projectId: z.coerce
            .number()
            .describe('Id of the project, from `get_projects`.'),
        filterByUserId: z
            .string()
            .transform((val) => val
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id)))
            .optional()
            .describe('Comma-separated user ids to count assignments for, for example `12,34`; an assignment counts once when at least one of those users is assigned to it. Only a caller who may see other people’s assignments can narrow by somebody else — for everyone else the value is ignored and their own assignments are counted.'),
    }),
    outputSchema: z.object({
        total: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Assignments in scope, counting both open and completed ones. Assignments in any other stored state are excluded from every count in this object.'),
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
            .describe('Of `total`, the assignments created in the last seven days. The window is rolling and measured at the moment of the call rather than being a calendar week, so the number falls as assignments age past seven days.'),
        pastDue: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Of `total`, the open assignments whose due date falls before today. Completed assignments are never counted here, however late they were finished.'),
    }),
    method: 'get',
    path: '/v1/assignments/{projectId}/totals',
};
