import { z } from 'zod';

export const get_accessibility_results = {
  name: 'get_accessibility_results',
  description: 'Get accessibility results of a project',
  inputSchema: z.object({
    projectId: z.number(),
    limit: z.number().optional(),
    page: z.number().optional(),
  }),
  outputSchema: z.object({
    total: z.number(),
    limit: z.number(),
    page: z.number(),
    pageSize: z.number(),
    items: z.array(
      z.object({
        id: z.number(),
        scheduled: z.boolean(),
        urls: z.number().nullable(),
        guidelines: z.array(z.string()),
        error: z.string().nullable(),
        errorReason: z.string().nullable(),
        knownProblems: z.number().nullable(),
        likelyProblems: z.number().nullable(),
        potentialProblems: z.number().nullable(),
        groups: z.number().nullable(),
        groupsFailed: z.number().nullable(),
        groupsPassed: z.number().nullable(),
        score: z.number().nullable(),
        created: z.string(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}',
};
