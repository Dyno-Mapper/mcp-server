import { z } from 'zod';

export const get_accessibility_report_items = {
  name: 'get_accessibility_report_items',
  description: 'Get accessibility report items',
  inputSchema: z.object({
    projectId: z.number(),
    reportId: z.number(),
    group: z.number().optional(),
    subgroup: z.number().optional(),
    orderBy: z
      .enum([
        'known_problems',
        'likely_problems',
        'potential_problems',
        'created',
        'id',
      ])
      .optional(),
    orderDir: z.enum(['asc', 'desc']).optional(),
    search: z.string().optional(),
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
        itemId: z.number(),
        url: z.string(),
        state: z.string(),
        status: z.string(),
        knownProblems: z.number(),
        likelyProblems: z.number(),
        potentialProblems: z.number(),
        archivedKnownProblems: z.number(),
        archivedLikelyProblems: z.number(),
        archivedPotentialProblems: z.number(),
        groupsChecked: z.number(),
        groupsFailed: z.number(),
        groupsPassed: z.number(),
        score: z.number(),
        processError: z.string().nullable(),
        created: z.string(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}',
};
