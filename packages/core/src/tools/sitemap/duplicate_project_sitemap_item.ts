import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  SITEMAP_ITEM_ID_DESCRIPTION,
  itemIdsResultSchema,
} from '../schemas/sitemap.js';

export const duplicate_project_sitemap_item = {
  name: 'duplicate_project_sitemap_item',
  description:
    'Duplicate a sitemap item. ' +
    'Copies an item and, by default, its direct children. ' +
    'The copy carries the title, URL, type, metadata, priority, change frequency, category, workflow status, colors, tags and content; language alternates, the thumbnail and the link path are not copied. ' +
    'Omit `parentId` to copy the item where it stands; send a container id to put the copy under it, or `null` for the root. ' +
    'Only one level of children is copied. ' +
    'The whole copy is one undo step. ' +
    'The response names the new ids and the project’s item count.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    itemId: z.number().describe(SITEMAP_ITEM_ID_DESCRIPTION),
    parentId: z
      .number()
      .nullable()
      .optional()
      .describe(
        'ID of the container to put the copy under, or `null` for the root — refused with `root_exists` when the project already has a root, and copying the root itself would make a second one. Omit it to copy the item where it stands, immediately after it.'
      ),
    includeChildren: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'Whether to copy the item’s direct children as well, each with its own tags and content. Defaults to true. Only one level is copied, so the children’s children stay behind.'
      ),
  }),
  outputSchema: itemIdsResultSchema,
  method: 'post',
  path: '/v1/project/{projectId}/item/{itemId}/duplicate',
};
