import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  deletedItemsResultSchema,
} from '../schemas/sitemap.js';

export const bulk_delete_project_sitemap_items = {
  name: 'bulk_delete_project_sitemap_items',
  description:
    'Delete sitemap items. ' +
    'Deletes a batch of items, and everything beneath each of them, as one atomic operation: either every id is deleted or none is. ' +
    'An id that is not in this project rejects the whole request with `invalid_item_ids`, naming the ids that were wrong. ' +
    'The batch is capped at 500 ids and undoes as one step, so `undo_project_sitemap_edit` restores the whole batch. ' +
    'Naming the root item rejects the batch with `root_not_deletable`. ' +
    'The response names only the deleted items, not their descendants.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    itemIds: z
      .array(z.number())
      .min(1)
      .max(500)
      .describe(
        'IDs of the items to delete, at most 500 per request. Every id must belong to this project, otherwise the whole request is rejected with `invalid_item_ids` and nothing is deleted.'
      ),
  }),
  outputSchema: deletedItemsResultSchema,
  method: 'post',
  path: '/v1/project/{projectId}/item/delete',
};
