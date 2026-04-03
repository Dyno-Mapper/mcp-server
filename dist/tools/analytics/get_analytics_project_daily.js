import { z } from 'zod';
export const get_analytics_project_daily = {
    name: 'get_analytics_project_daily',
    description: 'Get analytics daily data',
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
            .array(z.object({
            date: z.string().describe('The date for the analytics (YYYY-MM-DD)'),
            activeUsers: z
                .number()
                .describe('Number of active users on this day'),
            newUsers: z.number().describe('Number of new users on this day'),
            sessions: z.number().describe('Number of sessions on this day'),
            engagedSessions: z
                .number()
                .describe('Number of engaged sessions on this day'),
            averageSessionDuration: z
                .number()
                .describe('The average duration of each session in seconds on this day'),
            conversions: z.number().describe('Number of conversions on this day'),
            sessionConversionRate: z
                .number()
                .describe('The conversion rate of sessions on this day'),
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
        }))
            .describe('An array of daily analytics data'),
    }),
    method: 'get',
    path: '/v1/analytics/{projectId}/daily',
};
