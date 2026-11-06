import { z } from 'zod';
import {
  WORKFLOW_STATUS_KEY_DESCRIPTION,
  workflowStatusSchema,
} from '../schemas/project.js';

export const move_project_workflow_status = {
  name: 'move_project_workflow_status',
  description:
    'Move a workflow status. ' +
    'Reorders a status within its list, moves it under another status, or lifts it back to the top level. ' +
    '`parentKey` names the list to move into — omit it, or send null, for the top level — and `afterKey` the position inside it, with null meaning first. ' +
    'Statuses are one level deep, so nesting a status that is already nested, nesting one that has children, and naming the status as its own parent are refused. ' +
    'A built-in status can be reordered but not nested. ' +
    'Answers the status that was moved.',
  inputSchema: z.object({
    key: z.string().describe(WORKFLOW_STATUS_KEY_DESCRIPTION),
    parentKey: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .describe(
        'Key of the status to move this one under, or null for the top level. A key in a body is plain text, so `wfs#12` is sent as it is. Omit it to leave the status at the top level.'
      ),
    afterKey: z
      .string()
      .min(1)
      .nullable()
      .optional()
      .describe(
        'Key of the status to place this one after, inside the list named by `parentKey`. Null puts it first in that list.'
      ),
  }),
  outputSchema: workflowStatusSchema,
  method: 'post',
  path: '/v1/project/workflow-status/{key}/move',
};
