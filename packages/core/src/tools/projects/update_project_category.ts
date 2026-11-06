import { z } from 'zod';
import { CATEGORY_ID_DESCRIPTION, categorySchema } from '../schemas/project.js';

export const update_project_category = {
  name: 'update_project_category',
  description:
    'Update a project category. ' +
    'Renames a category, sets or clears its colour, or both; only the keys you send are written, and `color: null` removes the colour. ' +
    'Renaming a shared category answers 409 because the row belongs to every account — create your own with `create_project_category` instead. ' +
    'Renaming does not touch the items carrying the category: they store the id and follow the new name. ' +
    'Sending neither field answers 400 `nothing_to_update`. ' +
    'Read the result with `get_project_categories`.',
  inputSchema: z.object({
    categoryId: z.number().describe(CATEGORY_ID_DESCRIPTION),
    name: z
      .string()
      .min(1)
      .max(255)
      .optional()
      .describe(
        'New name for the category. Trimmed; 1 to 255 characters. Refused with 409 for a category every account shares.'
      ),
    color: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Colour to paint the category with, as `#rrggbb`, or null to clear it. Sent alone, it recolours without touching the name.'
      ),
  }),
  outputSchema: categorySchema,
  method: 'patch',
  path: '/v1/project/category/{categoryId}',
};
