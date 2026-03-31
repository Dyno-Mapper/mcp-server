import { z } from 'zod';

export const delete_accessibility_report = {
  name: 'delete_accessibility_report',
  description: 'Delete accessibility results of a project',
  inputSchema: z.object({
    projectId: z.number(),
    reportId: z.number(),
  }),
  outputSchema: z.object({
    id: z.number(),
  }),
  method: 'delete',
  path: '/v1/accessibility/{projectId}/{reportId}',
};
