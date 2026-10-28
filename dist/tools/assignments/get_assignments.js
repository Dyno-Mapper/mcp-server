import { z } from 'zod';
export const get_assignments = {
    name: 'get_assignments',
    description: 'List assignments: one page of the content assignments in the account, one row per assignment, spanning every project that still holds assignments. A caller without account-wide visibility sees only the assignments assigned to them. Filters combine with AND: `search` matches the assignment title only, while `category`, `workflow` and `tags` match the page the assignment is attached to, so a project-wide assignment never matches them. `total` counts every match before the page is cut, so request pages until you have collected that many rows. A row carries no users and no metadata: read one with `get_assignment_details`, and use `get_assignments_totals` or `get_project_assignments_totals` for counts alone.',
    inputSchema: z.object({
        page: z.coerce
            .number()
            .min(1)
            .default(1)
            .optional()
            .describe('Page of results to return, 1-based. Defaults to 1, and a value below 1 is rejected. A page past the last one is not an error: it answers an empty `items` array with the same `total`.'),
        limit: z.coerce
            .number()
            .min(1)
            .max(100)
            .default(20)
            .optional()
            .describe('Assignments per page, from 1 to 100. Defaults to 20; a larger value is rejected rather than clamped, so request at most 100 per call and page through the rest.'),
        search: z
            .string()
            .optional()
            .describe('Text that must appear inside the assignment’s own title, matched as `LIKE %…%`, so `%` and `_` keep their wildcard meaning. The title of the page the assignment is attached to is not searched. Omit it to keep every title.'),
        status: z
            .enum(['open', 'completed'])
            .optional()
            .describe('Restrict to `open` (still to be done) or `completed` (finished). Omit it for both; assignments in any other stored state are never returned.'),
        category: z.coerce
            .number()
            .optional()
            .describe('Id of a page category to filter by, from `get_project_categories`. Matched against the page the assignment is attached to, so an assignment covering the whole project never matches. Omit it to include every category.'),
        workflow: z
            .string()
            .optional()
            .describe('Id of a workflow status to filter by, from `get_project_workflow_statuses`, sent as the string form of the id, for example "12" rather than 12. Matched against the page the assignment is attached to, so an assignment covering the whole project never matches.'),
        tags: z
            .string()
            .transform((val) => val
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean))
            .optional()
            .describe('Comma-separated page tag names, for example `seo,legal`; spaces around each name are trimmed and empty entries dropped. An assignment matches when its page carries at least one of the names, and an assignment with no page never matches.'),
        createdStart: z.iso
            .date()
            .optional()
            .describe('Earliest creation date to include, as `YYYY-MM-DD` counted from 00:00:00 of that day. Applied only together with `createdEnd`: on its own it has no effect.'),
        createdEnd: z.iso
            .date()
            .optional()
            .describe('Latest creation date to include, as `YYYY-MM-DD` counted to 23:59:59 of that day. Applied only together with `createdStart`: on its own it has no effect.'),
        startStart: z.iso
            .date()
            .optional()
            .describe('Earliest start date to include, as `YYYY-MM-DD` counted from 00:00:00 of that day. Applied only together with `startEnd`: on its own it has no effect.'),
        startEnd: z.iso
            .date()
            .optional()
            .describe('Latest start date to include, as `YYYY-MM-DD` counted to 23:59:59 of that day. Applied only together with `startStart`: on its own it has no effect.'),
        dueStart: z.iso
            .date()
            .optional()
            .describe('Earliest due date to include, as `YYYY-MM-DD` counted from 00:00:00 of that day. Applied only together with `dueEnd`: on its own it has no effect.'),
        dueEnd: z.iso
            .date()
            .optional()
            .describe('Latest due date to include, as `YYYY-MM-DD` counted to 23:59:59 of that day. Unlike the other date pairs this end works alone, as a plain “due on or before” bound; send `dueStart` with it for a closed range.'),
        orderBy: z
            .enum(['created', 'start', 'due'])
            .optional()
            .default('created')
            .describe('Field to sort by: `created` (when the assignment was created), `start` (the start date of its window) or `due` (its deadline). Defaults to `created`.'),
        orderDir: z
            .enum(['asc', 'desc'])
            .optional()
            .default('desc')
            .describe('Direction of the sort: `asc` puts the oldest or earliest first, `desc` the newest or latest. Defaults to `desc`, so the default listing is newest-created first.'),
        filterByUserId: z
            .string()
            .transform((val) => val
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id)))
            .optional()
            .describe('Comma-separated user ids to narrow the list to, for example `12,34`; an assignment matches when at least one of those users is assigned to it. Only a caller who may see other people’s assignments can narrow by somebody else — for everyone else the value is ignored and their own id is used. Omit it rather than sending it empty, which is read as user id `0` and matches nothing.'),
    }),
    outputSchema: z.object({
        total: z
            .number()
            .describe('Number of assignments matching the filters across every page, before paging. Paginate on this figure: it does not change as you walk the pages.'),
        limit: z
            .number()
            .describe('Maximum number of assignments this page returns; the `limit` you asked for, or its default of 20.'),
        page: z
            .number()
            .describe('Page number these items belong to; the `page` you asked for, or 1.'),
        pageSize: z
            .number()
            .describe('Computed as `ceil(total / limit)`: the number of pages of this size needed to hold every match — not the number of rows on this page, which is `items.length`. Despite the name, do not use it as a page size.'),
        items: z
            .array(z.object({
            id: z
                .number()
                .describe('Id of the assignment. Use it with `get_assignment_details`, the only tool that returns one assignment on its own.'),
            projectId: z
                .number()
                .describe('Id of the project the assignment belongs to. Read the project with `get_project_details`.'),
            itemId: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Id of the inventory page the assignment is attached to. `null` for an assignment that covers the project as a whole instead of one page: the stored value is `0`, reported here as `null`.'),
            title: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Title of the assignment itself, as whoever created it wrote it — not the page title, which is `itemTitle`. `null` when the assignment has no title.'),
            note: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Free-form note stored on the assignment. `null` when it has none.'),
            type: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Assignment type as stored on the record. Neither the schema nor the handler constrains or enumerates it, so treat it as free-form text. `null` when unset.'),
            status: z
                .enum(['open', 'completed'])
                .describe('`open` while the assignment is still to be done, `completed` once it has been finished. Derived from the stored state: open is state 1 and completed is state 2, and no other state reaches this list.'),
            itemTitle: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Title of the page the assignment is attached to, taken from the project inventory. `null` when the assignment covers the whole project rather than a page.'),
            url: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('URL of the page the assignment is attached to, as crawled. `null` when the assignment covers the whole project rather than a page.'),
            startDate: z.iso
                .datetime()
                .describe('Start of the window the assignment is planned for, as an ISO 8601 date and time in UTC with a trailing `Z`.'),
            dueDate: z.iso
                .datetime()
                .describe('Deadline of the assignment, as an ISO 8601 date and time in UTC with a trailing `Z`. An open assignment whose due date has passed is what the totals tools count as past due.'),
            created: z.iso
                .datetime()
                .describe('When the assignment was created, as an ISO 8601 date and time in UTC with a trailing `Z`. This is the field the default sort uses.'),
            finished: z.iso
                .datetime()
                .optional()
                .nullish()
                .default(null)
                .describe('When the assignment was completed, as an ISO 8601 date and time in UTC with a trailing `Z`. `null` until it has been completed.'),
        }))
            .describe('Assignments on this page, already sorted by `orderBy` and `orderDir`. Empty when the requested page is past the last one.'),
    }),
    method: 'get',
    path: '/v1/assignments',
};
