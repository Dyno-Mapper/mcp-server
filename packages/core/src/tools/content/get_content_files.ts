import { z } from 'zod';

export const get_content_files = {
  name: 'get_content_files',
  description:
    'List the files a project stores, so a caller can offer a choice of existing files instead of another upload. ' +
    'The list is the project’s whole file store, including the files the application’s own editor uploaded, because both read one library. ' +
    'Pages are ordered by stored name, so the list reads alphabetically, and each item reports when it was written. ' +
    'Read on by passing the `nextCursor` of one response as the `cursor` of the next; a `null` `nextCursor` means the page was the last. ' +
    'A cursor belongs to one project, one kind of asset and one `search` value, so presenting it with another answers `400 invalid_cursor` rather than a page. The page size may change between pages.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project whose files to list.'),
    cursor: z
      .string()
      .optional()
      .describe(
        'Cursor to continue from, taken from the `nextCursor` of the previous response. Omit it for the first page.'
      ),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        'Maximum number of files to return. Defaults to 50; a value above 200 is lowered to 200 rather than refused, and a value below 1 to 1.'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Text the stored name must start with, matched as a prefix rather than anywhere in the name. A file is stored under the name it was uploaded with, so this narrows a file library usefully.'
      ),
  }),
  outputSchema: z.object({
    items: z
      .array(
        z.object({
          url: z.string().describe('Public address of the file.'),
          name: z
            .string()
            .describe(
              'Stored name of the file, without its extension — the label a `file` block shows for it.'
            ),
          size: z.number().describe('Length of the file in bytes.'),
          uploadedAt: z.iso
            .datetime()
            .nullable()
            .describe(
              'When the object was written, as an ISO 8601 timestamp in UTC. Null when the store did not report it.'
            ),
        })
      )
      .describe('The files on this page, in the order the store returns them.'),
    nextCursor: z
      .string()
      .nullable()
      .describe(
        'Cursor for the next page, for the `cursor` argument. Null when this page is the last one.'
      ),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/content/file',
};
