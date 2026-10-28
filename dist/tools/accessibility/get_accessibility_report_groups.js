import { z } from 'zod';
export const get_accessibility_report_groups = {
    name: 'get_accessibility_report_groups',
    description: 'Return the guideline groups and subgroups that a run found problems in, as a tree: a group is a WCAG guideline such as `1.1 Text Alternatives`, and the subgroups below it are the success criteria such as `1.1.1 Non-text Content`. ' +
        'Each level carries the pages affected and the problems recorded, so this drives a drill-down. ' +
        'Only groups that produced a problem appear, and within them only the subgroups that did, sorted by name — an empty `groups` array means the run found nothing, not that it is unfinished. ' +
        'The `id` values are the ones `get_accessibility_report_items` takes as `group` and `subgroup`. A run of another project, or an id that is not a run, answers `500` rather than `404`.',
    inputSchema: z.object({
        projectId: z.number().describe('Id of the project the run belongs to.'),
        reportId: z
            .number()
            .describe('Id of the accessibility run — the `id` from `get_accessibility_results`, or the `id` that `run_accessibility_checker` returned.'),
    }),
    outputSchema: z.object({
        groups: z
            .array(z.object({
            id: z
                .number()
                .describe('Id of the guideline group. Pass it as `group` to `get_accessibility_report_items` to see only the pages with problems in it.'),
            name: z
                .string()
                .describe('Name of the guideline group as the checker stores it, for example `1.1 Text Alternatives`. An empty string when no translation exists for it.'),
            pages: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Number of pages in the run with at least one problem in this group or in any of the subgroups listed under it.'),
            problems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Number of problem instances recorded for this group across all pages, including those filed under its subgroups.'),
            subgroups: z
                .array(z.object({
                id: z
                    .number()
                    .describe('Id of the subgroup. Pass it as `subgroup` to `get_accessibility_report_items` to see only the pages with problems in it.'),
                name: z
                    .string()
                    .describe('Name of the subgroup — the success criterion below the guideline, for example `1.1.1 Non-text Content`. An empty string when no translation exists for it.'),
                pages: z
                    .number()
                    .optional()
                    .nullish()
                    .default(null)
                    .describe('Number of pages in the run with at least one problem in this subgroup.'),
                problems: z
                    .number()
                    .optional()
                    .nullish()
                    .default(null)
                    .describe('Number of problem instances recorded for this subgroup across all pages.'),
            }))
                .describe('Subgroups of this group that produced a problem, sorted by name. Empty when all of its problems are filed directly under the group.'),
        }))
            .describe('Guideline groups that produced a problem, sorted by name. Empty when the run found nothing.'),
    }),
    method: 'get',
    path: '/v1/accessibility/{projectId}/{reportId}/groups',
};
