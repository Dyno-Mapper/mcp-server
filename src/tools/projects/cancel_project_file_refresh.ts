import { z } from 'zod';

export const cancel_project_file_refresh = {
  name: 'cancel_project_file_refresh',
  description: 'Cancel project refresh job created from text or xml file',
  inputSchema: z.object({
    type: z.enum(['text', 'xml']).describe('Project file type'),
    id: z.coerce.number().describe('Project ID'),
  }),
  outputSchema: z.object({
    id: z.number().describe('Project ID'),
  }),
  method: 'delete',
  path: '/v1/project/{type}/{id}/refresh',
};
