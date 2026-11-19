import { z } from 'zod';

export const delete_accessibility_pdf_item = {
  name: 'delete_accessibility_pdf_item',
  description:
    'Drop one file out of the project’s PDF list: `get_accessibility_pdf_files` stops returning it, and every call that names it afterwards answers `404 pdf_item_not_found`. ' +
    'Deleting also drops the “never report this again” marks its findings had set. Those marks are matched by file address and criterion across the project, so a file that is deleted and later found again is checked afresh instead of being quietly dismissed. ' +
    'The checks it spent are not given back: the plan’s allowance counts files in the project, which deleting one does not reduce. ' +
    'Answers `200` with the deleted ID rather than an empty body, so a caller can log what went. A file of another project, one already deleted and an `itemId` that is not a number all answer `404 pdf_item_not_found`, so a file cannot be found by probing.',
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
    id: z
      .number()
      .describe(
        'ID of the file that was deleted — the `itemId` that was sent, which `get_accessibility_pdf_files` no longer lists.'
      ),
  }),
  method: 'delete',
  path: '/v1/accessibility/{projectId}/pdf/{itemId}',
};
