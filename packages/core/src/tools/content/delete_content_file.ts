import { z } from 'zod';

export const delete_content_file = {
  name: 'delete_content_file',
  description:
    'Remove one file from the project’s store and take its bytes back off the account’s storage. ' +
    'The file is named by its address, which is what a block holds and what `get_content_files` returns. ' +
    'Nothing keeps a count of which blocks point at a file, so deleting one that a page still links to leaves that page linking to an address that no longer answers: change the block with `replace_project_sitemap_item_content` as well. ' +
    'The call answers `204` with no body, so a repeat is safe but does not report that the file was already gone. ' +
    'A `url` that names nothing this project stores answers `404 file_not_found`, which is also what another project’s address and a malformed one answer. ' +
    'The `403` for this call names `content_storage_limit_reached` although deleting stores nothing; the code that applies to a delete is `sitemap_forbidden`, for a role that may read the project but not change it.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project the file belongs to.'),
    url: z
      .string()
      .min(1)
      .describe(
        'Address of the file to delete, as a block stores it: the `url` that `store_content_file` or `get_content_files` returned, or the one the application’s own library shows.'
      ),
  }),
  outputSchema: z.object({}),
  method: 'delete',
  path: '/v1/project/{projectId}/content/file',
};
