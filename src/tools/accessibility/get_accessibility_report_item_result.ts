import { z } from 'zod';

const problemSchema = z
  .array(
    z.object({
      name: z
        .string()
        .optional()
        .nullish()
        .default(null)
        .describe('The name of the problem category'),
      subgroups: z
        .array(
          z.object({
            name: z
              .string()
              .optional()
              .nullish()
              .default(null)
              .describe('The name of the problem subgroup'),
            problems: z
              .array(
                z.object({
                  id: z.number().describe('The ID of the problem'),
                  type: z
                    .enum([
                      'knownProblems',
                      'likelyProblems',
                      'potentialProblems',
                    ])
                    .describe('The type of the problem'),
                  error: z
                    .string()
                    .optional()
                    .nullish()
                    .default(null)
                    .describe('The error message'),
                  sourceCode: z
                    .string()
                    .optional()
                    .nullish()
                    .default(null)
                    .describe('The source code where the problem occurs'),
                  repair: z
                    .string()
                    .optional()
                    .nullish()
                    .default(null)
                    .describe('The suggested repair for the problem'),
                  isArchived: z
                    .boolean()
                    .describe('Whether the problem is archived'),
                })
              )
              .describe('An array of problems'),
          })
        )
        .describe('An array of problem subgroups'),
    })
  )
  .describe('An array of accessibility problems');

export const get_accessibility_report_item_result = {
  name: 'get_accessibility_report_item_result',
  description: 'Get accessibility report item result',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    reportId: z.number().describe('The ID of the report'),
    itemId: z.number().describe('The ID of the item'),
  }),
  outputSchema: z.object({
    knownProblems: problemSchema.describe('Known accessibility problems'),
    likelyProblems: problemSchema.describe('Likely accessibility problems'),
    potentialProblems: problemSchema.describe(
      'Potential accessibility problems'
    ),
    archived: problemSchema.describe('Archived accessibility problems'),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/{itemId}',
};
