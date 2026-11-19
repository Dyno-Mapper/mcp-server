import { z } from 'zod';

export const get_content_images = {
  name: 'get_content_images',
  description:
    'List the images a project stores, so a caller can offer a choice of existing pictures instead of another upload. ' +
    'The list is the project’s whole image store, including the images the application’s own editor uploaded, because both read one library. ' +
    'Pages are ordered by stored name, which for an image is the hash of its bytes, so the order carries no meaning. ' +
    'Read on by passing the `nextCursor` of one response as the `cursor` of the next; a `null` `nextCursor` means the page was the last. ' +
    'A cursor belongs to one project, one kind of asset and one `search` value, so presenting it with another answers `400 invalid_cursor` rather than a page. The page size may change between pages.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project whose images to list.'),
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
        'Maximum number of images to return. Defaults to 50; a value above 200 is lowered to 200 rather than refused, and a value below 1 to 1.'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Text the stored name must start with, matched as a prefix rather than anywhere in the name. An image is stored under the hash of its bytes, so this narrows an image library hardly at all.'
      ),
  }),
  outputSchema: z.object({
    items: z
      .array(
        z.object({
          url: z.string().describe('Public address of the image.'),
          hash: z
            .string()
            .describe(
              'SHA-1 the image is stored under, which is also its `name` here: a listing reports the stored name and an image is stored as its hash.'
            ),
          name: z
            .string()
            .describe('Stored name of the image, without its extension.'),
          size: z.number().describe('Length of the image in bytes.'),
          uploadedAt: z.iso
            .datetime()
            .nullable()
            .describe(
              'When the object was written, as an ISO 8601 timestamp in UTC. Null when the store did not report it.'
            ),
        })
      )
      .describe(
        'The images on this page, in the order the store returns them.'
      ),
    nextCursor: z
      .string()
      .nullable()
      .describe(
        'Cursor for the next page, for the `cursor` argument. Null when this page is the last one.'
      ),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/content/image',
};
