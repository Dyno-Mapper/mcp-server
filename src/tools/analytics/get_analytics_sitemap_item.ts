import { z } from 'zod';

export const get_analytics_sitemap_item = {
  name: 'get_analytics_sitemap_item',
  description: 'Get analytics of a sitemap item',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    linkId: z.number().describe('The ID of the sitemap item'),
    startDate: z.iso
      .date()
      .describe('The start date for the analytics (YYYY-MM-DD)'),
    endDate: z.iso
      .date()
      .describe('The end date for the analytics (YYYY-MM-DD)'),
  }),
  outputSchema: z.object({
    activeUsers: z.number().describe('Total number of active users'),
    sessions: z.number().describe('Total number of sessions'),
    engagedSessions: z.number().describe('Total number of engaged sessions'),
    conversions: z.number().describe('Total number of conversions'),
    eventCount: z.number().describe('Total number of events'),
    totalRevenue: z.number().describe('Total revenue generated'),
    engagementRate: z.number().describe('The engagement rate of sessions'),
    bounceRate: z.number().describe('The bounce rate of sessions'),
    screenPageViews: z.number().describe('Number of screen page views'),
    userEngagementDuration: z
      .number()
      .describe('The total duration of user engagement in seconds'),
    screenPageViewsPerUser: z
      .number()
      .describe('The average number of screen page views per user'),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/{linkId}',
};
