import { z } from 'zod';

export const get_analytics_project_daily = {
  name: 'get_analytics_project_daily',
  description: 'Get analytics daily data',
  inputSchema: z.object({
    projectId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  outputSchema: z.object({
    data: z.array(
      z.object({
        date: z.string(),
        activeUsers: z.number(),
        newUsers: z.number(),
        sessions: z.number(),
        engagedSessions: z.number(),
        averageSessionDuration: z.number(),
        conversions: z.number(),
        sessionConversionRate: z.number(),
        eventCount: z.number(),
        totalRevenue: z.number(),
        engagementRate: z.number(),
        bounceRate: z.number(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/daily',
};
