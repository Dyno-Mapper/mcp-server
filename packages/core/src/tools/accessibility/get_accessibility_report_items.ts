import { z } from 'zod';

export const get_accessibility_report_items = {
  name: 'get_accessibility_report_items',
  description:
    'List the pages of one accessibility run, one row per checked page, with what the checker found on it. ' +
    'Each row carries its lifecycle in `state` (`pending`, `running`, `finished`), the three problem counts and the page’s score, so one call is enough to show a run while it is still going. ' +
    '`id` is the row id that `get_accessibility_report_item_result` takes; `itemId` is the page’s own id inside the project, so the two are different values. ' +
    '`group` and `subgroup` take the ids from `get_accessibility_report_groups`, and `search` matches the page URL. ' +
    'A run that belongs to another project, or an id that is not a run at all, answers `500` rather than `404`.',
  inputSchema: z.object({
    projectId: z.number().describe('ID of the project the run belongs to.'),
    reportId: z
      .number()
      .describe(
        'ID of the accessibility run — the `id` from `get_accessibility_results`, or the `id` that `run_accessibility_checker` returned.'
      ),
    group: z
      .number()
      .optional()
      .describe(
        'Only return pages with at least one problem in this guideline group. Pass the `id` of a group from `get_accessibility_report_groups`; omit it to include every group.'
      ),
    subgroup: z
      .number()
      .optional()
      .describe(
        'Only return pages with at least one problem in this subgroup. Pass a subgroup `id` from `get_accessibility_report_groups`; combine it with `group` to narrow further.'
      ),
    orderBy: z
      .enum([
        'known_problems',
        'likely_problems',
        'potential_problems',
        'created',
        'id',
      ])
      .optional()
      .describe(
        'Field to order by: `known_problems`, `likely_problems` or `potential_problems` order by that count on the page, `created` by when the page row was created, `id` by the row id. Defaults to `id`.'
      ),
    orderDir: z
      .enum(['asc', 'desc'])
      .optional()
      .describe(
        'Direction applied to `orderBy`, defaulting to `desc`. Ordering by `id` ignores it and is always ascending, so paging stays stable.'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Substring matched against the page URL. Wrap it in slashes, such as `/^\\/blog\\//`, to have it used as a regular expression; with `group` or `subgroup` set it is always a plain substring.'
      ),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 100))
      .optional()
      .default(50)
      .describe(
        'Maximum number of pages to return. Defaults to 50; values above 100 are lowered to 100 rather than rejected.'
      ),
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe('1-based page number to return. Defaults to 1.'),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of pages in the run matching the filters, ignoring paging — `ceil(total / limit)` pages are available.'
      ),
    limit: z
      .number()
      .describe(
        'Page size that was applied: the requested `limit` capped at 100, or 50 when none was sent.'
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
              'ID of this page’s result row — the `itemId` that `get_accessibility_report_item_result` takes.'
            ),
          itemId: z
            .number()
            .describe(
              'ID the checker recorded for the crawled page itself, inside the project. It is not the id `get_accessibility_report_item_result` takes — use `id` for that — and two runs report the same `itemId` for the same page.'
            ),
          url: z
            .string()
            .describe(
              'URL of the page that was checked. An empty string when the run did not record one.'
            ),
          state: z
            .string()
            .describe(
              'Lifecycle of this page’s check: `pending` while it is queued, `running` while the checker is on it, `finished` once it has results, `unknown` for any stored value the API does not recognize.'
            ),
          status: z
            .string()
            .describe(
              'Status text the checker stores beside `state`, passed through as recorded. It is prose rather than a fixed set, so read `state` for the lifecycle.'
            ),
          knownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Known problems on this page: findings the checker is certain are violations. `0` when there are none or the page has not been checked yet.'
            ),
          likelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Likely problems on this page: findings the checker believes are violations but cannot confirm without a person looking. `0` when there are none.'
            ),
          potentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Potential problems on this page: findings that may be violations depending on runtime or human judgement. `0` when there are none.'
            ),
          archivedKnownProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Known problems on this page that have since been archived, so they are kept for history but no longer counted in `knownProblems`. `0` when nothing is archived.'
            ),
          archivedLikelyProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Likely problems on this page that have since been archived and are no longer counted in `likelyProblems`. `0` when nothing is archived.'
            ),
          archivedPotentialProblems: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Potential problems on this page that have since been archived and are no longer counted in `potentialProblems`. `0` when nothing is archived.'
            ),
          groupsChecked: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Number of guideline groups the checker evaluated on this page — the WCAG guidelines, such as `1.1 Text Alternatives`. `0` before the page has been checked.'
            ),
          groupsFailed: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'How many of those groups produced at least one problem on this page.'
            ),
          groupsPassed: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'How many of those groups produced no problem on this page.'
            ),
          score: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Score the checker recorded for this page, unscaled — unlike `get_accessibility_score` it is not multiplied by 100. `0` when no score was recorded.'
            ),
          processError: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Error the checker hit while processing this page. `null` when it processed the page without one.'
            ),
          created: z.iso
            .datetime()
            .describe('ISO 8601 date and time the page row was created.'),
        })
      )
      .describe(
        'The page of results. Empty when no page of the run matches the filters.'
      ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}',
};
