import { z } from 'zod';

export const get_audit_duplicate_description = {
  name: 'get_audit_duplicate_description',
  description:
    'List duplicated meta descriptions: the descriptions the latest run found on more than one page, one row per duplicated description rather than per page. `links` is how many pages share it and `urls` lists their addresses; a description repeated across a template makes those pages compete for the same snippet. A page with no description is on `get_audit_missing_description`, and one whose description is too long on `get_audit_long_description`. Reads the latest run only, so a page fixed since that run stays listed until the next audit replaces it; a project that has never been audited answers 500 `Project is not audited.` Requires the Content Audit feature, else 403 `feature_disabled`.',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    search: z
      .string()
      .trim()
      .describe(
        'Term matched against the URL of the affected page: one starting with `http` is matched as a URL prefix, any other is matched anywhere in the URL. It narrows the groups to those with a matching page URL and filters `urls` to the matches, while `links` keeps counting the whole group; omitted lists every group.'
      )
      .optional(),
    archived: z
      .enum(['1', '0'])
      .transform((v) => v === '1')
      .describe(
        'Which archived state to list, as a string: `1` for issues the account has archived in the application, `0` for issues it has not. Defaults to `0`, so archived issues stay hidden unless asked for.'
      )
      .optional(),
    limit: z.coerce
      .number()
      .describe('Number of rows to return per page. Defaults to 20.')
      .optional(),
    page: z.coerce
      .number()
      .describe('Page to return, 1-based. Defaults to 1.')
      .optional(),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of duplicated descriptions matching the filters, across every page rather than just this one.'
      ),
    limit: z
      .number()
      .describe('Page size used: the `limit` sent, or 20 when none was sent.'),
    page: z.number().describe('1-based number of the page returned.'),
    pageSize: z
      .number()
      .describe(
        'Number of pages of results, `ceil(total / limit)` — how many pages the full list takes to read, not how many rows are on this page.'
      ),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Id of the run’s duplicated-description record. Identify the group by `description`, not by this id.'
            ),
          description: z
            .string()
            .describe('Meta description the run found on more than one page.'),
          links: z
            .number()
            .describe(
              'Number of pages the run recorded sharing this description. Not narrowed by `search` — only `urls` is.'
            ),
          urls: z
            .array(z.string())
            .describe(
              'URLs of the pages sharing this description. With `search` set, only the pages whose URL matches are listed, so this can be shorter than `links`.'
            ),
        })
      )
      .describe(
        'The duplicated descriptions on this page, with the pages sharing each one.'
      ),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/duplicate-description',
};
