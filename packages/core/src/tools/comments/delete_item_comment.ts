import { z } from 'zod';
import { COMMENT_ID_DESCRIPTION } from '../schemas/comments.js';

export const delete_item_comment = {
  name: 'delete_item_comment',
  description:
    'Delete a comment. ' +
    'Soft-deletes one comment; a deleted comment is no longer returned, and there is no restore through this API. ' +
    'Deleting an already-deleted comment answers 204 again rather than 404, because the caller asked for a state the comment is already in. ' +
    'An id from another project, or an item that no longer exists, still answers 404. ' +
    'The call returns no body. ' +
    'Read the remaining thread with `get_item_comments`.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .describe('ID of the project, as `get_projects` reports it.'),
    itemId: z
      .number()
      .int()
      .describe(
        'ID of the sitemap item the comment sits on, as `get_project_sitemap_items` reports it.'
      ),
    commentId: z.number().int().describe(COMMENT_ID_DESCRIPTION),
  }),
  outputSchema: z.object({}),
  method: 'delete',
  path: '/v1/comments/{projectId}/{itemId}/{commentId}',
};
