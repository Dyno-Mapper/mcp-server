import { z } from 'zod';

export const get_project_groups = {
  name: 'get_project_groups',
  description: 'Get the list of project groups',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    groups: z.array(
      z.object({
        id: z.number().describe('Group ID'),
        name: z.string().describe('Group name'),
        color: z.string().describe('Group color'),
      })
    ),
  }),
  method: 'get',
  path: '/v1/project/group',
};
