import { z } from 'zod';

export const unarchive_accessibility_pdf_results = {
  name: 'unarchive_accessibility_pdf_results',
  description:
    'Restore dismissed findings to the PDF file’s problem counts and recompute its `status`. The notes on them are dropped with the dismissal they were stored against, because a note is a field of the archive entry rather than an object of its own. ' +
    'Restoring also clears the “never report this again” marks that match those findings across the project, so the finding is reported normally by the next check of the same file instead of being dismissed on arrival. ' +
    'The batch is applied whole or not at all: an `ids` value that is not a result of this file answers `404 pdf_result_not_found` and nothing is written. ' +
    'Archiving the same findings again is the way to dismiss them once more, this time with `always` if they should stay dismissed.',
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
        'Results to restore, by the `id` that `get_accessibility_pdf_item_result` reports. Up to 200 per call, and every one of them has to belong to this file: one that does not answers `404` and nothing is written.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'ID of the file whose findings were restored — the `itemId` that was sent. Read `get_accessibility_pdf_item_result` for the findings as they now stand.'
      ),
  }),
  method: 'post',
  path: '/v1/accessibility/{projectId}/pdf/{itemId}/unarchive',
};
