import { z } from 'zod';

export const cancel_project_url_job = {
  name: 'cancel_project_url_job',
  description:
    'Cancel a queued crawl. ' +
    'Cancels a crawl that has not started yet and deletes the project it was creating; this is the only way to delete a project created from a URL. ' +
    'Only a project that is still pending can be canceled: once the crawl is running, or the project is published, the call answers 500 “Project is not in cancellable state”, the API’s way of reporting a failed precondition. ' +
    'An id that does not exist, or that belongs to another account, answers 500 rather than 404, and after a cancel succeeds the project no longer resolves in `get_project_details`. ' +
    'To stop a re-crawl of a published project, use `cancel_project_url_refresh`.',
  inputSchema: z.object({
    id: z.coerce
      .number()
      .describe(
        'ID of the project whose queued crawl to cancel, as returned by `create_project_from_url`.'
      ),
  }),
  outputSchema: z.object({
    id: z.coerce
      .number()
      .describe('ID of the project whose crawl was canceled.'),
  }),
  method: 'delete',
  path: '/v1/project/url/{id}',
};
