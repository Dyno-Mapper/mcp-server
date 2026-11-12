import { z } from 'zod';
import { projectCommentPageSchema } from '../schemas/comments.js';

export const get_all_project_comments = {
  name: 'get_all_project_comments',
  description:
    'List every comment in a project. ' +
    'The project’s whole conversation, newest first: every published comment on every published item, each row naming the item it belongs to. ' +
    'It is the moderation view rather than the reading view — `get_item_comments` answers one item oldest first, while this answers the whole project newest first. ' +
    '`search` matches the comment text, not the item title; pass `itemId` to narrow the feed to one item. ' +
    'Comments on deleted items and deleted comments are left out. ' +
    'Paging is `page` (1-based, default 1) and `limit` (default 20, capped at 100); `total` counts every matching comment, not just this page.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .describe('ID of the project, as `get_projects` reports it.'),
    page: z
      .number()
      .int()
      .optional()
      .describe(
        '1-based number of the page to return. Defaults to 1, the first page.'
      ),
    limit: z
      .number()
      .int()
      .optional()
      .describe(
        'How many comments one page holds. Defaults to 20 when omitted; a value above 100 is lowered to 100 rather than refused.'
      ),
    order: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc')
      .describe(
        'Direction to sort in: `desc` for newest first, the default, `asc` for oldest first. Ties within a second are broken by comment id, so pages do not overlap.'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Return only comments whose text contains this text. A plain substring test with surrounding whitespace trimmed; the item title is not searched. An empty value applies no filter.'
      ),
    itemId: z
      .number()
      .int()
      .optional()
      .describe(
        'Return only comments on this sitemap item. An id that is not in this project matches nothing rather than failing.'
      ),
  }),
  outputSchema: projectCommentPageSchema,
  method: 'get',
  path: '/v1/comments/{projectId}/all',
};
