import { z } from 'zod';

export const get_accessibility_report_items = {
  name: 'get_accessibility_report_items',
  description: 'Get accessibility report items',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    reportId: z.number().describe('The ID of the report'),
    group: z.number().optional().describe('The group ID'),
    subgroup: z.number().optional().describe('The subgroup ID'),
    orderBy: z
      .enum([
        'known_problems',
        'likely_problems',
        'potential_problems',
        'created',
        'id',
      ])
      .optional()
      .describe('The field to order by'),
    orderDir: z
      .enum(['asc', 'desc'])
      .optional()
      .describe('The direction to order by'),
    search: z.string().trim().optional().describe('The search string'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 100))
      .optional()
      .default(50)
      .describe('The results limit (max 100)'),
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('The page number'),
  }),
  outputSchema: z.object({
    total: z.number().describe('Total number of items'),
    limit: z.number().describe('The results limit'),
    page: z.number().describe('The current page number'),
    pageSize: z.number().describe('The size of the page'),
    items: z
      .array(
        z.object({
          id: z.number().describe('The ID of the item'),
          itemId: z.number().describe('The item ID'),
          url: z.string().describe('The URL of the page'),
          state: z.string().describe('The state of the page'),
          status: z.string().describe('The status of the page'),
          knownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of known accessibility problems'),
          likelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of likely accessibility problems'),
          potentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of potential accessibility problems'),
          archivedKnownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of archived known accessibility problems'),
          archivedLikelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of archived likely accessibility problems'),
          archivedPotentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of archived potential accessibility problems'),
          groupsChecked: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of groups checked'),
          groupsFailed: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of groups failed'),
          groupsPassed: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Number of groups passed'),
          score: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Accessibility score (0-100)'),
          processError: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Error message if the page failed to process'),
          created: z.iso
            .datetime()
            .describe('The date and time the item was created'),
        })
      )
      .describe('An array of accessibility report items'),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}',
};
