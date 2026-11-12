import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  SITEMAP_ITEM_ID_DESCRIPTION,
  contentBlocksSchema,
} from '../schemas/sitemap.js';

export const replace_project_sitemap_item_content = {
  name: 'replace_project_sitemap_item_content',
  description:
    'Replace the content blocks of an item. ' +
    'Replaces every content block of one page with the blocks in the request, in the order they are sent. ' +
    'It is the only write: the editor holds the whole set, so a partial update would have to invent what it means for the blocks it was not told about. ' +
    'A block sent with an `id` is rewritten in place and must keep its `type`; a block without an id is added; a stored block absent from the array is deleted. ' +
    'An empty array clears the page without touching the item. ' +
    'The whole request is checked before anything is written. ' +
    'Read the result with `get_project_sitemap_item_content`.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    itemId: z.number().describe(SITEMAP_ITEM_ID_DESCRIPTION),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .int()
            .min(0)
            .nullable()
            .optional()
            .describe(
              'ID of a block this item already holds, as a read returned it. The block is rewritten in place with this content, these settings and this position. Leave it out — or send `null` or `0` — to add a new block.'
            ),
          type: z
            .enum(['richtext', 'text', 'link', 'image', 'file', 'video'])
            .describe(
              'Kind of the block. One of the six the application renders; a block created with one type cannot become another, so a block that needs a different type has to be deleted and added.'
            ),
          content: z
            .string()
            .optional()
            .describe(
              'Body of the block, interpreted as the read describes it. HTML sent for a `richtext` block or a custom `video` embed is sanitized before storage, and omitting the field means empty. The ceilings are 1 MB for `richtext`, 256 KB for `text` and 64 KB for the other four.'
            ),
          properties: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
              'The keys the block’s type reads: `link` reads `url`, `text` and `newTab`; `image` reads `imageUrl`, or `custom: 1` with `url` and `alt`; `file` reads `url` and `name`; `video` reads `url` and `text`, or `custom: 1` with the embed in `content`; `richtext` and `text` read none. A key the type does not read is kept as stored, and an address that reaches an `href` or `src` must be absolute `http(s)`; a protocol-relative `//` address is accepted, and a `link` may be a `mailto:` address. Omitted means no keys, which leaves a `link`, `image`, `file` or non-custom `video` with nothing to render.'
            ),
          settings: z
            .object({
              wrapper: z
                .string()
                .optional()
                .describe(
                  'Container tag to wrap the block in, for example `div`, `section` or `figure`. Omitted or empty means `none`, which renders the block’s markup on its own. Only container tags are accepted: anything else is refused rather than stored.'
                ),
              wrapperClass: z
                .string()
                .optional()
                .describe(
                  'Class for the wrapper element. Omitted means empty; ignored when there is no wrapper.'
                ),
              wrapperId: z
                .string()
                .optional()
                .describe(
                  'ID for the wrapper element. Omitted means empty; ignored when there is no wrapper.'
                ),
            })
            .optional()
            .describe(
              'How the block is wrapped when it is rendered. Omitted means no wrapper.'
            ),
        })
      )
      .describe(
        'Every block the item should end up with, in the order the page should show them. The set is replaced wholesale — a block whose id is sent is rewritten, one without an id is added, and a stored block omitted from the array is deleted — with at most 500 blocks and 5 MB across the request.'
      ),
  }),
  outputSchema: contentBlocksSchema,
  method: 'put',
  path: '/v1/project/{projectId}/item/{itemId}/content',
};
