import { z } from 'zod';

export const get_analytics_project = {
  name: 'get_analytics_project',
  description: 'Get analytics of a project',
  inputSchema: z.object({
    projectId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  outputSchema: z.object({
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
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}',
};
