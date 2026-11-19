import { z } from 'zod';

export const get_accessibility_pdf_item_result = {
  name: 'get_accessibility_pdf_item_result',
  description:
    'Return every criterion the checker evaluated for one PDF as a flat list, one row per criterion, so a client can render the file’s full checklist instead of the counts `get_accessibility_pdf_files` summarizes. ' +
    '`itemId` is the `id` of a file row from `get_accessibility_pdf_files`. ' +
    'Each row names its family in `guideline` and its criterion in `criteria`; match those against `get_accessibility_pdf_guidelines` for the criterion’s title, explanation and link. ' +
    '`valid` is what the checker decided, `needsManualCheck` marks criteria a person still has to confirm, and archived results are included with `isArchived: true` rather than dropped. ' +
    'The row also carries the review state, so a client can render the whole screen from this one call: `messages` is the finding in the checker’s own words, `note` is the reviewer’s note, and `always` says whether the dismissal was made to survive a later check. ' +
    'A file that was deleted answers `404 pdf_item_not_found`. A file that belongs to another project answers `500` rather than `404`, and so does a path ID that is not a number.',
  inputSchema: z.object({
    projectId: z.number().describe('ID of the project the file belongs to.'),
    itemId: z
      .number()
      .describe(
        'ID of the PDF file — the `id` from `get_accessibility_pdf_files`.'
      ),
  }),
  outputSchema: z.object({
    result: z
      .array(
        z.object({
          id: z.number().describe('ID of this check result row.'),
          guideline: z
            .string()
            .describe(
              'Guideline family the criterion belongs to, matching a key of `get_accessibility_pdf_guidelines` — `WCAG20` for the WCAG 2.0 checklist.'
            ),
          criteria: z
            .string()
            .describe(
              'Number of the success criterion this result is for, for example `1.1.1`. Match it against `criteria` in `get_accessibility_pdf_guidelines` for the title and link.'
            ),
          valid: z
            .boolean()
            .describe(
              'Whether the file passed this criterion, as the checker recorded it. `false` covers both a failed check and a criterion nobody has confirmed yet, so read `needsManualCheck` before treating it as a failure.'
            ),
          group: z
            .enum([
              'known_problems',
              'likely_problems',
              'potential_problems',
              'unknown',
            ])
            .describe(
              'Severity bucket the checker put this result in: `known_problems` is a confirmed failure, `likely_problems` a probable one, `potential_problems` a possible one, and `unknown` a confidence the API does not map. Note the snake_case names — they match the `orderBy` values of `get_accessibility_pdf_files`, not the camelCase buckets of the web report.'
            ),
          needsManualCheck: z
            .boolean()
            .describe(
              'Whether a person has to verify this criterion for the file, because the automated check cannot decide it.'
            ),
          messages: z
            .array(z.string())
            .describe(
              'What the checker recorded for this result, one entry per message, for example `Image logo.png on page 2 is missing alternative text`. Empty when the criterion produced none, which is the usual case for a check that passed.'
            ),
          note: z
            .string()
            .describe(
              'Reviewer’s note on this result, recorded through `set_accessibility_pdf_result_note`. Empty string when there is none, which is always the case for a result that is not archived.'
            ),
          isArchived: z
            .boolean()
            .describe(
              'Whether this result has been archived for the file, which is what removed it from the file’s problem counts. Archived results are still returned here, so a client that wants only live findings has to filter on this.'
            ),
          always: z
            .boolean()
            .describe(
              'Whether the dismissal was made to survive a later check of the same file, matched by address and criterion. `false` for a result that is not archived.'
            ),
        })
      )
      .describe(
        'One row per criterion the checker evaluated for the file, ordered by criterion number. Empty when it has not evaluated the file yet.'
      ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/pdf/{itemId}',
};
