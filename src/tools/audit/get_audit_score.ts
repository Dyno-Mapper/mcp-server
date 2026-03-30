import { z } from 'zod';

export const get_audit_score = {
  name: 'get_audit_score',
  description: 'Get audit score of a project',
  inputSchema: z.object({
    projectId: z.number().describe('Project ID'),
  }),
  outputSchema: z.object({
    score: z.number().describe('The overall audit score'),
    crawlability: z.number().describe('Crawlability score'),
    indexability: z.number().describe('Indexability score'),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/score',
};
