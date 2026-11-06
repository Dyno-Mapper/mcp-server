import { z } from 'zod';
import { workflowStatusSchema } from '../schemas/project.js';

export const create_project_workflow_status = {
  name: 'create_project_workflow_status',
  description:
    'Ensure a workflow status exists. ' +
    'Makes sure a status of this name is visible to the account and answers it; the key is derived from the name, lowercased with spaces replaced by underscores, because items store the key. ' +
    'A name that resolves to one of the ten built-in statuses answers that built-in and un-hides it; otherwise an existing visible or soft-deleted status is reused, and only then is a row created. ' +
    'Names longer than twenty characters, and nested statuses, are keyed `wfs#<id>`; the `key` argument takes that as `wfs%23<id>`, while `parentKey` takes it plain. ' +
    '`parentKey` nests the status one level deep. ' +
    'Read the list with `get_project_workflow_statuses`.',
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .max(255)
      .describe(
        'Name of the status. Trimmed; 1 to 255 characters. Its key is derived from it, and a status with that key or name is returned if one already exists.'
      ),
    parentKey: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .describe(
        'Key of the status to nest the new one under, or null for a top-level status. A key in a body is plain text, so `wfs#12` is sent as it is. A status can only be nested one level deep.'
      ),
  }),
  outputSchema: workflowStatusSchema,
  method: 'post',
  path: '/v1/project/workflow-status',
};
