import { z } from 'zod';

export const create_visibility_keywords = {
  name: 'create_visibility_keywords',
  description:
    'Adds up to 100 keywords to the project and returns their ids, one per entry of `keywords`, in the order sent. A keyword is identified by its text together with `locale` and `device`, so sending a combination that already exists returns the existing id instead of creating a duplicate — the call is safe to repeat, and repeating it with a different `group` does not move the keywords either. Tracking is queued, not immediate: an account at its keyword allowance gets the keywords stored but left inactive, and they appear in `get_visibility_project_ranking` with `enabled` of `false` and no positions until room frees up. Checks then run in the background over the following days; poll `get_visibility_project_ranking` for the positions.',
  inputSchema: z.object({
    projectId: z.number().describe('Numeric project id, from `get_projects`.'),
    keywords: z
      .array(z.string().min(1).max(255))
      .min(1)
      .max(100)
      .describe(
        'Keyword texts to track, 1 to 100 entries, each 1 to 255 characters after trimming. Stored lower-cased, so `Coffee` and `coffee` are the same keyword; a text already tracked for the same locale and device is returned rather than duplicated.'
      ),
    locale: z
      .string()
      .default('en-us')
      .describe(
        'Locale whose search results the keywords are tracked in, one of the values from `get_visibility_locales`. Defaults to `en-us`; rankings are per locale, so the same keyword in two locales is two tracked keywords with separate history.'
      ),
    device: z
      .enum(['desktop', 'tablet', 'mobile'])
      .default('desktop')
      .describe(
        'Device whose search results the keywords are tracked on: `desktop`, `tablet` or `mobile`. Defaults to `desktop`; each device is tracked separately, so tracking desktop and mobile takes two entries in `ids`.'
      ),
    group: z
      .number()
      .optional()
      .describe(
        'Id of an existing group, from `get_visibility_project_groups`, to file the new keywords under. Omitted means no group; the group must belong to the same account, and an id from another account fails with 500 rather than being ignored.'
      ),
  }),
  outputSchema: z.object({
    ids: z
      .array(z.number())
      .describe(
        'Ids of the tracked keywords, one per entry of `keywords` and in the same order, so the first id belongs to the first keyword sent. These are the `id` values of `get_visibility_project_ranking` and the ids that `update_visibility_keywords_group` and `update_visibility_keyword_setting` expect.'
      ),
  }),
  method: 'post',
  path: '/v1/visibility/{projectId}/keyword',
};
