import { z } from 'zod';
import { categorySchema } from '../schemas/project.js';

export const get_project_categories = {
  name: 'get_project_categories',
  description:
    'List project categories. ' +
    'Returns the categories the account uses to label sitemap pages, in the order the application shows them; hidden categories are left out, so this is the set a client can actually assign. ' +
    'Categories are reported flat, so a nested category keeps the position it has but the nesting is not shown. ' +
    'An `id` here is what `get_project_sitemap_items` reports as an item’s `category`, and what `get_assignments` accepts as its `category` filter. ' +
    'A category with `editable: false` is shared by every account: it can be recoloured and moved, and hidden with `delete_project_category`, but not renamed or deleted — those answer 409.',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    items: z
      .array(categorySchema)
      .describe(
        'The visible categories of the account, in the order the application lists them.'
      ),
  }),
  method: 'get',
  path: '/v1/project/category',
};
