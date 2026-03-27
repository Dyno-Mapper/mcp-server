import { z } from 'zod';

export const get_project_categories = {
  name: 'get_project_categories',
  description: 'Get the list of project categories',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    items: z.array(
      z.object({
        id: z.number().describe('Category ID'),
        name: z.string().describe('Category name'),
        color: z.string().nullable().describe('Category color'),
      })
    ),
  }),
  method: 'get',
  path: '/v1/project/category',
};
