import { z } from 'zod';

export const get_analytics_project_daily = {
  name: 'get_analytics_project_daily',
  description:
    'One row of traffic figures per stored day for a project, taken from the Google Analytics 4 properties linked to the project and ordered oldest first. Use it to chart a trend; `get_analytics_project` returns the same metrics totaled over the whole range. Both dates are required and the range includes both ends. Days without collected data are absent rather than zero-filled, and the rows come back as stored without merging, so a day with figures from more than one property appears more than once: add those rows up if one figure per day is needed.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('The ID of the project, as returned by `get_projects`'),
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
    data: z
      .array(
        z.object({
          date: z
            .string()
            .describe('Calendar day the row covers, in `YYYY-MM-DD` form'),
          activeUsers: z
            .number()
            .describe(
              'Distinct users Google Analytics counted as active: a user is active once they have an engaged session'
            ),
          newUsers: z
            .number()
            .describe(
              'Users Google Analytics saw for the first time on that day'
            ),
          sessions: z
            .number()
            .describe(
              'Sessions Google Analytics counted. A visit is one session however many pages it covers'
            ),
          engagedSessions: z
            .number()
            .describe(
              'Sessions Google Analytics classes as engaged: those lasting longer than 10 seconds, containing a conversion, or viewing two or more pages'
            ),
          averageSessionDuration: z
            .number()
            .describe(
              'Mean length of a session in seconds for that day, as Google Analytics recorded it'
            ),
          conversions: z
            .number()
            .describe(
              'Conversion events: events the property marks as conversions, key events in newer Google Analytics wording'
            ),
          sessionConversionRate: z
            .number()
            .describe(
              'Share of the sessions on that day in which a user converted, as Google Analytics recorded it'
            ),
          eventCount: z
            .number()
            .describe('Events recorded on that day, under every event name'),
          totalRevenue: z
            .number()
            .describe(
              'Revenue from purchases, subscriptions and advertising, in the currency of each property. The currency code is not returned'
            ),
          engagementRate: z
            .number()
            .describe(
              'Engaged sessions divided by sessions, between 0 and 1, and 0 when there are no sessions. Computed by DYNO Mapper from the summed sessions rather than read from Google Analytics'
            ),
          bounceRate: z
            .number()
            .describe(
              'Sessions that were not engaged, divided by all sessions, between 0 and 1: the exact complement of `engagementRate`, and computed by DYNO Mapper for the same reason'
            ),
        })
      )
      .describe(
        'The days of the range that have collected figures, oldest first'
      ),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/daily',
};
