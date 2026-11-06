import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  itemIdsResultSchema,
} from '../schemas/sitemap.js';

export const bulk_update_project_sitemap_items = {
  name: 'bulk_update_project_sitemap_items',
  description:
    'Assign a category, status, tags or colours to sitemap items. ' +
    'Sets one or more attributes across many items in one call — the bulk operations the editor uses when several nodes are selected at once. ' +
    'Send at least one of `category`, `workflowStatus`, `tags` or `colors`; none is rejected with `nothing_to_update`. ' +
    '`apply` decides how far each change reaches: `selected` for the named items alone, `children` includes their direct children, `subtree` includes everything beneath them. ' +
    'The batch is capped at 500 ids and records one undo step per attribute: setting both a category and tags undoes as two steps. ' +
    'An id that is not in this project rejects the whole request with `invalid_item_ids`; an id that has been deleted answers 404.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    itemIds: z
      .array(z.number().int())
      .min(1)
      .max(500)
      .describe(
        'Ids the edit names, at most 500. Every id must belong to this project, otherwise the request is rejected with `invalid_item_ids` and nothing is changed; an id that has been deleted answers 404 `item_not_found`.'
      ),
    apply: z
      .enum(['selected', 'children', 'subtree'])
      .optional()
      .default('selected')
      .describe(
        'How far the edit reaches from each named id. `selected` changes only the named items; `children` also changes their direct children; `subtree` changes everything beneath them. The undo record keeps only the ids you named, so undoing restores the selection’s values.'
      ),
    category: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe(
        'Category id to assign to every affected item, or `null` to clear it. Rejected with `unknown_category` when the account cannot see it.'
      ),
    workflowStatus: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Workflow status key to assign, or `null` to clear it. Rejected with `unknown_workflow_status` when the key does not exist.'
      ),
    tags: z
      .array(z.string().min(1))
      .optional()
      .describe(
        'Tags to assign. With `tagsMode: replace` this is the complete set for every affected item; with `merge` the tags are added and the items’ other tags stay.'
      ),
    tagsMode: z
      .enum(['replace', 'merge'])
      .optional()
      .default('replace')
      .describe(
        'What `tags` means. `replace` (the default) makes the array the whole tag set; `merge` adds the tags and keeps the rest.'
      ),
    colors: z
      .object({
        background: z
          .string()
          .nullable()
          .describe('Background colour, or `null` for the default.'),
        foreground: z
          .string()
          .nullable()
          .describe('Text colour, or `null` for the default.'),
      })
      .optional()
      .describe(
        'Colours to paint the affected items with, as a pair. Send both keys, or omit the object to leave colours alone.'
      ),
  }),
  outputSchema: itemIdsResultSchema,
  method: 'patch',
  path: '/v1/project/{projectId}/item',
};
