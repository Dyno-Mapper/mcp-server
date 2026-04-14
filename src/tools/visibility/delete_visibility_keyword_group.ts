import { z } from 'zod';

export const delete_visibility_keyword_group = {
  name: 'delete_visibility_keyword_group',
  description: 'Delete a keyword group from a project',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    groupId: z.number().describe('The ID of the keyword group to delete'),
  }),
  outputSchema: z.object({
    id: z.number().describe('The ID of the deleted keyword group'),
  }),
  method: 'delete',
  path: '/v1/visibility/{projectId}/group/{groupId}',
};
