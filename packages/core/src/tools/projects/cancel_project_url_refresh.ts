import { z } from 'zod';

export const cancel_project_url_refresh = {
  name: 'cancel_project_url_refresh',
  description:
    'Cancel a project refresh. ' +
    'Cancels every queued or running refresh of a project and leaves the project and its pages as they are. ' +
    'Unlike the import refresh cancels this call is not idempotent: a project with nothing outstanding answers 500 “No outstanding refresh found for project ID {id}” — a failed precondition the API reports as 500 — so treat that message as “nothing to cancel” rather than retrying; an id that does not exist answers the same way as one belonging to another account. ' +
    'It does not stop the original crawl; use `cancel_project_url_job` for a crawl that has not started yet.',
  inputSchema: z.object({
    id: z.coerce
      .number()
      .describe(
        'ID of the project whose outstanding refresh to cancel, as returned by `create_project_from_url`.'
      ),
  }),
  outputSchema: z.object({
    id: z.coerce
      .number()
      .describe('ID of the project whose refresh was canceled.'),
  }),
  method: 'delete',
  path: '/v1/project/url/{id}/refresh',
};
