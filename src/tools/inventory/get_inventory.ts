import { z } from 'zod';

export const get_inventory = {
  name: 'get_inventory',
  description:
    'List the links the crawl found on the site: one row per distinct host and path, with the status the URL answered, the element it was found in and how many references the crawl counted. `total` counts the distinct URLs the filters matched, `limit` defaults to 100 and `page` to 1, and `pageSize` reports how many pages of that size the match spans. Inventory exists only once a crawl has run: a project that was never crawled answers 500 rather than an empty page. For the totals alone use `get_inventory_summary`, for the links on one sitemap item use `get_inventory_item_links`, and for where a row is referenced use `get_inventory_link_occurrences` with `items[].id` as `linkId`.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe(
        'Id of the project, as returned by `get_projects`, and also the id the crawl of the project is stored under'
      ),
    limit: z.coerce
      .number()
      .optional()
      .describe(
        'Maximum number of links to return in this page. Defaults to 100. A negative value is treated as 0, which returns no rows, and no upper bound is applied, so a large value returns a large page'
      ),
    page: z.coerce
      .number()
      .optional()
      .describe(
        '1-based page number to return. Defaults to 1, and a value below 1 is treated as 1. A page past the end answers an empty `items` with the full `total` still reported'
      ),
    orderBy: z
      .enum(['occurrence', 'status', 'id', 'last_modified'])
      .optional()
      .describe(
        'Field to sort by. `occurrence` puts the most referenced URLs first, `status` sorts ascending by HTTP status, `id` sorts ascending by link id and `last_modified` puts the most recently modified pages first. Defaults to `id`'
      ),
    search: z
      .string()
      .trim()
      .optional()
      .describe(
        'Text to match against the URL of the link and the anchor text recorded for it, compared with SQL `LIKE`, so `%` and `_` act as wildcards rather than literal characters. A numeric value also matches links whose stored status equals that number exactly'
      ),
    status: z
      .enum(['ok', 'bad', 'redirect', 'unexpected'])
      .optional()
      .describe(
        'HTTP status bucket to keep. `ok` is 200-299, `bad` is 400-599, `redirect` is 300-399 and `unexpected` is a stored status above 599, meaning the crawl got no HTTP response. No value selects 100-199 or a link with no stored status, and omitting the parameter keeps every status'
      ),
    type: z
      .enum(['page', 'image', 'file', 'document', 'audio', 'video'])
      .optional()
      .describe(
        'Media type to keep, decided from the response MIME type and the file extension of the URL. `page` is HTML answered with a status between 200 and 599, `image` a successfully answered PNG, JPEG, GIF, WebP or SVG, `document` a PDF, Word, Excel or PowerPoint file, `audio` MP3, WAV, OGG, AAC or FLAC, `video` MP4, WebM, OGV, AVI, MOV or MKV or an embedded YouTube, Dailymotion or Vimeo player, and `file` any other successful response that is none of those'
      ),
    location: z
      .enum(['internal', 'external'])
      .optional()
      .describe(
        '`internal` keeps links that stay on the crawled site and `external` keeps links that point at another site, matching the `isExternal` field of each row. Omitting the parameter keeps both'
      ),
    language: z
      .string()
      .optional()
      .describe(
        'Language code recorded for the page, such as `en`, matched exactly rather than as a prefix. A page whose language the crawl did not record never matches, so sending it narrows the result to pages with a known language'
      ),
    discoverability: z
      .enum([
        'crawlable',
        'non-crawlable',
        'indexable',
        'non-indexable',
        'orphan',
      ])
      .optional()
      .describe(
        'What the `robots` directives of the site allowed for the link. `crawlable` and `non-crawlable` keep links whose directives allow, or forbid, following them, `indexable` and `non-indexable` do the same for indexing, and `orphan` keeps links that no page in the site is recorded as linking to. Only one of the five can be sent, and omitting it keeps every link'
      ),
  }),
  outputSchema: z.object({
    total: z
      .number()
      .describe(
        'Number of distinct URLs the filters matched across every page, not the number in this page'
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
        'Number of pages of `limit` rows the match spans, `ceil(total / limit)`, so the last page is this number and a larger `page` is past the end. 0 when `limit` is 0'
      ),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Id of the link. Pass it as `linkId` to `get_inventory_link_occurrences`'
            ),
          sourceTag: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Name of the HTML element the link was found in, such as `a`, `area`, `img`, `iframe`, `frame` or `link`. Null when the crawler recorded the URL without an element, for example a URL it reached while following a redirect'
            ),
          url: z
            .string()
            .describe(
              'URL as the crawl recorded it. Empty string when the crawler stored none'
            ),
          title: z
            .string()
            .describe(
              'Title of the page at this URL. Empty string when the page declares no title or was never fetched'
            ),
          status: z
            .number()
            .describe(
              'HTTP status the URL answered: 200-299 for a success, 300-399 for a redirect, 400-599 for a client or server error, and a value above 599 for a link the crawl got no HTTP response for, which is the range the `unexpected` filter selects. 0 when no status was stored at all'
            ),
          mimetype: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'MIME type the response declared, for example `text/html` for a page or `image/png` for an image. Null when the crawl recorded none, which is usual for a URL that never answered'
            ),
          encoding: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Character encoding the crawl stored for the response body, for example `utf-8`. Null when none was recorded'
            ),
          isExternal: z
            .boolean()
            .describe(
              'Whether the URL points at another site rather than the crawled one: `true` for a link that leaves the site, `false` for one inside it. This is the field the `location` filter matches'
            ),
          occurrences: z
            .number()
            .describe(
              'How many references to this URL the crawl counted. 0 when the crawler reached the URL without finding a reference to it in the markup of the site itself'
            ),
          linkText: z
            .string()
            .describe(
              'Text the crawler captured along with the reference, which for a plain link is its anchor text. Empty string when nothing was captured'
            ),
          metaDescription: z
            .string()
            .describe(
              'Description meta tag of the page at this URL. Empty string when the page declares none'
            ),
          metaKeywords: z
            .string()
            .describe(
              'Keywords meta tag of the page at this URL. Empty string when the page declares none'
            ),
          language: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Language code the crawl recorded for the page, such as `en`. Null when none was recorded, and the `language` filter matches this value exactly'
            ),
          lastModified: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Value of the `Last-Modified` response header of the page, stored as the server sent it and so not necessarily ISO 8601. Null when the response carried no such header'
            ),
          headers: z
            .array(z.array(z.string()))
            .describe(
              'Response headers captured for the page, one `[name, value]` pair per header: element 0 is the header name and element 1 its value. Empty when no headers were stored for the URL'
            ),
        })
      )
      .describe('The links on this page, in the order requested by `orderBy`'),
  }),
  method: 'get',
  path: '/v1/inventory/{projectId}',
};
