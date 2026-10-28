import { z } from 'zod';
export const get_project_categories = {
    name: 'get_project_categories',
    description: 'List project categories. ' +
        'Returns the categories the account uses to label sitemap pages, in the order the application shows them. ' +
        'Hidden categories are left out, so this is the set a client can actually assign. ' +
        'An `id` here is what `get_project_sitemap_items` reports as the `category` of an item, and what `get_assignments` accepts as its `category` filter. ' +
        'Categories are not a filter of `get_projects`.',
    inputSchema: z.object({}).describe('No input required'),
    outputSchema: z.object({
        items: z
            .array(z.object({
            id: z
                .number()
                .describe('Category id. Report it as the `category` of an item and pass it as the `category` filter of `get_assignments`.'),
            name: z
                .string()
                .describe('Category name, as the account spelled it.'),
            color: z
                .string()
                .nullish()
                .describe('Colour the application paints the category with, when one is set. Null when the category has no colour.'),
        }))
            .describe('The visible categories of the account, in the order the application lists them.'),
    }),
    method: 'get',
    path: '/v1/project/category',
};
