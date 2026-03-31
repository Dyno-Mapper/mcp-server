import { z } from 'zod';

export const get_visibility_project_groups = {
  name: 'get_visibility_project_groups',
  description: 'Get keyword groups',
  inputSchema: z.object({
    projectId: z.number(),
  }),
  outputSchema: z.object({
    groups: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}/group',
};
