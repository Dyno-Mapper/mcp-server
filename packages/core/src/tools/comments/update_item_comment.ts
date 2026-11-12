import { z } from 'zod';
import { COMMENT_ID_DESCRIPTION, commentSchema } from '../schemas/comments.js';

export const update_item_comment = {
  name: 'update_item_comment',
  description:
    'Edit a comment. ' +
    'Replaces the text of one comment; any user who can reach the project may edit any comment on it, the author included. ' +
    '`comment` is trimmed and must be 1 to 1000 characters, or the write is refused with `comment_empty` or `comment_too_long`. ' +
    'The comment is stamped as modified. ' +
    'The response is the edited comment. ' +
    'Read the thread with `get_item_comments`.',
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
    comment: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .describe(
        'Text of the comment. Surrounding whitespace is trimmed; the trimmed text must be between 1 and 1000 characters, or the write is refused with `comment_empty` or `comment_too_long`.'
      ),
  }),
  outputSchema: commentSchema,
  method: 'patch',
  path: '/v1/comments/{projectId}/{itemId}/{commentId}',
};
