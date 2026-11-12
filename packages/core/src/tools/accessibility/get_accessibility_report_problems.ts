import { z } from 'zod';

export const get_accessibility_report_problems = {
  name: 'get_accessibility_report_problems',
  description:
    'Summarize one accessibility run by guideline group: one row per group with how many problems it produced and how many pages it touched. ' +
    'Rows are keyed by the group name trimmed to its numbered prefix, so the subgroups under one guideline — the WCAG guidelines `1.1` to `4.1` — are summed into a single row; use `get_accessibility_report_groups` when the subgroup breakdown is needed instead. ' +
    'Counts are relative to the run’s page total, `totalPages`, which includes pages with no problem at all. ' +
    'Only groups that produced at least one problem appear, so a run that found nothing answers an empty array. A run of another project, or an id that is not a run, answers `500` rather than `404`.',
  inputSchema: z.object({
    projectId: z.number().describe('ID of the project the run belongs to.'),
    reportId: z
      .number()
      .describe(
        'ID of the accessibility run — the `id` from `get_accessibility_results`, or the `id` that `run_accessibility_checker` returned.'
      ),
  }),
  outputSchema: z.object({
    problems: z
      .array(
        z.object({
          title: z
            .string()
            .describe(
              'Name of the guideline group, trimmed to its numbered prefix — for example `1.1 Text Alternatives` with any subgroup detail after a colon removed.'
            ),
          totalPages: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Number of pages the run checked, used as the denominator for `pagesPassed`. `0` when the run recorded no page count.'
            ),
          problems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Number of problem instances this group recorded across all pages, counting every occurrence rather than every page.'
            ),
          pagesWithProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Number of pages with at least one problem in this group. Never more than `totalPages`.'
            ),
          pagesPassed: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Number of pages with no problem in this group: `totalPages` minus `pagesWithProblems`, never negative.'
            ),
        })
      )
      .describe(
        'One row per group that produced a problem, sorted by group name. Empty when the run found nothing.'
      ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/problems',
};
