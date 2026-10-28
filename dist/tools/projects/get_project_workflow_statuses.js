import { z } from 'zod';
export const get_project_workflow_statuses = {
    name: 'get_project_workflow_statuses',
    description: 'List workflow statuses. ' +
        'Returns the statuses a sitemap page can be given, in the order the application offers them. ' +
        'The ten built-in statuses — `draft`, `publish`, `pending`, `complete`, `incomplete`, `action`, `leaveasis`, `improve`, `consolidate` and `remove` — are always present; statuses the account created appear alongside them, and a status with a parent is listed after the statuses without one. Within each group the order is the one the account set. ' +
        'Hidden statuses are left out. ' +
        '`key` is what a sitemap item reports as `workflowStatus`, see `get_project_sitemap_items`, and the value to send as the `workflow` filter of `get_assignments`. ' +
        'Built-in statuses use their key as their `id`; statuses the account created have a numeric id.',
    inputSchema: z.object({}).describe('No input required'),
    outputSchema: z.object({
        items: z
            .array(z.object({
            id: z
                .union([z.number(), z.string()])
                .describe('Identifier of the status: the key itself for a built-in status, a numeric id for one the account created.'),
            key: z
                .string()
                .describe('Stable key of the status, for example `publish`. This is the value an item carries in `workflowStatus`, and the value to send as the `workflow` filter of `get_assignments`.'),
            name: z
                .string()
                .describe('Name the application shows for the status.'),
            parentId: z
                .string()
                .nullish()
                .describe('Key of the parent status when this one is nested under another in the menu of the application. Null for a top-level status.'),
            color: z
                .string()
                .nullish()
                .describe('Colour the application paints the status with. Null when the status has no colour.'),
        }))
            .describe('The visible workflow statuses, built-in ones first and each nested status after its parent.'),
    }),
    method: 'get',
    path: '/v1/project/workflow-status',
};
