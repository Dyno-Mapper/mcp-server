import { z } from 'zod';
import { CATEGORY_ID_DESCRIPTION, categorySchema } from '../schemas/project.js';

export const move_project_category = {
  name: 'move_project_category',
  description:
    'Move a project category. ' +
    'Places a category directly after `afterId` in the account’s list, or first when `afterId` is null. ' +
    'The list is the one `get_project_categories` returns, so a hidden category is not a position anything can be moved to. ' +
    'The whole list is renumbered from 1, which is what keeps “after this one” true after the next move as well. ' +
    'Answers the category that was moved.',
  inputSchema: z.object({
    categoryId: z.number().describe(CATEGORY_ID_DESCRIPTION),
    afterId: z
      .number()
      .nullable()
      .describe(
        'ID of the category to place this one after. Null puts it first in the list.'
      ),
  }),
  outputSchema: categorySchema,
  method: 'post',
  path: '/v1/project/category/{categoryId}/move',
};
