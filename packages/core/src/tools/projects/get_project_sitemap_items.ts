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
    '`nextOffset` is `offset + limit` while the page came back full, and null when it came back short, so read pages until it is null. ' +
    'The tree is cut at the project’s maximum level, so `total` can exceed the rows. ' +
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
  }),
  outputSchema: sitemapItemListSchema,
  method: 'get',
  path: '/v1/project/{projectId}/item',
};
