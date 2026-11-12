import { z } from 'zod';

export const get_audit_client_error = {
  name: 'get_audit_client_error',
  description:
    'List client errors: the links the latest run recorded as answering with a status between 400 and 499, which means the link itself was wrong — stale, forbidden or mistyped — rather than the server failing. This is the 4xx subset of `get_audit_broken_links`, which also carries the 5xx and crawler-level failures; start here when the fix belongs to the link. Reads the latest run only, so a page fixed since that run stays listed until the next audit replaces it. Until the project has been audited once the answer is 500 `Project is not audited.` rather than an empty list. Requires the Content Audit feature, else 403 `feature_disabled`.',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    search: z
      .string()
      .trim()
      .describe(
        'Term matched against the URL of the affected page: one starting with `http` is matched as a URL prefix, any other is matched anywhere in the URL, and a three-digit term between 200 and 599 is matched as the status itself, so `404` narrows the list to that code. Omitted returns every row.'
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
        'Number of links answering with a 4xx status, across every page rather than just this one.'
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
              'ID of the record the run holds for this URL. Identify the row by `url` rather than by this id.'
            ),
          url: z.string().describe('The URL that answered with a 4xx status.'),
          status: z
            .number()
            .describe(
              'HTTP status the run recorded, between 400 and 499 on every row of this list.'
            ),
          occurrences: z
            .number()
            .describe(
              'How many times the run recorded this URL as a link. Zero means nothing on the site links to it and the crawler reached it another way.'
            ),
        })
      )
      .describe(
        'The client-error URLs on this page, grouped by host and path.'
      ),
  }),
  method: 'get',
  path: '/v1/audit/{projectId}/client-error',
};
