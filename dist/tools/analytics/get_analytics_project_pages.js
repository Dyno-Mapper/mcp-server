import { z } from 'zod';
export const get_analytics_project_pages = {
    name: 'get_analytics_project_pages',
    description: 'A paged table of the pages that had traffic, one row per page, from the Google Analytics 4 properties linked to the project. Rows are keyed by page URL after normalisation, host lowercased with a leading `www.` dropped, path and query lowercased and trailing slash trimmed, so the same page reached by differently written URLs collapses into one row. Both dates are required and the range includes both ends. `total` is the number of distinct pages matching `filter`, and the sort defaults to `active_users` descending. A page with no traffic in the range is simply not in the table.',
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
        filter: z
            .string()
            .optional()
            .describe('Text that must appear somewhere in the page URL. Matched as a substring; omitted or blank returns every page'),
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
            .describe('Metric to sort by, named as Google Analytics names it and matching one of the row fields: `active_users`, `sessions`, `engaged_sessions`, `screen_page_views` for total views, `engagement_rate`, `bounce_rate`, `user_engagement_duration` for seconds per active user, `event_count`, `conversions`, `total_revenue` or `screen_page_views_per_user` for views per active user. Defaults to `active_users`'),
        orderDir: z
            .enum(['asc', 'desc'])
            .optional()
            .describe('Direction of the sort: `asc` for smallest first, `desc` for largest first. `desc` when omitted, which is what a traffic table usually wants'),
        page: z.coerce
            .number()
            .int()
            .positive()
            .optional()
            .describe('1-based page number to return. Defaults to 1; a value below 1 or a fraction is rejected'),
        limit: z.coerce
            .number()
            .int()
            .positive()
            .transform((n) => Math.min(n, 1000))
            .optional()
            .describe('Rows per page, 1 or more. Defaults to 20 and is capped at 1000: a larger value is reduced to 1000 rather than rejected'),
    }),
    outputSchema: z.object({
        total: z
            .number()
            .describe('Distinct pages in the range that matched the filter, meaning how many rows the table holds without paging'),
        limit: z
            .number()
            .describe('Rows per page actually applied: the requested `limit` capped at 1000, or 20 when the request sent none'),
        page: z.number().describe('1-based index of the returned page'),
        pageSize: z
            .number()
            .describe('Number of pages of `limit` rows needed to cover `total`: a count of pages, not of rows'),
        items: z
            .array(z.object({
            pageLocation: z
                .string()
                .describe('URL of the page as Google Analytics recorded it, with scheme, host, path and query. Rows group URLs that normalise alike, so this is one of the spellings that merged into the row'),
            activeUsers: z
                .number()
                .describe('Distinct users Google Analytics counted as active: a user is active once they have an engaged session'),
            sessions: z
                .number()
                .describe('Sessions Google Analytics counted. A visit is one session however many pages it covers'),
            engagedSessions: z
                .number()
                .describe('Sessions Google Analytics classes as engaged: those lasting longer than 10 seconds, containing a conversion, or viewing two or more pages'),
            screenPageViews: z.number().describe('Times the page was viewed'),
            userEngagementDuration: z
                .number()
                .describe('Seconds of engagement time attributed to the page, divided by its active users: time per user, not the total across all users'),
            eventCount: z
                .number()
                .describe('Events recorded, under every event name'),
            conversions: z
                .number()
                .describe('Conversion events: events the property marks as conversions, key events in newer Google Analytics wording'),
            totalRevenue: z
                .number()
                .describe('Revenue from purchases, subscriptions and advertising, in the currency of each property. The currency code is not returned'),
            engagementRate: z
                .number()
                .describe('Engaged sessions divided by sessions, between 0 and 1, and 0 when there are no sessions. Computed by DYNO Mapper from the summed sessions rather than read from Google Analytics'),
            bounceRate: z
                .number()
                .describe('Sessions that were not engaged, divided by all sessions, between 0 and 1: the exact complement of `engagementRate`, and computed by DYNO Mapper for the same reason'),
            screenPageViewsPerUser: z
                .number()
                .describe('Page views divided by active users. When there are no active users, the page view count itself is returned in place of the ratio'),
        }))
            .describe('The rows for this page, in the requested order'),
    }),
    method: 'get',
    path: '/v1/analytics/{projectId}/pages',
};
