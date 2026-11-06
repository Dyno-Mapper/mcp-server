import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  SITEMAP_ITEM_ID_DESCRIPTION,
  deletedItemsResultSchema,
} from '../schemas/sitemap.js';

export const delete_project_sitemap_item = {
  name: 'delete_project_sitemap_item',
  description:
    'Delete a sitemap item. ' +
    'Deletes the item and everything beneath it; the delete is reversible with `undo_project_sitemap_edit`, which puts the subtree back. ' +
    'Deleting an already-deleted item is safe and answers the same way. ' +
    'The project’s root item cannot be deleted and answers 400 `root_not_deletable`; the delete also needs a published project and a role that may delete items. ' +
    'The response names the item and the project’s remaining item count. ' +
    'To delete several items in one call, use `bulk_delete_project_sitemap_items`.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    itemId: z.number().describe(SITEMAP_ITEM_ID_DESCRIPTION),
  }),
  outputSchema: deletedItemsResultSchema,
  method: 'delete',
  path: '/v1/project/{projectId}/item/{itemId}',
};
