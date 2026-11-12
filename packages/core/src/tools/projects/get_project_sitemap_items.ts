import { z } from 'zod';
import { sitemapItemListSchema } from '../schemas/sitemap.js';

export const get_project_sitemap_items = {
  name: 'get_project_sitemap_items',
  description:
    'List sitemap items. ' +
    'Lists the project’s sitemap tree, one row per item, the way the application’s sitemap editor walks it. ' +
    'An item is either a page (`type: link`) or a container (`type: container`); `url` is the page’s address and `children` the number of published items beneath it. ' +
    'Send `parentId` to list one item’s subtree: the item itself comes first, followed by every published item beneath it, with `depth` counted from that item. ' +
    '`limit` and `offset` page the result; without `limit` every matching item is returned and `nextOffset` is null. ' +
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
    limit: z
      .number()
      .optional()
      .describe(
        'Maximum number of items to return. Omit it to return every matching item; the API applies no default and no maximum.'
      ),
    offset: z
      .number()
      .optional()
      .describe(
        'Number of items to skip, 0-based. Only applied when `limit` is also sent; without `limit` the whole set is returned from the beginning.'
      ),
  }),
  outputSchema: sitemapItemListSchema,
  method: 'get',
  path: '/v1/project/{projectId}/item',
};
