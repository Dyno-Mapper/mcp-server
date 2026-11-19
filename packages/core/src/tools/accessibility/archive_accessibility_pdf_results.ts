import { z } from 'zod';

export const archive_accessibility_pdf_results = {
  name: 'archive_accessibility_pdf_results',
  description:
    'Dismiss findings on one PDF file, removing them from its problem counts and moving them into its archived counts. The file’s `status` — `FAIL`, `CONDITIONAL PASS` or `PASS` — is recomputed from what is left, so dismissing the last known problem can turn a file into a pass. ' +
    'Dismissing is what makes a note possible: a note is stored on the archive entry, so a result that is not archived has nowhere to keep one. Omitting `note`, or sending an empty string, leaves any note already there untouched; use `set_accessibility_pdf_result_note` to clear one. ' +
    '`always` makes the dismissal survive the file being checked again, which is the difference between “this one is handled” and “never report this again for this address and criterion”. Without it the next check of the file reports the finding again as new. ' +
    'The batch is applied whole or not at all: an `ids` value that is not a result of this file answers `404 pdf_result_not_found` and nothing is written. Read the file’s results back with `get_accessibility_pdf_item_result`, whose `isArchived` says which findings this call took.',
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
    ids: z
      .array(z.number().int().positive())
      .min(1)
      .max(200)
      .describe(
        'Results to archive, by the `id` that `get_accessibility_pdf_item_result` reports. Up to 200 per call, and every one of them has to belong to this file: one that does not answers `404` and nothing is written.'
      ),
    always: z
      .boolean()
      .optional()
      .describe(
        'When true, the dismissal also survives a later check of the same file, matched by address and criterion. Defaults to false, which dismisses this result only.'
      ),
    note: z
      .string()
      .max(1000)
      .optional()
      .describe(
        'Note to store with the dismissal, for example why it was accepted. Up to 1000 characters. Omitting it, or sending an empty string, leaves any note already there untouched.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'ID of the file whose findings were archived — the `itemId` that was sent. Read `get_accessibility_pdf_item_result` for the findings as they now stand.'
      ),
  }),
  method: 'post',
  path: '/v1/accessibility/{projectId}/pdf/{itemId}/archive',
};
