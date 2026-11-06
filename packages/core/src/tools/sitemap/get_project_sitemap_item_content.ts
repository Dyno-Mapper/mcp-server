import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  SITEMAP_ITEM_ID_DESCRIPTION,
  contentBlocksSchema,
} from '../schemas/sitemap.js';

export const get_project_sitemap_item_content = {
  name: 'get_project_sitemap_item_content',
  description:
    'List the content blocks of an item. ' +
    'Returns every content block of one page, in the order the page renders them, each with the markup the application builds from it. ' +
    'A block is one of six kinds — rich text, plain text, link, image, file and video — and each type reads different keys from `properties`. ' +
    '`rendered` is built from the stored values on every read rather than stored alongside them, so it always reflects the current renderer. ' +
    'The blocks are the editor’s material: what the content tab of an item shows. ' +
    'Replace the set with `replace_project_sitemap_item_content`.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    itemId: z.number().describe(SITEMAP_ITEM_ID_DESCRIPTION),
  }),
  outputSchema: contentBlocksSchema,
  method: 'get',
  path: '/v1/project/{projectId}/item/{itemId}/content',
};
