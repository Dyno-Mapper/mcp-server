import { z } from 'zod';

export const set_accessibility_pdf_result_note = {
  name: 'set_accessibility_pdf_result_note',
  description:
    'Write the reviewer’s note on one archived finding of a PDF file, replacing any note already there. An empty string clears it, which is the only way to clear one: `archive_accessibility_pdf_results` leaves an existing note alone when it carries none. ' +
    'The finding has to be archived first, because the note is stored on the archive entry: an archived finding is one whose `isArchived` is true in `get_accessibility_pdf_item_result`, and that call reports the note back as `note`. ' +
    'Unarchiving the finding drops the note with it, and so does a refresh that replaces the results. ' +
    'A finding that is not archived answers `409 pdf_result_not_archived`; archive it with `archive_accessibility_pdf_results` first. ' +
    'The value stored is the one sent with surrounding whitespace removed.',
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
    resultId: z
      .number()
      .int()
      .describe(
        'ID of one result of that file — the `id` that `get_accessibility_pdf_item_result` reports.'
      ),
    note: z
      .string()
      .max(1000)
      .describe(
        'Note to store, up to 1000 characters. An empty string clears the note.'
      ),
  }),
  outputSchema: z.object({
    note: z
      .string()
      .describe(
        'The note as it was stored, which is the value sent with surrounding whitespace removed. An empty string means the note was cleared.'
      ),
  }),
  method: 'put',
  path: '/v1/accessibility/{projectId}/pdf/{itemId}/results/{resultId}/note',
};
