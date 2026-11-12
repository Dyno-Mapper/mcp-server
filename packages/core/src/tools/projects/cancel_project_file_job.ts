import { z } from 'zod';

export const cancel_project_file_job = {
  name: 'cancel_project_file_job',
  description:
    "Cancel the import started by `create_project_from_file` with `type: 'text'` or `type: 'xml'` and delete the project it created. The import service is told to stop and the project is marked deleted, so its id stops resolving in `get_project_details` and `get_project_file_job_status` answers 500 afterwards. Unlike `cancel_project_url_job` this is not limited to the pending state: an already-published project is deleted too. Another project type, an unknown id, one belonging to another account and an already-deleted one all answer 500 with the reason instead of 404. If the import service cannot be reached the project is still marked deleted and the call answers 500, so a retry reports that it is already deleted.",
  inputSchema: z.object({
    type: z
      .enum(['text', 'xml'])
      .describe(
        'Which import to cancel: `text` or `xml`. It must match the project’s import type, or the call answers 500.'
      ),
    id: z.coerce.number().describe('ID of the project to cancel and delete.'),
  }),
  outputSchema: z.object({
    id: z.number().describe('ID of the project that was deleted.'),
  }),
  method: 'delete',
  path: '/v1/project/{type}/{id}',
};
