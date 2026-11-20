import { z } from 'zod';

export const store_content_file = {
  name: 'store_content_file',
  description:
    'Copy a file the account has already uploaded into the project’s file store, and answer the public address and label that a `file` block shows. ' +
    'Upload the file once with `upload_file` and the `sitemap_content_file` purpose, then send the key it returned here. Adoption is what makes the bytes public and what counts them against the account’s storage: until it runs, the upload waits in staging and expires there. ' +
    'A file is stored under the name it was uploaded with, so adopting a file of the same name again replaces the stored one: the address stays the same and only the difference in size counts. ' +
    'Pointing a block at it is a separate call: put the address in `properties.url` and the label in `properties.name` of a `file` block, with `properties.custom` set to `0` because a `file` reads no other key, and write the blocks with `replace_project_sitemap_item_content`. ' +
    'The account’s storage is checked before anything is copied, so a plan with no room left refuses the call and leaves the upload untouched.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project the file belongs to.'),
    fileKey: z
      .string()
      .min(1)
      .describe(
        'Key returned by `upload_file` for a file uploaded with the `sitemap_content_file` purpose. It is not a public link, and only the account that uploaded it can use it.'
      ),
  }),
  outputSchema: z.object({
    url: z
      .string()
      .describe(
        'Public address of the stored file. This is the value a `file` block holds as `properties.url`, with `properties.custom` set to `0`.'
      ),
    name: z
      .string()
      .describe(
        'Filename the uploader gave, sanitized and without its extension. It is the label a `file` block shows.'
      ),
    size: z.number().describe('Length of the stored file in bytes.'),
    mimeType: z
      .string()
      .describe(
        'Media type the client declared for the upload, which is what the stored object is served as. The bytes themselves are not inspected.'
      ),
  }),
  method: 'post',
  path: '/v1/project/{projectId}/content/file',
};
