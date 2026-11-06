import { z } from 'zod';
import { WORKFLOW_STATUS_KEY_DESCRIPTION } from '../schemas/project.js';

export const delete_project_workflow_status = {
  name: 'delete_project_workflow_status',
  description:
    'Remove a workflow status. ' +
    'Takes the status out of this account’s list; one the account created is soft-deleted and can be revived by `create_project_workflow_status` with the same name, while a built-in status is only hidden for this account. ' +
    'Items keep the `workflowStatus` they carried, so a project filtered by the status still answers the same way; nested statuses keep a parent that is no longer listed. ' +
    'The call is idempotent and answers the removed key. ' +
    'The `key` argument is the one `get_project_workflow_statuses` reports; a `#` in it is encoded as `%23`.',
  inputSchema: z.object({
    key: z.string().describe(WORKFLOW_STATUS_KEY_DESCRIPTION),
  }),
  outputSchema: z.object({
    key: z.string().describe('Key of the status that was removed.'),
  }),
  method: 'delete',
  path: '/v1/project/workflow-status/{key}',
};
