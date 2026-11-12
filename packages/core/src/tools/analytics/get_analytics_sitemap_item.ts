import { z } from 'zod';

export const get_analytics_sitemap_item = {
  name: 'get_analytics_sitemap_item',
  description:
    'Traffic totals for one sitemap item over a date range. `linkId` is a sitemap item id, the `id` of an item returned by `get_project_sitemap_items`. The URL of the item is normalized like the stored page rows, host lowercased and a leading `www.` dropped, path and query lowercased, trailing slash trimmed, then matched against them; a URL that cannot be parsed matches no page at all. Both dates are required and the range includes both ends. A page with no traffic answers zeroes, while an item id that does not exist, or that belongs to a different project, answers 500 rather than 404. For the whole project use `get_analytics_project`, and for this page day by day use `get_analytics_sitemap_item_daily`.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('The ID of the project, as returned by `get_projects`'),
    linkId: z
      .number()
      .describe(
        'The ID of the sitemap item, as `get_project_sitemap_items` reports it'
      ),
    startDate: z.iso
      .date()
      .describe(
        'First calendar day of the range, in `YYYY-MM-DD` form. Required, with no default. Inclusive: traffic recorded for this day is included'
      ),
    endDate: z.iso
      .date()
      .describe(
        'Last calendar day of the range, in `YYYY-MM-DD` form. Required, with no default. Inclusive. An `endDate` earlier than `startDate` is not rejected; it matches no rows'
      ),
  }),
  outputSchema: z.object({
    activeUsers: z
      .number()
      .describe(
        'Distinct users Google Analytics counted as active on this page: a user is active once they have an engaged session'
      ),
    sessions: z
      .number()
      .describe(
        'Sessions that included this page. A visit is one session however many pages it covers'
      ),
    engagedSessions: z
      .number()
      .describe(
        'Sessions that included this page and count as engaged: those lasting longer than 10 seconds, containing a conversion, or viewing two or more pages'
      ),
    conversions: z
      .number()
      .describe(
        'Conversion events attributed to this page: events the property marks as conversions, key events in newer Google Analytics wording'
      ),
    eventCount: z
      .number()
      .describe('Events recorded on this page, under every event name'),
    totalRevenue: z
      .number()
      .describe(
        'Revenue attributed to this page, in the currency of each property. The currency code is not returned'
      ),
    engagementRate: z
      .number()
      .describe(
        'Engaged sessions divided by sessions for this page, between 0 and 1, and 0 when there were no sessions. Computed by DYNO Mapper from the summed sessions rather than read from Google Analytics'
      ),
    bounceRate: z
      .number()
      .describe(
        'Sessions that were not engaged, divided by all sessions for this page, between 0 and 1: the exact complement of `engagementRate`, and computed by DYNO Mapper for the same reason'
      ),
    screenPageViews: z.number().describe('Times the page was viewed'),
    userEngagementDuration: z
      .number()
      .describe(
        'Seconds of engagement time attributed to the page, divided by its active users: time per user, not the total across all users'
      ),
    screenPageViewsPerUser: z
      .number()
      .describe(
        'Page views divided by active users. When the page has no active users, its page view count is returned in place of the ratio'
      ),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/{linkId}',
};
