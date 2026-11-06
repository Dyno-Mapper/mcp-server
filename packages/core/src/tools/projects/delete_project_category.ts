import { z } from 'zod';
import { CATEGORY_ID_DESCRIPTION } from '../schemas/project.js';

export const delete_project_category = {
  name: 'delete_project_category',
  description:
    'Remove a project category. ' +
    'Takes the category out of this account’s list; one the account created is soft-deleted and can be revived by `create_project_category` with the same name, while a shared category is only hidden for this account. ' +
    'Items keep the category value they carried, so a project filtered by the category still answers the same way; the category just stops being offered as a choice. ' +
    'The call is idempotent and answers the removed id. ' +
    'Read the remaining categories with `get_project_categories`.',
  inputSchema: z.object({
    categoryId: z.number().describe(CATEGORY_ID_DESCRIPTION),
  }),
  outputSchema: z.object({
    id: z.number().describe('Id of the category that was removed.'),
  }),
  method: 'delete',
  path: '/v1/project/category/{categoryId}',
};
