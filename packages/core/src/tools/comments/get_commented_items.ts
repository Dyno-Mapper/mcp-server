import { z } from 'zod';

export const get_commented_items = {
  name: 'get_commented_items',
  description:
    'List the sitemap items of a project that carry at least one published comment, most recently commented first. One row describes one sitemap item, a page or a container that groups items, not one comment, and an item nobody has commented on is never listed, so an empty `items` array means no commented item matched `search` or that `page` is past the last one. Paging is `page` (1-based, default 1) and `limit` (default 20, silently capped at 100). Nothing is queued: the call reads stored comments and answers immediately. Use `get_item_comments` to read the comments on one of these items.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('The ID of the project, as returned by `get_projects`'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .transform((n) => Math.min(n, 100))
      .optional()
      .describe(
        'How many items one page holds. Defaults to 20. Must be a positive whole number; a value above 100 is lowered to 100 rather than refused'
      ),
    page: z.coerce
      .number()
      .optional()
      .describe(
        '1-based number of the page to return. Defaults to 1, the first page. The value is not range-checked, so pass a whole number of 1 or more'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Return only items whose title contains this text. A plain substring test on the title, not a prefix or word search, with surrounding whitespace trimmed. An empty value applies no filter'
      ),
    orderBy: z
      .enum(['lastActivity', 'comments'])
      .optional()
      .describe(
        'Order of the list: `lastActivity` puts the item whose newest comment is the most recent first, `comments` puts the item with the most published comments first. Defaults to `lastActivity`'
      ),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of sitemap items in the project that have at least one published comment and match `search`. Independent of `page` and `limit`'
      ),
    limit: z
      .number()
      .describe(
        'Items per page this response was built with: the `limit` that was sent, or 20 when none was, after the 100 cap was applied'
      ),
    page: z
      .number()
      .describe(
        '1-based number of the page this response holds: the `page` that was sent, or 1 when none was'
      ),
    pageSize: z
      .number()
      .describe(
        'Number of pages `total` divides into at this `limit`, rounded up. It is a page count rather than an item count, despite the name: 41 commented items at `limit` 20 report `pageSize` 3'
      ),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Id of the sitemap item, as `get_project_sitemap_items` reports it and as `get_item_comments` expects it'
            ),
          title: z
            .string()
            .describe(
              'Title of the item as it appears in the sitemap of the project'
            ),
          type: z
            .enum(['link', 'container'])
            .describe(
              'Kind of sitemap item: `link` for an item that stands for a page of the site, `container` for a grouping item, the kind the `buckets` count of the project reports. Comments can be attached to either kind, so both appear in this list'
            ),
          url: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'URL the item stands for. Null, or absent, when the item has no URL of its own: a container may have none'
            ),
          comments: z
            .number()
            .describe(
              'Number of published comments on the item. At least 1: items with none are not listed'
            ),
          lastActivity: z.iso
            .datetime()
            .describe(
              'ISO 8601 date and time, in UTC, when the newest comment on the item was written. This is what the default order sorts on'
            ),
        })
      )
      .describe(
        'One entry per commented sitemap item: exactly the rows of this page'
      ),
  }),
  method: 'get',
  path: '/v1/comments/{projectId}',
};
