import { z } from 'zod';

export const get_analytics_project_pages = {
  name: 'get_analytics_project_pages',
  description: 'Get analytics of project pages',
  inputSchema: z.object({
    projectId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    filter: z.string().optional(),
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
      .optional(),
    orderDir: z.enum(['asc', 'desc']).optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  }),
  outputSchema: z.object({
    total: z.number(),
    limit: z.number(),
    page: z.number(),
    pageSize: z.number(),
    items: z.array(
      z.object({
        pageLocation: z.string(),
        activeUsers: z.number(),
        sessions: z.number(),
        engagedSessions: z.number(),
        screenPageViews: z.number(),
        userEngagementDuration: z.number(),
        eventCount: z.number(),
        conversions: z.number(),
        totalRevenue: z.number(),
        engagementRate: z.number(),
        bounceRate: z.number(),
        screenPageViewsPerUser: z.number(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/pages',
};
