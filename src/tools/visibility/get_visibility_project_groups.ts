import { z } from 'zod';

export const get_visibility_project_groups = {
  name: 'get_visibility_project_groups',
  description: 'Get keyword groups',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
  }),
  outputSchema: z.object({
    groups: z
      .array(
        z.object({
          id: z.number().describe('The ID of the group'),
          name: z.string().describe('The name of the group'),
        })
      )
      .describe('The list of keyword groups'),
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}/group',
};
