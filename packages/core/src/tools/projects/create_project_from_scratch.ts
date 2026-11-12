import { z } from 'zod';

export const create_project_from_scratch = {
  name: 'create_project_from_scratch',
  description:
    'Create an empty project that is built by hand rather than crawled or imported. ' +
    'The project is published and editable as soon as it is created, and it counts against the plan’s project allowance; at the allowance the call answers 400 `project_limit_reached`. ' +
    'It starts with one root item titled `Home` at `https://www.example.com`, which is also the project’s domain and placeholder image — an address to replace, not a page that was fetched. ' +
    'The body is optional: without `title` the project is called `Untitled Project`. ' +
    'There is no job to poll; the project is complete when the call returns. Read it with `get_project_details`, rename and re-address the root with `update_project_sitemap_item`, add pages with `create_project_sitemap_item`, and fill them with `replace_project_sitemap_item_content`.',
  inputSchema: z.object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .optional()
      .describe(
        'Name of the new project, 1 to 255 characters. Omit it to accept the default name `Untitled Project`.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'ID of the new project. Read it with `get_project_details`, and build its sitemap with the item tools.'
      ),
  }),
  method: 'post',
  path: '/v1/project/scratch',
};
