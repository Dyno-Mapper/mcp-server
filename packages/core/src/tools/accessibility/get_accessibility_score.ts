import { z } from 'zod';

export const get_accessibility_score = {
  name: 'get_accessibility_score',
  description:
    'Get one number for the project’s current accessibility plus the per-page averages behind it, read from the two most recent runs that have results. ' +
    '`score` is the latest of those runs’ stored score multiplied by 100, so it is a 0–100 value to show on a dashboard; the same run’s score appears unscaled in `get_accessibility_results`. ' +
    'The two runs are also compared: the `moved*` fields give the change since the previous run, which is what an “improving or worsening” indicator needs. ' +
    'Every field is `0` when the project has no run with results, so a project that was never checked reads exactly like one that scored zero — check with `get_accessibility_results` that a run exists before treating `0` as a result.',
  inputSchema: z.object({
    projectId: z.number().describe('ID of the project whose score to read.'),
  }),
  outputSchema: z.object({
    score: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Current score: the latest run with results multiplied by 100, so a 0–100 value. `0` when the project has no run with results.'
      ),
    avgKnownProblems: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Known problems per page in the latest run: total known problems divided by pages checked, rounded up. `0` when the project has no run with results.'
      ),
    avgLikelyProblems: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Likely problems per page in the latest run: total divided by pages checked, rounded up. `0` when there is no run with results.'
      ),
    avgPotentialProblems: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Potential problems per page in the latest run: total divided by pages checked, rounded up. `0` when there is no run with results.'
      ),
    movedAvgKnownProblems: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Change in `avgKnownProblems` since the previous run, as a percentage of the smaller of the two averages; positive means more problems. `0` when there is no previous run or either average is `0`, because the ratio is undefined.'
      ),
    movedAvgLikelyProblems: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Change in `avgLikelyProblems` since the previous run, as a percentage of the smaller of the two averages; positive means more problems. `0` when there is no previous run or either average is `0`.'
      ),
    movedAvgPotentialProblems: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Change in `avgPotentialProblems` since the previous run, as a percentage of the smaller of the two averages; positive means more problems. `0` when there is no previous run or either average is `0`.'
      ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/score',
};
