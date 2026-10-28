import { z } from 'zod';
export const get_analytics_project_traffic_source = {
    name: 'get_analytics_project_traffic_source',
    description: 'One row per Google Analytics default channel group, such as `Direct`, `Organic Search`, `Referral` or `Email`, with the traffic that channel produced over the range, largest by active users first. Channels are grouped across the properties linked to the project and across the days in the range, so each channel appears once. Both dates are required and the range includes both ends. Here `averageSessionDuration` and `sessionConversionRate` are the stored daily values added together rather than averaged, so compare channels by them only loosely. A project with no linked property, or a range with no traffic, answers an empty `data` array.',
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
        data: z
            .array(z.object({
            sessionDefaultChannelGroup: z
                .string()
                .describe('Channel Google Analytics grouped the sessions into with its default channel grouping, such as `Direct`, `Organic Search`, `Paid Search`, `Organic Social`, `Paid Social`, `Referral`, `Email`, `Display` or `Affiliates`, or `Unassigned` when none of them applies'),
            activeUsers: z
                .number()
                .describe('Distinct users Google Analytics counted as active: a user is active once they have an engaged session'),
            sessions: z
                .number()
                .describe('Sessions Google Analytics counted. A visit is one session however many pages it covers'),
            engagedSessions: z
                .number()
                .describe('Sessions Google Analytics classes as engaged: those lasting longer than 10 seconds, containing a conversion, or viewing two or more pages'),
            averageSessionDuration: z
                .number()
                .describe('The stored daily averages added together, in seconds: a sum of averages, so not the true mean session length of the channel'),
            conversions: z
                .number()
                .describe('Conversion events: events the property marks as conversions, key events in newer Google Analytics wording'),
            sessionConversionRate: z
                .number()
                .describe('The stored daily rates added together across the days in the range rather than averaged, so not the true conversion rate of the channel'),
            eventCount: z
                .number()
                .describe('Events recorded, under every event name'),
            totalRevenue: z
                .number()
                .describe('Revenue from purchases, subscriptions and advertising, in the currency of each property. The currency code is not returned'),
            engagementRate: z
                .number()
                .describe('Engaged sessions divided by sessions, between 0 and 1, and 0 when there are no sessions. Computed by DYNO Mapper from the summed sessions rather than read from Google Analytics'),
            bounceRate: z
                .number()
                .describe('Sessions that were not engaged, divided by all sessions, between 0 and 1: the exact complement of `engagementRate`, and computed by DYNO Mapper for the same reason'),
        }))
            .describe('One row per channel group that drove traffic in the range, largest by active users first'),
    }),
    method: 'get',
    path: '/v1/analytics/{projectId}/traffic-source',
};
