import { z } from 'zod';
import {
  WORKFLOW_STATUS_KEY_DESCRIPTION,
  workflowStatusSchema,
} from '../schemas/project.js';

export const update_project_workflow_status = {
  name: 'update_project_workflow_status',
  description:
    'Update a workflow status. ' +
    'Renames a status the account created, sets or clears the color of any status including a built-in one, or both. ' +
    'Only the fields sent are written; `color: null` removes the color. ' +
    'Renaming does not change the key, because every item stores the key and a new one would orphan the pages carrying the status. ' +
    'A built-in status cannot be renamed and answers 409, though it can be recoloured; sending neither field answers 400 `nothing_to_update`. ' +
    'The `key` argument is the one `get_project_workflow_statuses` reports; a `#` in it is encoded as `%23`.',
  inputSchema: z.object({
    key: z.string().describe(WORKFLOW_STATUS_KEY_DESCRIPTION),
    name: z
      .string()
      .min(1)
      .max(255)
      .optional()
      .describe(
        'New name for the status, trimmed to 1 to 255 characters. Refused with 409 for a built-in status, whose key does not change.'
      ),
    color: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Color to paint the status with, as `#rrggbb`, or null to clear it. Sent alone, it recolours without touching the name.'
      ),
  }),
  outputSchema: workflowStatusSchema,
  method: 'patch',
  path: '/v1/project/workflow-status/{key}',
};
