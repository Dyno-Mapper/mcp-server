import { z } from 'zod';

export const get_inventory_link_occurrences = {
  name: 'get_inventory_link_occurrences',
  description:
    'List where one link is used: each row is a page on the crawled site that contains a reference to the URL asked about, with that page title, status and the anchor text it used. The same URL referenced from ten pages is one row in `get_inventory` and ten rows here, which is how the pages that carry a broken or duplicated URL are found. `linkId` is a link id from `get_inventory` or `get_inventory_item_links`, never a sitemap item id. An id that no page references answers `total` 0 with an empty `items`; each returned `id` is the id of the referencing page. A project that was never crawled answers 500 rather than an empty list.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('ID of the project, as returned by `get_projects`'),
    linkId: z
      .number()
      .describe(
        'Link id, `items[].id` from `get_inventory` or `get_inventory_item_links`, never a sitemap item id. An id that no page references is not an error: `total` is 0 and `items` is empty'
      ),
    limit: z.coerce
      .number()
      .optional()
      .describe(
        'Maximum number of referencing pages to return in this page. Defaults to 100. A negative value is treated as 0, which returns no rows, and no upper bound is applied'
      ),
    page: z.coerce
      .number()
      .optional()
      .describe(
        '1-based page number to return. Defaults to 1, and a value below 1 is treated as 1'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Text to match against the anchor text this page used, the page title and the page URL, compared with SQL `LIKE`, so `%` and `_` act as wildcards rather than literal characters'
      ),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of pages that reference the link across every page, not the number in this page'
      ),
    limit: z
      .number()
      .describe(
        'Page size this response was built with: `limit` from the request, or 100 when it was omitted. Negative values arrive as 0'
      ),
    page: z
      .number()
      .describe(
        '1-based page this response holds: `page` from the request, or 1 when it was omitted'
      ),
    pageSize: z
      .number()
      .describe(
        'Number of pages of `limit` rows the match spans, `ceil(total / limit)`, so a larger `page` is past the end. 0 when `limit` is 0'
      ),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'ID of the page that references the link, an inventory link id of its own rather than the id that was asked about'
            ),
          url: z
            .string()
            .describe(
              'URL of the referencing page. Empty string when the crawl stored none'
            ),
          title: z
            .string()
            .describe(
              'Title of the referencing page. Empty string when it declares none or was never fetched'
            ),
          status: z
            .number()
            .describe(
              'HTTP status the referencing page answered: 200-299 for a success, 300-399 for a redirect, 400-599 for a client or server error, and a value above 599 for a page the crawl got no HTTP response for. 0 when no status was stored at all'
            ),
          linkText: z
            .string()
            .describe(
              'Anchor text this page used for the reference to the link that was asked about. Empty string when nothing was captured'
            ),
          metaDescription: z
            .string()
            .describe(
              'Description meta tag of the referencing page. Empty string when it declares none'
            ),
          metaKeywords: z
            .string()
            .describe(
              'Keywords meta tag of the referencing page. Empty string when it declares none'
            ),
        })
      )
      .describe(
        'The pages that reference the link. No sort is applied beyond the order the database returns, so do not rely on it between requests'
      ),
  }),
  method: 'get',
  path: '/v1/inventory/{projectId}/{linkId}/occurrences',
};
