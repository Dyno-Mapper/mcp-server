import { z } from 'zod';

export const get_analytics_project_events = {
  name: 'get_analytics_project_events',
  description:
    'One row per event name recorded over the range, most frequent first: `page_view`, `session_start`, `purchase` and whatever else the properties linked to the project collected. Events are grouped by name across properties and days, so each name appears once. Both dates are required and the range includes both ends. `eventCountPerUser` is computed by DYNO Mapper, the event count divided by the active users of the event, and falls back to the event count when the event has no active users. For traffic per page instead of per event use `get_analytics_project_pages`.',
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
        'Last calendar day of the range, in `YYYY-MM-DD` form. Required, with no default. Inclusive. An `endDate` earlier than `startDate` is not rejected; it simply matches no rows'
      ),
  }),
  outputSchema: z.object({
    data: z
      .array(
        z.object({
          eventName: z
            .string()
            .describe(
              'Name of the event as Google Analytics recorded it, for example `page_view`, `session_start` or `purchase`'
            ),
          eventCount: z
            .number()
            .describe('Times this event was recorded in the range'),
          totalUsers: z
            .number()
            .describe(
              'Distinct users who triggered the event at least once in the range'
            ),
          activeUsers: z
            .number()
            .describe(
              'Distinct users Google Analytics counted as active: a user is active once they have an engaged session'
            ),
          totalRevenue: z
            .number()
            .describe(
              'Revenue attributed to this event, in the currency of each property. The currency code is not returned'
            ),
          eventCountPerUser: z
            .number()
            .describe(
              'Average number of times a user triggered the event: the event count divided by its active users. When the event has no active users, the event count itself is returned'
            ),
        })
      )
      .describe(
        'One row per event name recorded in the range, most frequent first'
      ),
  }),
  method: 'get',
  path: '/v1/analytics/{projectId}/events',
};
