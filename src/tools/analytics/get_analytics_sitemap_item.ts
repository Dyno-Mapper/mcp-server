import { z } from 'zod';

export const get_analytics_sitemap_item = {
  name: 'get_analytics_sitemap_item',
  description: 'Get analytics of a sitemap item',
  inputSchema: z.object({
    projectId: z.string(),
    linkId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  outputSchema: z.object({
    activeUsers: z.number(),
    sessions: z.number(),
    engagedSessions: z.number(),
    conversions: z.number(),
    eventCount: z.number(),
    totalRevenue: z.number(),
    engagementRate: z.number(),
    bounceRate: z.number(),
    screenPageViews: z.number(),
    userEngagementDuration: z.number(),
    screenPageViewsPerUser: z.number(),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/{linkId}',
};
