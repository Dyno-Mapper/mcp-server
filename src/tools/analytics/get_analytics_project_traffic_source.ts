import { z } from 'zod';

export const get_analytics_project_traffic_source = {
  name: 'get_analytics_project_traffic_source',
  description: 'Get traffic sources',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    startDate: z.iso
      .date()
      .describe('The start date for the analytics (YYYY-MM-DD)'),
    endDate: z.iso
      .date()
      .describe('The end date for the analytics (YYYY-MM-DD)'),
  }),
  outputSchema: z.object({
    data: z
      .array(
        z.object({
          sessionDefaultChannelGroup: z
            .string()
            .describe('The default channel group of the session'),
          activeUsers: z.number().describe('Number of active users'),
          sessions: z.number().describe('Number of sessions'),
          engagedSessions: z.number().describe('Number of engaged sessions'),
          averageSessionDuration: z
            .number()
            .describe('The average duration of each session in seconds'),
          conversions: z.number().describe('Number of conversions'),
          sessionConversionRate: z
            .number()
            .describe('The conversion rate of sessions'),
          eventCount: z.number().describe('Total number of events'),
          totalRevenue: z.number().describe('Total revenue generated'),
          engagementRate: z
            .number()
            .describe('The engagement rate of sessions'),
          bounceRate: z.number().describe('The bounce rate of sessions'),
        })
      )
      .describe('An array of traffic sources and their metrics'),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/traffic-source',
};
