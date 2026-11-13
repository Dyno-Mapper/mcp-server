import { z } from 'zod';
import { sitemapItemListSchema } from '../schemas/sitemap.js';

export const get_project_sitemap_items = {
  name: 'get_project_sitemap_items',
  description:
    'List sitemap items. ' +
    'Lists the project’s sitemap tree, one row per item, the way the application’s sitemap editor walks it. ' +
    'An item is either a page (`type: link`) or a container (`type: container`); `url` is the page’s address and `children` the number of published items beneath it. ' +
    'Send `parentId` to list one item’s subtree: the item itself comes first, followed by every published item beneath it, with `depth` counted from that item. ' +
    '`limit` defaults to 100 and values above 1000 are lowered to 1000; `offset` is 0-based, defaults to 0 and applies whether or not `limit` is sent. ' +
    '`nextOffset` is the offset to send for the next page, and null when this page reached the end, so read pages until it is null. ' +
    'The tree is cut at the project’s configured maximum level by default, so the rows are the upper part of the tree rather than every item; send `maxLevel` to list a different number of levels, up to 10. ' +
    '`depth` is 0 for the row the listing starts at and one more for each level below it, and an item below the cut is read by sending a listed item as `parentId`. ' +
    'To read one item with its metadata, use `get_project_sitemap_item_details`.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('ID of the project, as returned by `get_projects`.'),
    parentId: z
      .number()
      .optional()
      .describe(
        'ID of the item to list from: its subtree is returned, the item itself first (`depth: 0`) when it is published. Omit it to list from the top of the sitemap. An id that is not in this project lists nothing rather than failing.'
      ),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 1000))
      .optional()
      .describe(
        'Maximum number of items to return. Defaults to 100; values above 1000 are lowered to 1000 rather than refused, and a value that is not a positive whole number is rejected.'
      ),
    offset: z.coerce
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        'Number of items to skip, 0-based. Defaults to 0 and applies whether or not `limit` is sent; a negative or fractional value is rejected.'
      ),
    maxLevel: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 10))
      .optional()
      .describe(
        'How many levels of the tree to list, counting the first row as level 1, so the deepest `depth` returned is `maxLevel - 1`. Defaults to the project’s configured maximum level (3 when the project sets none); values above 10 are lowered to 10 rather than refused, and a value that is not a positive whole number is rejected.'
      ),
  }),
  outputSchema: sitemapItemListSchema,
  method: 'get',
  path: '/v1/project/{projectId}/item',
};
