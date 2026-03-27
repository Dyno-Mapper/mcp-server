import { z } from 'zod';

export const cancel_project_job = {
  name: 'cancel_project_job',
  description: 'Cancel project creation or refresh job',
  inputSchema: z.object({
    id: z.number().describe('Job ID'),
    source: z
      .enum(['url', 'text', 'xml'])
      .describe('Source of project creation'),
    isRefresh: z
      .boolean()
      .optional()
      .default(false)
      .describe('Whether it is a refresh job'),
  }),
  outputSchema: z.object({
    success: z.boolean().describe('Whether the job was cancelled successfully'),
  }),
  method: 'delete',
  path: '/v1/project/{source}/{id}{refresh_suffix}',
};
