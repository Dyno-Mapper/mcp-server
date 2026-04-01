import { z } from 'zod';

export const cancel_project_url_refresh = {
  name: 'cancel_project_url_refresh',
  description: 'Cancel Project refresh created by URL',
  inputSchema: z.object({
    id: z.coerce.number().describe('Project ID'),
  }),
  outputSchema: z.object({
    id: z.coerce.number().describe('Project ID'),
  }),
  method: 'delete',
  path: '/v1/project/url/{id}/refresh',
};
