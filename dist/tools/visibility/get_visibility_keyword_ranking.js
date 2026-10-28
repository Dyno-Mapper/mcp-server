import { z } from 'zod';
export const get_visibility_keyword_ranking = {
    name: 'get_visibility_keyword_ranking',
    description: 'Returns one keyword with its day-by-day rank on one search engine, for a trend line or to find the day a position changed. Each entry of `data` is a day the engine recorded the keyword, oldest first, so the gaps between dates are days that were not checked — not days at position 0. `service` picks the engine, so a chart covering three engines takes three calls with the same dates. `keywordId` is the `id` of a row from `get_visibility_project_ranking`, not the internal keyword id, and it is not checked against the project: an id from another project is accepted and normally returns an empty `data`. For one figure per engine over the same window use `get_visibility_project_score`.',
    inputSchema: z.object({
        projectId: z.number().describe('Numeric project id, from `get_projects`.'),
        keywordId: z
            .number()
            .describe('Id of the keyword, the `id` of a row from `get_visibility_project_ranking` — not the internal keyword id. It is not checked against this project, so an id from another project is accepted and normally comes back with an empty `data` array; an id that does not exist fails the whole call with 500.'),
        startDate: z.iso
            .date()
            .describe('First day of the history, as `YYYY-MM-DD`. Required; days before it are never returned even when they were checked.'),
        endDate: z.iso
            .date()
            .describe('Last day of the history, inclusive, as `YYYY-MM-DD`. Required.'),
        service: z
            .enum(['google', 'bing', 'yahoo'])
            .default('google')
            .describe('Search engine whose positions are returned: `google`, `bing` or `yahoo`. Defaults to `google`; one call reports one engine, so each additional engine costs another call over the same dates.'),
    }),
    outputSchema: z.object({
        id: z
            .number()
            .describe('Id of the tracked keyword, the same value that was requested.'),
        keyword: z
            .string()
            .describe('Keyword text, lower-cased as the application stores it.'),
        locale: z
            .string()
            .describe('Locale the keyword is tracked in. The returned positions were read from that locale’s search results, not from every locale the keyword appears in.'),
        device: z
            .string()
            .describe('Device the positions were measured on: `desktop`, `tablet` or `mobile`.'),
        data: z
            .array(z.object({
            date: z.iso
                .date()
                .describe('Day the rank was recorded, as `YYYY-MM-DD`. Entries are ordered by this value, oldest first.'),
            position: z
                .number()
                .describe('Rank on that day on the requested engine: a 1-based organic position, where 1 is the top result and a larger number is worse.'),
            link: z
                .string()
                .describe('URL that was ranked for the keyword on that day, as the ranking store recorded it.'),
        }))
            .describe('One entry per checked day inside the window, oldest first. Empty when the keyword was not checked on any day in the window, which is also the answer for a keyword that has only just been added.'),
    }),
    method: 'get',
    path: '/v1/visibility/{projectId}/{keywordId}',
};
