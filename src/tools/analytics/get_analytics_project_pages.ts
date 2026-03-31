import { z } from 'zod';

export const get_analytics_project_pages = {
  name: 'get_analytics_project_pages',
  description: 'Get analytics of project pages',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    startDate: z.iso
      .date()
      .describe('The start date for the analytics (YYYY-MM-DD)'),
    endDate: z.iso
      .date()
      .describe('The end date for the analytics (YYYY-MM-DD)'),
    filter: z.string().optional().describe('Filter for the results'),
    orderBy: z
      .enum([
        'active_users',
        'sessions',
        'engaged_sessions',
        'screen_page_views',
        'engagement_rate',
        'bounce_rate',
        'user_engagement_duration',
        'event_count',
        'conversions',
        'total_revenue',
        'screen_page_views_per_user',
      ])
      .optional()
      .describe('The field to order the results by'),
    orderDir: z
      .enum(['asc', 'desc'])
      .optional()
      .describe('The order direction'),
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('The page number'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 1000))
      .optional()
      .describe('The number of results per page (max 1000)'),
  }),
  outputSchema: z.object({
    total: z.number().describe('Total number of results'),
    limit: z.number().describe('The number of results per page'),
    page: z.number().describe('The current page number'),
    pageSize: z.number().describe('The number of items in the current page'),
    items: z
      .array(
        z.object({
          pageLocation: z.string().describe('The URL of the page'),
          activeUsers: z.number().describe('Number of active users'),
          sessions: z.number().describe('Number of sessions'),
          engagedSessions: z.number().describe('Number of engaged sessions'),
          screenPageViews: z.number().describe('Number of screen page views'),
          userEngagementDuration: z
            .number()
            .describe('The total duration of user engagement in seconds'),
          eventCount: z.number().describe('Total number of events'),
          conversions: z.number().describe('Total number of conversions'),
          totalRevenue: z.number().describe('Total revenue generated'),
          engagementRate: z
            .number()
            .describe('The engagement rate of sessions'),
          bounceRate: z.number().describe('The bounce rate of sessions'),
          screenPageViewsPerUser: z
            .number()
            .describe('The average number of screen page views per user'),
        })
      )
      .describe('An array of page analytics data'),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/pages',
};
