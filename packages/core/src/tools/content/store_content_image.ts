import { z } from 'zod';

export const store_content_image = {
  name: 'store_content_image',
  description:
    'Copy an image the account has already uploaded into the project’s image store, and answer the public address a content block points at. ' +
    'Upload the picture once with `upload_file` and the `sitemap_content_image` purpose, then send the key it returned here. Adoption is what makes the bytes public and what counts them against the account’s storage: until it runs, the upload waits in staging and expires there. ' +
    'An image is stored under the SHA-1 of its bytes, so uploading and adopting the same picture twice answers the same address and stores nothing new. ' +
    'Pointing a block at the address is a separate call: put it in `properties.imageUrl` of an `image` block, or in an `<img>` element of a `richtext` block, and write the blocks with `replace_project_sitemap_item_content`. ' +
    'The account’s storage is checked before anything is copied, so a plan with no room left refuses the call and leaves the upload untouched.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project the image belongs to.'),
    fileKey: z
      .string()
      .min(1)
      .describe(
        'Key returned by `upload_file` for a file uploaded with the `sitemap_content_image` purpose. It is not a public link, and only the account that uploaded it can use it.'
      ),
  }),
  outputSchema: z.object({
    url: z
      .string()
      .describe(
        'Public address of the stored image. This is the value an `image` block holds as `properties.imageUrl`, and the address a `richtext` block embeds in an `<img>` element.'
      ),
    hash: z
      .string()
      .describe(
        'SHA-1 of the image bytes, which is also the name the image is stored under. Two uploads of the same bytes share one object and one address, and a block may keep this as `properties.imageHash`.'
      ),
    name: z
      .string()
      .describe(
        'Filename the uploader gave, sanitized and without its extension. It is a label, not part of the address.'
      ),
    size: z.number().describe('Length of the stored image in bytes.'),
    mimeType: z
      .string()
      .describe(
        'Media type the client declared for the upload, which is what the stored object is served as. The bytes themselves are not inspected.'
      ),
  }),
  method: 'post',
  path: '/v1/project/{projectId}/content/image',
};
