import { z } from 'zod';

export const get_analytics_project = {
  name: 'get_analytics_project',
  description: 'Get analytics of a project',
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
    activeUsers: z.number().describe('Total number of active users'),
    newUsers: z.number().describe('Total number of new users'),
    sessions: z.number().describe('Total number of sessions'),
    engagedSessions: z.number().describe('Total number of engaged sessions'),
    averageSessionDuration: z
      .number()
      .describe('The average duration of each session in seconds'),
    conversions: z.number().describe('Total number of conversions'),
    sessionConversionRate: z
      .number()
      .describe('The conversion rate of sessions'),
    eventCount: z.number().describe('Total number of events'),
    totalRevenue: z.number().describe('Total revenue generated'),
    engagementRate: z.number().describe('The engagement rate of sessions'),
    bounceRate: z.number().describe('The bounce rate of sessions'),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}',
};
