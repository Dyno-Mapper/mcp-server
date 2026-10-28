import { z } from 'zod';

export const get_accessibility_history = {
  name: 'get_accessibility_history',
  description:
    'Return the finished accessibility runs of a project as a time series, oldest first, for charting how its accessibility has moved: one row per run with its id, when it ran, its three problem counts and its score. ' +
    'Only runs that finished, checked at least one page and recorded no error are included, so failed attempts do not interrupt the series. ' +
    'With neither date it returns the 100 most recent qualifying runs; with `startDate` and/or `endDate` it returns every qualifying run in the range. ' +
    'This is the data `get_accessibility_score` reduces to a single number, and the run ids are accepted as `reportId` by `get_accessibility_report_items`.',
  inputSchema: z.object({
    projectId: z.number().describe('Id of the project whose history to read.'),
    startDate: z.iso
      .date()
      .optional()
      .describe(
        'Earliest creation date to include, as `YYYY-MM-DD`; runs created that day are included. Omit to start from the project’s first qualifying run.'
      ),
    endDate: z.iso
      .date()
      .optional()
      .describe(
        'Latest creation date to include, as `YYYY-MM-DD`, compared at midnight of that day — so a run later on the same day falls outside the range and you should pass the following day to include it. Omit to run up to the newest qualifying run.'
      ),
  }),
  outputSchema: z.object({
    data: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Id of the run — the `reportId` the other accessibility tools take.'
            ),
          date: z.iso
            .datetime()
            .describe(
              'ISO 8601 date and time the run was created. The series is ordered by this, ascending.'
            ),
          knownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Known problems the run recorded — findings the checker is certain are violations.'
            ),
          likelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Likely problems the run recorded — findings it believes are violations but cannot confirm without a person looking.'
            ),
          potentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Potential problems the run recorded — findings that may be violations depending on runtime or human judgement.'
            ),
          score: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Score the run recorded, `0` when it recorded none. It is stored unscaled: multiply by 100 to compare it with `get_accessibility_score`.'
            ),
        })
      )
      .describe(
        'Qualifying runs in ascending date order. Empty when the project has no finished run in the range.'
      ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/history',
};
