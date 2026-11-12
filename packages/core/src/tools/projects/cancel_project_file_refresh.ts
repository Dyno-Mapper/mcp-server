import { z } from 'zod';

export const cancel_project_file_refresh = {
  name: 'cancel_project_file_refresh',
  description:
    "Cancel a queued or running refresh started by `refresh_project_file` with `type: 'text'` or `type: 'xml'`, and leave the project as it is. The call is idempotent: a project with no outstanding refresh still answers 200 with its id, so it is safe to call when it is not known whether one is still running. Only a project that can be refreshed at all can be canceled here — one that is not published, was created from an uploaded `file` or a `fileKey`, is of another `type`, is deleted or belongs to another account all answer 500 with the reason. Re-queue the refresh with `refresh_project_file` and follow it with `get_project_file_job_status`.",
  inputSchema: z.object({
    type: z
      .enum(['text', 'xml'])
      .describe(
        'Which refresh to cancel: `text` or `xml`. It must match the project’s import type, or the call answers 500.'
      ),
    id: z.coerce
      .number()
      .describe('ID of the project whose refresh to cancel.'),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'ID of the project whose refresh was canceled, whether or not one was outstanding.'
      ),
  }),
  method: 'delete',
  path: '/v1/project/{type}/{id}/refresh',
};
