import { z } from 'zod';

export const update_visibility_keyword_setting = {
  name: 'update_visibility_keyword_setting',
  description:
    'Moves keywords to a different locale or device — the pair that decides which search results their rank is read from — for a keyword added in the wrong market or one that should also be tracked elsewhere. Each keyword succeeds or fails on its own, so read `result` rather than assuming the call worked: it can succeed while keywords were skipped. A keyword that already has ranking history is refused, and so is one that would collide with a keyword already tracked for the same text under the target pair — in practice only keywords not yet checked can be moved. IDs from another project are filtered out and appear nowhere in `result`. Locale values come from `get_visibility_locales`.',
  inputSchema: z.object({
    projectId: z.number().describe('Numeric project id, from `get_projects`.'),
    ids: z
      .array(z.number())
      .min(1)
      .describe(
        'IDs of the keywords to change, at least one, as returned by `create_visibility_keywords` or read from `id` in `get_visibility_project_ranking`. IDs belonging to another project are ignored and are not reported back in `result`.'
      ),
    locale: z
      .string()
      .describe(
        'Locale to move the keywords to, one of the values from `get_visibility_locales`. Required, with no default here — unlike `create_visibility_keywords` there is no `en-us` fallback, so the target market always has to be stated.'
      ),
    device: z
      .enum(['desktop', 'tablet', 'mobile'])
      .describe(
        'Device to move the keywords to: `desktop`, `tablet` or `mobile`. Required, with no default; together with `locale` it is what identifies the keyword, so moving to a pair already used by the same text is refused for that keyword.'
      ),
  }),
  outputSchema: z.object({
    result: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'ID of the keyword this entry reports on, as sent in `ids`. Keywords from another project have no entry.'
            ),
          updated: z
            .boolean()
            .describe(
              '`true` when the locale and device were written for this keyword, `false` when it was skipped. The call succeeds either way, so a partial failure is only visible here.'
            ),
          error: z
            .string()
            .optional()
            .nullish()
            .describe(
              'Why the keyword was skipped: `Cannot update keyword with existing stats` when it already has ranking history, `Keyword already exists with different locale and device` when another keyword of the project already occupies the target pair, or the database error code for any other failure. `null` when `updated` is `true`.'
            ),
        })
      )
      .describe(
        'One entry per keyword that was considered, each reporting success or the reason it was left alone. The order is not guaranteed to match `ids`.'
      ),
  }),
  method: 'patch',
  path: '/v1/visibility/{projectId}/keyword-setting',
};
