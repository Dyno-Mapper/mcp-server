import { z } from 'zod';

export const get_analytics_project_events = {
  name: 'get_analytics_project_events',
  description: 'Get events',
  inputSchema: z.object({
    projectId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
  outputSchema: z.object({
    data: z.array(
      z.object({
        eventName: z.string(),
        eventCount: z.number(),
        totalUsers: z.number(),
        activeUsers: z.number(),
        totalRevenue: z.number(),
        eventCountPerUser: z.number(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/events',
};
