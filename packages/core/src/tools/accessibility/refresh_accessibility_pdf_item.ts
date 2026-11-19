import { z } from 'zod';

export const refresh_accessibility_pdf_item = {
  name: 'refresh_accessibility_pdf_item',
  description:
    'Queue one file to be checked again, replacing the results it has now. Use it after the file itself has been fixed: the checker fetches it afresh and records new results against the same file row. ' +
    'A refresh spends one check from the plan’s allowance, so it is refused with `403 pdf_testing_limit_reached` before anything is sent when none is left. Asking for a file that is already queued or running queues it again rather than failing, and each call spends another check. ' +
    'A refresh keeps dismissals made with `always`, which are matched by file address and criterion, but drops ordinary dismissals and the notes on them, because those are attached to results the re-check replaces. ' +
    'A file that was uploaded for checking cannot be refreshed at all: the checker deletes the uploaded copy once it has checked it, so the call answers `409 pdf_item_uploaded` and the file has to be uploaded again. ' +
    '`502 accessibility_service_unavailable` queued nothing, so the call can be retried as it was.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project the file belongs to.'),
    itemId: z
      .number()
      .int()
      .describe(
        'ID of the PDF file — the `id` that `get_accessibility_pdf_files` reports.'
      ),
  }),
  outputSchema: z.object({
    scheduled: z
      .boolean()
      .describe(
        'Always `true`: the call only answers `202` once the checker has queued the file, so there is no partial success to report.'
      ),
  }),
  method: 'post',
  path: '/v1/accessibility/{projectId}/pdf/{itemId}/refresh',
};
