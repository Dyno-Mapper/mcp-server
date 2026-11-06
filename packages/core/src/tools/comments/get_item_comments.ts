import { z } from 'zod';
import { commentPageSchema } from '../schemas/comments.js';

export const get_item_comments = {
  name: 'get_item_comments',
  description:
    'Return the comments on one sitemap item, oldest first unless `order=desc` asks for the newest first. ' +
    'Only published comments are returned, and only on a published item of a published project; a deleted comment stops appearing. ' +
    '`itemId` is a sitemap item id from `get_project_sitemap_items`. ' +
    'An item deleted from the sitemap, or one that belongs to another project, answers 404 `item_not_found` rather than an empty list — this tool no longer hides the difference between “no comments” and “no such item”. An existing item with no comments answers an empty `items` array. ' +
    'Paging is `page` (1-based, default 1) and `limit` (default 20, capped at 100); `total` counts every comment matching `search`. ' +
    'Use `get_commented_items` or `get_all_project_comments` to find threads.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('The ID of the project, as returned by `get_projects`'),
    itemId: z
      .number()
      .describe(
        'The ID of the sitemap item, as `get_project_sitemap_items` reports it. An id that belongs to another project answers 404 with `item_not_found` rather than an empty list'
      ),
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
      .default('asc')
      .describe(
        'Direction to sort in: `asc` for oldest first, the default, `desc` for newest first. Ties within a second are broken by comment id, so pages do not overlap.'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Return only comments whose text contains this text. A plain substring test with surrounding whitespace trimmed. An empty value applies no filter.'
      ),
  }),
  outputSchema: commentPageSchema,
  method: 'get',
  path: '/v1/comments/{projectId}/{itemId}',
};
