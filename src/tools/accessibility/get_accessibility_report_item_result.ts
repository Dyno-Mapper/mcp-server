import { z } from 'zod';

const problemSchema = z.object({
  id: z.number(),
  type: z.enum(['knownProblems', 'likelyProblems', 'potentialProblems']),
  error: z.string().nullable(),
  sourceCode: z.string().nullable(),
  repair: z.string().nullable(),
  isArchived: z.boolean(),
});

const subgroupSchema = z.object({
  name: z.string().nullable(),
  problems: z.array(problemSchema),
});

const problemGroupSchema = z.object({
  name: z.string().nullable(),
  subgroups: z.array(subgroupSchema),
});

export const get_accessibility_report_item_result = {
  name: 'get_accessibility_report_item_result',
  description: 'Get accessibility report item result',
  inputSchema: z.object({
    projectId: z.number(),
    reportId: z.number(),
    itemId: z.number(),
  }),
  outputSchema: z.object({
    knownProblems: z.array(problemGroupSchema),
    likelyProblems: z.array(problemGroupSchema),
    potentialProblems: z.array(problemGroupSchema),
    archived: z.array(problemGroupSchema),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/{itemId}',
};
