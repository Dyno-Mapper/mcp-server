import { z } from 'zod';
export const get_analytics_project = {
    name: 'get_analytics_project',
    description: 'Traffic totals for a project over a date range, taken from the Google Analytics 4 properties linked to the project. This is the headline call: `get_analytics_project_daily` breaks the same metrics down by day, `get_analytics_project_traffic_source` by channel and `get_analytics_project_pages` by page. Both dates are required, the range includes both ends, and the figures are the ones already collected for those properties, so a day only has numbers once it has been collected. With several properties linked their rows are added together, so a user or session seen on two properties counts twice. A property with no traffic in the range answers zeroes, while a project with no linked property at all answers 500.',
    inputSchema: z.object({
        projectId: z
            .number()
            .describe('The ID of the project, as returned by `get_projects`'),
        startDate: z.iso
            .date()
            .describe('First calendar day of the range, in `YYYY-MM-DD` form. Required, with no default. Inclusive: traffic recorded for this day is included'),
        endDate: z.iso
            .date()
            .describe('Last calendar day of the range, in `YYYY-MM-DD` form. Required, with no default. Inclusive. An `endDate` earlier than `startDate` is not rejected; it simply matches no rows'),
    }),
    outputSchema: z.object({
        activeUsers: z
            .number()
            .describe('Distinct users Google Analytics counted as active: a user is active once they have an engaged session'),
        newUsers: z
            .number()
            .describe('Users Google Analytics saw for the first time in the range'),
        sessions: z
            .number()
            .describe('Sessions Google Analytics counted. A visit is one session however many pages it covers'),
        engagedSessions: z
            .number()
            .describe('Sessions Google Analytics classes as engaged: those lasting longer than 10 seconds, containing a conversion, or viewing two or more pages'),
        averageSessionDuration: z
            .number()
            .describe('Mean length of a session in seconds, averaged over the stored daily rows rather than weighted by the number of sessions'),
        conversions: z
            .number()
            .describe('Conversion events: events the property marks as conversions, key events in newer Google Analytics wording'),
        sessionConversionRate: z
            .number()
            .describe('Share of sessions in which a user converted, averaged over the stored daily rows rather than recomputed from the summed sessions'),
        eventCount: z.number().describe('Events recorded, under every event name'),
        totalRevenue: z
            .number()
            .describe('Revenue from purchases, subscriptions and advertising, in the currency of each property. The currency code is not returned'),
        engagementRate: z
            .number()
            .describe('Engaged sessions divided by sessions, between 0 and 1, and 0 when there are no sessions. Computed by DYNO Mapper from the summed sessions rather than read from Google Analytics'),
        bounceRate: z
            .number()
            .describe('Sessions that were not engaged, divided by all sessions, between 0 and 1: the exact complement of `engagementRate`, and computed by DYNO Mapper for the same reason'),
    }),
    method: 'get',
    path: '/v1/analytics/{projectId}',
};
