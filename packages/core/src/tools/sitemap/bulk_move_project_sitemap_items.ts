import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  itemIdsResultSchema,
} from '../schemas/sitemap.js';

export const bulk_move_project_sitemap_items = {
  name: 'bulk_move_project_sitemap_items',
  description:
    'Move sitemap items. ' +
    'Moves a batch of items as one atomic operation, all of them or none. ' +
    'The moves are applied in the order given, each against the tree the previous one left, and the whole batch undoes as one step. ' +
    'Every id and `parentId` must belong to this project, no item may appear twice, no move may use another item in the batch as its parent, and the root item cannot be moved; any of those rejects the whole request and changes nothing. ' +
    'The batch is capped at 500 moves. ' +
    'The response names the moved items and the project’s item count.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    items: z
      .array(
        z.object({
          itemId: z.number().describe('ID of the item to move.'),
          parentId: z
            .number()
            .nullable()
            .optional()
            .describe(
              'ID of the container to move it under, or `null` for the root, which is refused with `root_exists` when the project already has one. The project’s root item cannot be moved, so naming it rejects the whole batch with `root_not_movable`. Omit it to keep the current parent.'
            ),
          afterItemId: z
            .number()
            .nullable()
            .optional()
            .describe(
              'ID of the sibling to place it after. Omit it to append.'
            ),
        })
      )
      .min(1)
      .max(500)
      .describe(
        'The moves to make, at most 500. They are applied in order, all of them or none: a single invalid id, parent or cycle rolls the batch back. An item may appear once, and no move may target another item in the same batch.'
      ),
  }),
  outputSchema: itemIdsResultSchema,
  method: 'post',
  path: '/v1/project/{projectId}/item/move',
};
