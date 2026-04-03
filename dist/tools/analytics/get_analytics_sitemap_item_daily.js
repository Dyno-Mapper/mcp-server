import { z } from 'zod';
export const get_analytics_sitemap_item_daily = {
    name: 'get_analytics_sitemap_item_daily',
    description: 'Get analytics daily data of a sitemap item',
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
        data: z
            .array(z.object({
            date: z.iso
                .date()
                .describe('The date for the analytics (YYYY-MM-DD)'),
            activeUsers: z
                .number()
                .describe('Number of active users on this day'),
            sessions: z.number().describe('Number of sessions on this day'),
            engagedSessions: z
                .number()
                .describe('Number of engaged sessions on this day'),
            conversions: z.number().describe('Number of conversions on this day'),
            eventCount: z.number().describe('Total number of events on this day'),
            totalRevenue: z
                .number()
                .describe('Total revenue generated on this day'),
            engagementRate: z
                .number()
                .describe('The engagement rate of sessions on this day'),
            bounceRate: z
                .number()
                .describe('The bounce rate of sessions on this day'),
            screenPageViews: z
                .number()
                .describe('Number of screen page views on this day'),
            userEngagementDuration: z
                .number()
                .describe('The total duration of user engagement in seconds on this day'),
            screenPageViewsPerUser: z
                .number()
                .describe('The average number of screen page views per user on this day'),
        }))
            .describe('An array of daily analytics data for the sitemap item'),
    }),
    method: 'get',
    path: '/v1/analytics/{projectId}/{linkId}/daily',
};
