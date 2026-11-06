import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  sortResultSchema,
} from '../schemas/sitemap.js';

export const sort_project_sitemap_items = {
  name: 'sort_project_sitemap_items',
  description:
    'Sort the children of a container. ' +
    'Reorders the published children of one container, or of the root. ' +
    '`itemIds` names the children to reorder and `parentId` the container they belong to; an id that is not a child is ignored. ' +
    'The children are ordered by title, not by the order of `itemIds`: naming them compares titles byte by byte, while omitting them sorts every child naturally, with digit runs compared as numbers. ' +
    'Omit `itemIds`, or send an empty array, to sort every child. ' +
    'The sort is one undo step; the response lists the children in their new order.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    parentId: z
      .number()
      .nullable()
      .optional()
      .describe(
        'Container whose children to reorder. Omit it, or send `null`, to reorder the root items.'
      ),
    itemIds: z
      .array(z.number())
      .optional()
      .describe(
        'Children to reorder, at most 500, each of them a child of `parentId` — an id that is not is ignored. The array names which children move, not the order they end up in: the application sorts the named children by title. Send an empty array, or omit it, to sort every child of the parent by title instead.'
      ),
  }),
  outputSchema: sortResultSchema,
  method: 'post',
  path: '/v1/project/{projectId}/item/sort',
};
