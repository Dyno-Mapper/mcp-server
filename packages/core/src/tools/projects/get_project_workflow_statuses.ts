import { z } from 'zod';
import { workflowStatusSchema } from '../schemas/project.js';

export const get_project_workflow_statuses = {
  name: 'get_project_workflow_statuses',
  description:
    'List workflow statuses. ' +
    'Returns the statuses a sitemap page can be given, in the order the application offers them. ' +
    'The ten built-in statuses — `draft`, `publish`, `pending`, `complete`, `incomplete`, `action`, `leaveasis`, `improve`, `consolidate` and `remove` — exist for every account and are listed unless hidden, so the list can hold fewer than ten. ' +
    'Created statuses appear alongside them, and a nested status follows the statuses without a parent. ' +
    '`key` is what `get_project_sitemap_items` reports as `workflowStatus` and the value for the `workflow` filter of `get_assignments`. ' +
    'Built-in statuses use their key as their `id`; created ones have a numeric id. ' +
    '`editable: false` marks a built-in status: it can be recoloured, reordered and hidden, but not renamed, deleted or nested.',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    items: z
      .array(workflowStatusSchema)
      .describe(
        'The visible workflow statuses, in the account’s order, with nested statuses listed after the top-level ones.'
      ),
  }),
  method: 'get',
  path: '/v1/project/workflow-status',
};
