import { z } from 'zod';

export const get_accessibility_results = {
  name: 'get_accessibility_results',
  description:
    'List the accessibility runs of a project, newest first, one row per run. ' +
    '`id` on a row is the `reportId` every other accessibility tool takes, so this is the call that turns a project id into a report id. ' +
    'Runs that were deleted are not listed, and a run that was just queued appears with `urls`, the problem counts and `score` still `null`, filling them in as the checker progresses. ' +
    'An `unauthorized_access` error means the token’s account cannot read this project; `feature_disabled` means its plan does not include Accessibility.',
  inputSchema: z.object({
    projectId: z.number().describe('ID of the project whose runs to list.'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 1000))
      .optional()
      .describe(
        'Maximum number of runs to return. Defaults to 20; values above 1000 are lowered to 1000 rather than rejected.'
      ),
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        '1-based page number to return. Defaults to 1, which is the newest run.'
      ),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of runs the project has, ignoring paging, so `ceil(total / limit)` pages are available.'
      ),
    limit: z
      .number()
      .describe(
        'Page size that was applied — the requested `limit`, capped at 1000, or 20 when none was sent.'
      ),
    page: z.number().describe('1-based page number that was served.'),
    pageSize: z
      .number()
      .describe(
        'Number of pages at this `limit`, `ceil(total / limit)`, not the number of rows in this response.'
      ),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'ID of the run, and the `reportId` every other accessibility tool takes.'
            ),
          scheduled: z
            .boolean()
            .describe(
              'Whether this run was created by the scheduled accessibility check rather than started on demand.'
            ),
          urls: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Number of pages the run checked. `null` until the run has counted them; a queued run has none yet.'
            ),
          guidelines: z
            .array(z.string())
            .describe(
              'Guideline sets this run checks, using the codes `run_accessibility_checker` accepts — for example `WCAG22-AAA`. Empty when the run recorded none.'
            ),
          error: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Message the run ended with when it failed. `null` when it has not failed, including while it is still running.'
            ),
          errorReason: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'The checker’s own reason for `error`, in its words rather than a fixed vocabulary. `null` when it recorded none.'
            ),
          knownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Known problems across the run’s pages: findings the checker is certain are violations. `null` until the run has produced counts.'
            ),
          likelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Likely problems: findings the checker believes are violations but cannot confirm without a person inspecting the page. `null` until the run has produced counts.'
            ),
          potentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Potential problems: findings that may be violations depending on runtime or human judgement. `null` until the run has produced counts.'
            ),
          groups: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Number of guideline groups the run evaluated — the WCAG guidelines, such as `1.1 Text Alternatives`, that checks are filed under. `null` until the run has produced counts.'
            ),
          groupsFailed: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'How many of those groups produced at least one problem on at least one page. `null` until the run has produced counts.'
            ),
          groupsPassed: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'How many of those groups had no problem on any page. `null` until the run has produced counts.'
            ),
          score: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Score stored for the run, rounded to two decimals and left unscaled: multiply it by 100 to read it the way `get_accessibility_score` reports the latest run. `null` until the run finishes.'
            ),
          created: z.iso
            .datetime()
            .describe('ISO 8601 date and time the run was created.'),
          loginInputs: z
            .array(
              z.object({
                id: z
                  .number()
                  .describe(
                    '0-based position of the prompt in the run’s stored login recipe. It is the `inputId` that `submit_accessibility_login_input` takes, and it stays the same for the whole run.'
                  ),
                label: z
                  .string()
                  .describe(
                    'Short prompt to show the person answering, for example `Microsoft Authenticator approval`. `Input` when the recipe gave the prompt no label.'
                  ),
                description: z
                  .string()
                  .optional()
                  .describe(
                    'Longer explanation of the value expected for this prompt. An empty string when the recipe gave none, never null.'
                  ),
              })
            )
            .describe(
              'Prompts this run may pause on, in the order the checker walks them, so a client can ask before they are needed. Only the user who started the run sees them; empty for anyone else and for projects that do not sign in. Read the live state with `get_accessibility_login_inputs` and answer one with `submit_accessibility_login_input`.'
            ),
        })
      )
      .describe('The page of runs, newest first.'),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}',
};
