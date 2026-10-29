import { z } from 'zod';

export const get_visibility_project_ranking = {
  name: 'get_visibility_project_ranking',
  description:
    'Returns one row per tracked keyword for the window between `startDate` and `endDate`, with each engine’s newest rank, the rank at the start of the window and the difference between them. A row is a keyword tracked for one locale and one device, so the same text on desktop and mobile is two rows. Rank fields are `null` until a check lands: give a newly added keyword a few days before reading a rank. Only published keywords and those awaiting publication are listed. `limit` defaults to 50 and is capped at 100, and `pageSize` is a page count, not a row count. A project with no Visibility domain record answers with 500, not an empty page.',
  inputSchema: z.object({
    projectId: z.number().describe('Numeric project id, from `get_projects`.'),
    startDate: z.iso
      .date()
      .describe(
        'First day of the window, inclusive, as `YYYY-MM-DD`. Required, with no default: ranks are always reported relative to a window, and the earliest recorded check inside it is the baseline the increases are measured from.'
      ),
    endDate: z.iso
      .date()
      .describe(
        'Last day of the window, inclusive, as `YYYY-MM-DD`. Required. The newest check on or before this day is the one the position fields report.'
      ),
    orderBy: z
      .enum([
        'keyword',
        'google',
        'bing',
        'yahoo',
        'volume',
        'avg_cpc',
        'google_increase',
        'bing_increase',
        'yahoo_increase',
      ])
      .default('keyword')
      .describe(
        'Sort key: `keyword` sorts alphabetically by keyword text, `google`, `bing` and `yahoo` by the newest rank on that engine, `volume` and `avg_cpc` by the research figures, and `google_increase`, `bing_increase` and `yahoo_increase` by places gained during the window. Defaults to `keyword`; keywords with no value for the chosen key sort before ranked ones when `orderDir` is `asc` and after them when it is `desc`.'
      ),
    orderDir: z
      .enum(['asc', 'desc'])
      .optional()
      .default('asc')
      .describe(
        'Direction of `orderBy`: `asc` for smallest first, `desc` for largest first. Defaults to `asc`; `desc` is the useful one for rank and increase keys, because rank 1 is the best position.'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Only return keywords whose text contains this substring, matched anywhere inside the stored text rather than at the start. Trimmed before matching; omitted or empty means no text filter.'
      ),
    group: z.coerce
      .number()
      .optional()
      .describe(
        'Only return keywords assigned to this group id, from `get_visibility_project_groups`. A negative value such as `-1` returns the keywords in no group at all, `0` applies no group filter, and omitting it means keywords from every group including none.'
      ),
    device: z
      .enum(['desktop', 'tablet', 'mobile'])
      .optional()
      .describe(
        'Only return keywords tracked for this device: `desktop` for desktop search results, `tablet` or `mobile` for the respective mobile results. Omitted means all three.'
      ),
    locale: z
      .string()
      .trim()
      .optional()
      .describe(
        'Only return keywords tracked in this locale, one of the values from `get_visibility_locales` such as `en-us`. Omitted means every locale.'
      ),
    page: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        'Page to return, 1-based, so the first page is `1` and not `0`. Defaults to 1. A page past the end returns an empty `items` array with the real `total` intact.'
      ),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 100))
      .optional()
      .default(50)
      .describe(
        'Rows per page. Defaults to 50; any value above 100 is reduced to 100 rather than rejected, and the returned `limit` repeats the value actually used.'
      ),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of keywords matching the filters, across every page — not the number of rows in `items`.'
      ),
    limit: z
      .number()
      .describe(
        'Page size applied to this result page: the requested `limit`, capped at 100.'
      ),
    page: z.number().describe('Page these rows were taken from, 1-based.'),
    pageSize: z
      .number()
      .describe(
        'Number of pages the result set divides into at the applied `limit`. This is a page count, not the number of rows returned, and it is 0 when nothing matched.'
      ),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Id of the tracked keyword. This is the id `update_visibility_keywords_group` and `update_visibility_keyword_setting` expect in `ids`, and the `keywordId` of `get_visibility_keyword_ranking`.'
            ),
          keyword: z
            .string()
            .describe(
              'Keyword text, lower-cased as the application stores it, whatever case it was added in.'
            ),
          locale: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Locale the keyword is tracked in, one of the values from `get_visibility_locales`; the ranks in this row were read from that locale’s search results. `null` when the stored record carries no locale.'
            ),
          device: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Device whose search results the rank fields were read from: `desktop`, `tablet` or `mobile`. `null` when the record carries no device.'
            ),
          enabled: z
            .boolean()
            .describe(
              '`true` when the keyword is being checked, `false` while it waits for room under the account’s keyword allowance. A waiting keyword keeps its place in the list but has no ranks yet — see `create_visibility_keywords`.'
            ),
          group: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Name of the keyword group the keyword is assigned to, or `null` when it is in no group. The name of a group deleted with `delete_visibility_keyword_group` still appears here, because deleting a group does not unassign its keywords.'
            ),
          linkId: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Id of the stored ranking record the newest position came from. `null` when the keyword was not recorded inside the window.'
            ),
          endDate: z.iso
            .date()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Date of the newest check used in this row, as `YYYY-MM-DD`. This is the last recorded day inside the window, which may be earlier than the requested `endDate`. `null` when the keyword was not recorded at all.'
            ),
          startDate: z.iso
            .date()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Date of the oldest check inside the window, as `YYYY-MM-DD` — the baseline the `…Increase` fields are measured from. `null` when the keyword was not recorded.'
            ),
          googlePosition: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Newest Google rank in the window: a 1-based position in the organic results, where 1 is the top result. `null` when Google did not record the keyword inside the window.'
            ),
          googlePositionStart: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Google rank at the start of the window, 1-based. `null` when Google recorded nothing in the window.'
            ),
          googlePositionIncrease: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Places gained on Google during the window: the starting rank minus the newest rank. Positive when the keyword moved up, negative when it fell, `0` when it held its position; `null` when either end is missing.'
            ),
          googleLink: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'URL Google ranked for the keyword at the newest date. `null` when nothing was recorded.'
            ),
          bingPosition: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Newest Bing rank in the window: a 1-based organic position, where 1 is the top result. `null` when Bing did not record the keyword inside the window.'
            ),
          bingPositionStart: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Bing rank at the start of the window, 1-based. `null` when Bing recorded nothing in the window.'
            ),
          bingPositionIncrease: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Places gained on Bing during the window: the starting rank minus the newest rank. Positive is an improvement, negative a drop; `null` when either end is missing.'
            ),
          bingLink: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'URL Bing ranked for the keyword at the newest date. `null` when nothing was recorded.'
            ),
          yahooPosition: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Newest Yahoo rank in the window: a 1-based organic position, where 1 is the top result. `null` when Yahoo did not record the keyword inside the window.'
            ),
          yahooPositionStart: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Yahoo rank at the start of the window, 1-based. `null` when Yahoo recorded nothing in the window.'
            ),
          yahooPositionIncrease: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Places gained on Yahoo during the window: the starting rank minus the newest rank. Positive is an improvement, negative a drop; `null` when either end is missing.'
            ),
          yahooLink: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'URL Yahoo ranked for the keyword at the newest date. `null` when nothing was recorded.'
            ),
          volume: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Search volume recorded for the keyword in its locale by the keyword research data. `null` when no research figures exist for that keyword and locale.'
            ),
          avgCpc: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Average cost per click reported for the keyword in its locale by the keyword research data, in the currency that source stores. `null` when no research figures exist for that keyword and locale.'
            ),
          created: z.iso
            .datetime()
            .describe(
              'Date and time the keyword was added to the project, in ISO 8601 UTC form with a trailing `Z`.'
            ),
        })
      )
      .describe(
        'Keywords on this page, each a keyword tracked for one locale and one device.'
      ),
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}',
};
