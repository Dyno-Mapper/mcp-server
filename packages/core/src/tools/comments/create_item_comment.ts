import { z } from 'zod';
import { commentSchema } from '../schemas/comments.js';

export const create_item_comment = {
  name: 'create_item_comment',
  description:
    'Post a comment on a sitemap item. ' +
    'Publishes the comment immediately on the named item; there is no approval step. ' +
    '`comment` is trimmed and must be 1 to 1000 characters, or the write is refused with `comment_empty` or `comment_too_long`. ' +
    'The item must belong to this project and still be published, or the write answers 404 `item_not_found`. ' +
    'The response is the published comment, including the commenter’s account details and gravatar picture. ' +
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
        'ID of the sitemap item to comment on, as `get_project_sitemap_items` reports it. It must belong to this project and still be published, or the write answers 404 `item_not_found`.'
      ),
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
  method: 'post',
  path: '/v1/comments/{projectId}/{itemId}',
};
