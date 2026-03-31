import { z } from 'zod';

export const get_visibility_keyword_ranking = {
  name: 'get_visibility_keyword_ranking',
  description: 'Get daily ranking of a keyword in a project',
  inputSchema: z.object({
    projectId: z.number(),
    keywordId: z.number(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    service: z.enum(['google', 'bing', 'yahoo']).optional(),
  }),
  outputSchema: z.object({
    id: z.number(),
    keyword: z.string(),
    locale: z.string(),
    device: z.string(),
    data: z.array(
      z.object({
        date: z.string(),
        position: z.number(),
        link: z.string(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}/{keywordId}',
};
