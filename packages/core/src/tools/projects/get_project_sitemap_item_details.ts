import { z } from 'zod';
import { sitemapItemSchema } from '../schemas/sitemap.js';

export const get_project_sitemap_item_details = {
  name: 'get_project_sitemap_item_details',
  description:
    'Get a sitemap item. ' +
    'Returns one sitemap item with its metadata: meta keywords and description, sitemap `priority` and `changeFrequency`, the tags and language alternates it records, and its thumbnail. ' +
    'Metadata falls back to what the crawler recorded for the page when the item itself carries none. ' +
    '`mode`, `slug` and `staticUrl` describe the address the application gives the page: `Slug` builds it from `slug`, `Static` from `staticUrl`, and an empty `mode` means the application has no link path for the item. ' +
    'The item is looked up through the project, so a project that cannot be read answers 404 or 403, and an `itemId` missing from this project answers 500 `Item not found` rather than 404. ' +
    'The paged list is `get_project_sitemap_items`.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('ID of the project, as returned by `get_projects`.'),
    itemId: z
      .number()
      .describe('ID of the item, as returned by `get_project_sitemap_items`.'),
  }),
  outputSchema: sitemapItemSchema,
  method: 'get',
  path: '/v1/project/{projectId}/item/{itemId}',
};
