import { z } from 'zod';

const problemSchema = z
  .array(
    z.object({
      name: z
        .string()
        .optional()
        .nullish()
        .default(null)
        .describe(
          'Name of the guideline group or, one level down, of the subgroup the findings belong to. `null` for findings the checker could not attribute to that level.'
        ),
      subgroups: z
        .array(
          z.object({
            name: z
              .string()
              .optional()
              .nullish()
              .default(null)
              .describe(
                'Name of the subgroup — the WCAG success criterion under the guideline, for example `1.1.1 Non-text Content`. `null` for findings filed under the group but not under a named subgroup.'
              ),
            problems: z
              .array(
                z.object({
                  id: z
                    .number()
                    .describe(
                      'Id of this finding, unique within the page’s results.'
                    ),
                  type: z
                    .enum([
                      'knownProblems',
                      'likelyProblems',
                      'potentialProblems',
                    ])
                    .describe(
                      'Severity the finding was recorded at: `knownProblems` is a confirmed violation, `likelyProblems` one the checker believes but cannot prove automatically, `potentialProblems` one that may be a violation. Inside `archived` it says what the finding was before it was archived.'
                    ),
                  error: z
                    .string()
                    .optional()
                    .nullish()
                    .default(null)
                    .describe(
                      'What the check found, in the checker’s words — the message to show a reader. `null` when none was recorded.'
                    ),
                  sourceCode: z
                    .string()
                    .optional()
                    .nullish()
                    .default(null)
                    .describe(
                      'Fragment of the page’s HTML the finding points at, when the checker captured one. `null` when it did not.'
                    ),
                  repair: z
                    .string()
                    .optional()
                    .nullish()
                    .default(null)
                    .describe(
                      'Suggested repair for the finding, written by the checker. `null` when it offers none.'
                    ),
                  isArchived: z
                    .boolean()
                    .describe(
                      'Whether this finding has been archived, which is `true` for everything under `archived` and `false` in the three live buckets.'
                    ),
                })
              )
              .describe(
                'Findings recorded for this subgroup on this page. Empty when the subgroup only appears for its archived findings.'
              ),
          })
        )
        .describe(
          'Subgroups with findings in this bucket, sorted by name. Empty when the bucket holds no findings for the page.'
        ),
    })
  )
  .describe(
    'Guideline groups with findings in this bucket, grouped by WCAG guideline and then by success criterion.'
  );

export const get_accessibility_report_item_result = {
  name: 'get_accessibility_report_item_result',
  description:
    'Return everything the checker found on one page of an accessibility run, split into four buckets and nested group, then subgroup, then finding. ' +
    '`knownProblems` are confirmed violations, `likelyProblems` findings the checker believes but cannot prove without a person looking, `potentialProblems` findings that may be violations, and `archived` findings that were archived for this page — every finding also states its own `type` and `isArchived`. ' +
    '`itemId` is the `id` of a page row from `get_accessibility_report_items`, not that row’s `itemId` field. A page or run that does not belong to this project answers `500` rather than `404`.',
  inputSchema: z.object({
    projectId: z.number().describe('Id of the project the run belongs to.'),
    reportId: z
      .number()
      .describe(
        'Id of the accessibility run — the `id` from `get_accessibility_results`, or the `id` that `run_accessibility_checker` returned.'
      ),
    itemId: z
      .number()
      .describe(
        'Id of the page row in the run — the `id` from `get_accessibility_report_items`, not that row’s `itemId` field.'
      ),
  }),
  outputSchema: z.object({
    knownProblems: problemSchema.describe(
      'Confirmed violations on this page, grouped by WCAG guideline and then by success criterion.'
    ),
    likelyProblems: problemSchema.describe(
      'Findings the checker believes are violations but cannot confirm without a person inspecting the page, grouped the same way.'
    ),
    potentialProblems: problemSchema.describe(
      'Findings that may be violations depending on runtime or human judgement, grouped the same way.'
    ),
    archived: problemSchema.describe(
      'Findings that were archived for this page, grouped the same way and still carrying the `type` they had when they were archived.'
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/{itemId}',
};
