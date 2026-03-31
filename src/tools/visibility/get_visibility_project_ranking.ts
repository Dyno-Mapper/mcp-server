import { z } from 'zod';

export const get_visibility_project_ranking = {
  name: 'get_visibility_project_ranking',
  description: 'Get keywords ranking of a project',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    startDate: z.iso.date().describe('The start date (YYYY-MM-DD)'),
    endDate: z.iso.date().describe('The end date (YYYY-MM-DD)'),
    orderBy: z
      .enum([
        'keyword',
        'google',
        'bing',
        'yahoo',
        'volume',
        'avg_cpc',
        'google_increase',
        'bing_increase',
        'yahoo_increase',
      ])
      .default('keyword')
      .describe('The field to order by'),
    orderDir: z
      .enum(['asc', 'desc'])
      .optional()
      .default('asc')
      .describe('The direction to order by'),
    search: z.string().trim().optional().describe('The search string'),
    group: z.coerce.number().optional().describe('The group ID'),
    device: z
      .enum(['desktop', 'tablet', 'mobile'])
      .optional()
      .describe('The device type'),
    locale: z.string().trim().optional().describe('The locale'),
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('The page number'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 100))
      .optional()
      .default(50)
      .describe('The results limit (max 100)'),
  }),
  outputSchema: z.object({
    total: z.number().describe('Total number of items'),
    limit: z.number().describe('The results limit'),
    page: z.number().describe('The current page number'),
    pageSize: z.number().describe('The size of the page'),
    items: z.array(
      z.object({
        id: z.number().describe('The ID of the keyword'),
        keyword: z.string().describe('The keyword'),
        locale: z
          .string()
          .optional()
          .nullish()
          .default(null)
          .describe('The locale of the keyword'),
        device: z
          .string()
          .optional()
          .nullish()
          .default(null)
          .describe('The device of the keyword'),
        enabled: z.boolean().describe('The enabled status of the keyword'),
        group: z
          .string()
          .optional()
          .nullish()
          .default(null)
          .describe('The group name'),
        linkId: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('The link ID'),
        endDate: z.iso
          .date()
          .optional()
          .nullish()
          .default(null)
          .describe('The end date'),
        startDate: z.iso
          .date()
          .optional()
          .nullish()
          .default(null)
          .describe('The start date'),
        googlePosition: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Google ranking position'),
        googlePositionStart: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Starting Google ranking position'),
        googlePositionIncrease: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Google ranking position increase'),
        googleLink: z
          .string()
          .optional()
          .nullish()
          .default(null)
          .describe('Google ranking link'),
        bingPosition: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Bing ranking position'),
        bingPositionStart: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Starting Bing ranking position'),
        bingPositionIncrease: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Bing ranking position increase'),
        bingLink: z
          .string()
          .optional()
          .nullish()
          .default(null)
          .describe('Bing ranking link'),
        yahooPosition: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Yahoo ranking position'),
        yahooPositionStart: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Starting Yahoo ranking position'),
        yahooPositionIncrease: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Yahoo ranking position increase'),
        yahooLink: z
          .string()
          .optional()
          .nullish()
          .default(null)
          .describe('Yahoo ranking link'),
        volume: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Keyword search volume'),
        avgCpc: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Keyword average CPC'),
        created: z.iso.datetime().describe('Created date and time'),
      })
    ),
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}',
};
