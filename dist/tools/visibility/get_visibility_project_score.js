import { z } from 'zod';
const scoreSchema = z
    .object({
    visibilityScore: z
        .number()
        .describe('Volume-weighted visibility on this engine at the end of the window, as a percentage of the best possible score: `visibilityRawScore` divided by `volumeTotal`, times 100. 100 would mean every tracked keyword ranks first; 0 when no keyword has a search volume.'),
    visibilityScore0: z
        .number()
        .describe('The same visibility percentage computed from the ranks at the start of the window — the figure `visibilityScoreInc` is measured from.'),
    visibilityScoreInc: z
        .number()
        .describe('Change in the visibility percentage over the window, `visibilityScore` minus `visibilityScore0`. Positive means visibility improved.'),
    visibilityRawScore: z
        .number()
        .describe('Unnormalised visibility: for each keyword, `(100 - (rank - 1)) / 100` multiplied by its search volume, summed. A keyword ranked first contributes its whole volume, one ranked 100th contributes almost nothing; a top-ten keyword with no recorded volume is counted as volume 1.'),
    visibilityRawScore0: z
        .number()
        .describe('The same sum computed from the ranks at the start of the window.'),
    visibilityTotal: z
        .number()
        .describe('Number of keywords behind `visibilityScore`: those with a rank and a volume at the end of the window, where a top-ten keyword with no recorded volume counts as volume 1. A keyword with neither adds nothing to visibility and is not counted.'),
    visibilityTotal0: z
        .number()
        .describe('Number of keywords behind `visibilityScore0`.'),
    volumeTotal: z
        .number()
        .describe('Combined search volume of the keywords recorded at either end of the window, each one added once. It is the denominator of the visibility percentage, so it also holds the volume of keywords that have a starting rank but no newest one, which pulls the score down; 0 when nothing was recorded.'),
    incPosition: z
        .number()
        .describe('Number of keywords that improved during the window — their rank number got smaller. The same event that makes a `…PositionIncrease` field on a `get_visibility_project_ranking` row positive.'),
    decPosition: z
        .number()
        .describe('Number of keywords that dropped during the window — their rank number got larger.'),
    totalPosition: z
        .number()
        .describe('Sum of the newest ranks of every keyword that had one. Divide by `totalPositionCount` to get `avgPosition`.'),
    totalPosition0: z
        .number()
        .describe('Sum of the starting ranks of every keyword that had one.'),
    totalPositionCount: z
        .number()
        .describe('Number of keywords that had a rank at the end of the window. 0 when none has been checked yet.'),
    totalPositionCount0: z
        .number()
        .describe('Number of keywords that had a rank at the start of the window.'),
    avgPosition: z
        .number()
        .describe('Mean newest rank, rounded to two decimals; 0 when `totalPositionCount` is 0. Lower is better.'),
    avgPosition0: z
        .number()
        .describe('Mean rank at the start of the window, rounded to two decimals; 0 when there were no ranks.'),
    avgPositionInc: z
        .number()
        .describe('Improvement in the mean rank, `avgPosition0` minus `avgPosition`. Positive means the average position got better, even though the number itself went down.'),
    r1tor3position: z
        .number()
        .describe('Number of keywords whose newest rank is 1 to 3 — the top of the first page at the end of the window.'),
    r1tor3position0: z
        .number()
        .describe('Number of keywords ranked 1 to 3 at the start of the window.'),
    r1tor3positionInc: z
        .number()
        .describe('Change in the 1-to-3 count over the window. Positive means more keywords reached the top three.'),
    r4tor10position: z
        .number()
        .describe('Number of keywords whose newest rank is 4 to 10 — the rest of the first page.'),
    r4tor10position0: z
        .number()
        .describe('Number of keywords ranked 4 to 10 at the start of the window.'),
    r4tor10positionInc: z
        .number()
        .describe('Change in the 4-to-10 count. Positive means more keywords on the first page below the top three.'),
    r11tor50position: z
        .number()
        .describe('Number of keywords whose newest rank is 11 to 50 — pages two to five.'),
    r11tor50position0: z
        .number()
        .describe('Number of keywords ranked 11 to 50 at the start of the window.'),
    r11tor50positionInc: z
        .number()
        .describe('Change in the 11-to-50 count. Positive means more keywords on pages two to five.'),
    r51tor100position: z
        .number()
        .describe('Number of keywords whose newest rank is 51 to 100 — pages six to ten. A rank past 100 falls into none of the four buckets.'),
    r51tor100position0: z
        .number()
        .describe('Number of keywords ranked 51 to 100 at the start of the window.'),
    r51tor100positionInc: z
        .number()
        .describe('Change in the 51-to-100 count. Positive means more keywords in that range.'),
})
    .optional()
    .nullish();
export const get_visibility_project_score = {
    name: 'get_visibility_project_score',
    description: 'Summarises the project’s tracked keywords over `startDate` to `endDate` as one block of numbers per search engine, for a scorecard or a trend line rather than a table of keywords. Field names follow two conventions: a trailing `0` is the value at the start of the window, and `Inc` is current minus start, so a positive `…Inc` always means movement in the good direction. Only actively tracked keywords are counted, and there are no filter parameters: every locale, device and group is included. A project whose keywords have never been checked returns zeros rather than nulls. For the individual rows behind these numbers use `get_visibility_project_ranking` with the same two dates.',
    inputSchema: z.object({
        projectId: z.number().describe('Numeric project id, from `get_projects`.'),
        startDate: z.iso
            .date()
            .describe('First day of the window, as `YYYY-MM-DD`. Required, with no default: every `…0` field and every `…Inc` field is measured from the earliest check on or after this day.'),
        endDate: z.iso
            .date()
            .describe('Last day of the window, inclusive, as `YYYY-MM-DD`. Required. The newest check on or before this day is the one the non-`0` fields report.'),
    }),
    outputSchema: z.object({
        google: scoreSchema.describe('Score block for Google. `null` only when a block could not be produced; in practice one is always returned, zeroed when nothing has been checked.'),
        bing: scoreSchema.describe('Score block for Bing, computed the same way as `google`. `null` only when a block could not be produced.'),
        yahoo: scoreSchema.describe('Score block for Yahoo, computed the same way as `google`. `null` only when a block could not be produced.'),
    }),
    method: 'get',
    path: '/v1/visibility/{projectId}/score',
};
