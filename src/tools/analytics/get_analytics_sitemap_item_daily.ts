import { z } from 'zod';

export const get_analytics_sitemap_item_daily = {
  name: 'get_analytics_sitemap_item_daily',
  description: 'Get analytics daily data of a sitemap item',
  inputSchema: z.object({
    projectId: z.string(),
    linkId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  outputSchema: z.object({
    data: z.array(
      z.object({
        date: z.string(),
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
      })
    ),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/{linkId}/daily',
};
