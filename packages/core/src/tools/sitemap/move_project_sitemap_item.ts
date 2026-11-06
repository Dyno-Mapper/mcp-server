import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  SITEMAP_ITEM_ID_DESCRIPTION,
  sitemapItemSchema,
} from '../schemas/sitemap.js';

export const move_project_sitemap_item = {
  name: 'move_project_sitemap_item',
  description:
    'Move a sitemap item. ' +
    'Reparents an item, repositions it among its siblings, or both. ' +
    'Omitting `parentId` keeps the current parent; `null` makes the item a root, refused with `root_exists` when the project already has one, and the root item itself cannot be moved (`root_not_movable`). ' +
    '`afterItemId` places the item after a sibling, or omitting it appends to the end. ' +
    'The whole subtree moves, and a move into the item’s own subtree is refused with `item_cycle`. ' +
    'The move is one undo step; to move several items at once, use `bulk_move_project_sitemap_items`.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    itemId: z.number().describe(SITEMAP_ITEM_ID_DESCRIPTION),
    parentId: z
      .number()
      .nullable()
      .optional()
      .describe(
        'Id of the container to move the item under, or `null` to make it a root item — refused with `root_exists` when the project already has one. Omit it to keep the current parent. A parent inside the item’s own subtree is rejected with `item_cycle`.'
      ),
    afterItemId: z
      .number()
      .nullable()
      .optional()
      .describe(
        'Id of the sibling to place the item after, among the published children of `parentId`. Omit it to append to the end.'
      ),
  }),
  outputSchema: sitemapItemSchema,
  method: 'post',
  path: '/v1/project/{projectId}/item/{itemId}/move',
};
