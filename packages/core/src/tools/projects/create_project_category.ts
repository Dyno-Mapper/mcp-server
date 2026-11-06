import { z } from 'zod';
import { categorySchema } from '../schemas/project.js';

export const create_project_category = {
  name: 'create_project_category',
  description:
    'Ensure a category exists. ' +
    'Makes sure a category of this name is visible to the account and answers it; a name that already exists returns the existing category and writes nothing. ' +
    'Names are trimmed and compared exactly, so case matters. ' +
    'A new category is appended to the end of the list; a category a delete soft-deleted earlier is revived in its old place. ' +
    'Duplicate names are allowed, so the account’s own visible category is preferred over a shared one. ' +
    'Read the full list with `get_project_categories`.',
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .max(255)
      .describe(
        'Name of the category. Trimmed; 1 to 255 characters. A category with this name is returned if it already exists.'
      ),
  }),
  outputSchema: categorySchema,
  method: 'post',
  path: '/v1/project/category',
};
