import { z } from 'zod';

export const get_visibility_keyword_ranking = {
  name: 'get_visibility_keyword_ranking',
  description: 'Get daily ranking of a keyword in a project',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    keywordId: z.number().describe('The ID of the keyword'),
    startDate: z.iso.date().describe('The start date (YYYY-MM-DD)'),
    endDate: z.iso.date().describe('The end date (YYYY-MM-DD)'),
    service: z
      .enum(['google', 'bing', 'yahoo'])
      .default('google')
      .describe('The search engine service'),
  }),
  outputSchema: z.object({
    id: z.number().describe('The ID of the keyword'),
    keyword: z.string().describe('The keyword'),
    locale: z.string().describe('The locale of the keyword'),
    device: z.string().describe('The device used for tracking'),
    data: z
      .array(
        z.object({
          date: z.iso.date().describe('The date of the ranking'),
          position: z.number().describe('The ranking position'),
          link: z.string().describe('The ranking link'),
        })
      )
      .describe('The daily ranking data'),
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}/{keywordId}',
};
