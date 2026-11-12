import { z } from 'zod';

export { PROJECT_ID_DESCRIPTION } from './project.js';

export const SITEMAP_ITEM_ID_DESCRIPTION =
  'ID of the sitemap item, as `get_project_sitemap_items` reports it.';

export const SITEMAP_PARENT_ID_DESCRIPTION =
  'ID of the container whose children are listed, or of the item whose subtree is listed. Omit it to start from the top of the sitemap.';

const thumbnailSchema = z.object({
  title: z.string().describe('Title recorded for the thumbnail image.'),
  sm: z
    .string()
    .describe(
      'Small variant of the thumbnail image, as the application stores it.'
    ),
  lg: z
    .string()
    .describe(
      'Large variant of the thumbnail image, as the application stores it.'
    ),
});

const hreflangSchema = z.object({
  href: z
    .string()
    .describe(
      'Address of the page in that language, as recorded for the item.'
    ),
  lang: z
    .string()
    .describe('Language code of that version, for example `en-US` or `de`.'),
});

/**
 * A sitemap item as the item reads and single-item writes report it.
 */
export const sitemapItemSchema = z.object({
  id: z.number().describe('Item id.'),
  title: z
    .string()
    .describe('Title of the page or container, as the application stores it.'),
  url: z
    .string()
    .nullable()
    .describe(
      'Address of the page this item represents. Null when the item has no address of its own, as a container normally does not.'
    ),
  type: z
    .enum(['link', 'container'])
    .describe(
      'What the item is. `link` is a page with a URL; `container` is a folder that groups other items and is not itself a page.'
    ),
  category: z
    .number()
    .nullable()
    .describe(
      'ID of the category assigned to the item, from `get_project_categories`. Null when it is uncategorized.'
    ),
  workflowStatus: z
    .string()
    .nullable()
    .describe(
      'Workflow status assigned to the item, as the key returned by `get_project_workflow_statuses`, for example `publish`. Null when no status is set.'
    ),
  priority: z
    .number()
    .nullable()
    .describe(
      'Sitemap priority recorded for the page, as the application stores it. Null when no priority is set.'
    ),
  changeFrequency: z
    .string()
    .describe(
      'How often the page is expected to change, as a sitemap change frequency such as `weekly` or `monthly`. The application reports `monthly` when the item has none set.'
    ),
  metaKeywords: z
    .string()
    .nullable()
    .describe(
      'Meta keywords of the page, taken from the item or from what the crawler recorded for it. Null when neither has them.'
    ),
  metaDescription: z
    .string()
    .nullable()
    .describe(
      'Meta description of the page, taken from the item or from what the crawler recorded for it. Null when neither has them.'
    ),
  tags: z
    .array(z.string())
    .describe(
      'Tags attached to the item in the application. Empty when it has none.'
    ),
  thumbnail: thumbnailSchema
    .nullable()
    .describe('Thumbnail images recorded for the item. Null when it has none.'),
  mode: z
    .enum(['', 'Slug', 'Static'])
    .describe(
      'Which address scheme applies to the page. `Slug` means the address is built from `slug`, `Static` that it is `staticUrl`, and an empty string that the application has no link path for the item, so neither field means anything.'
    ),
  slug: z
    .string()
    .describe(
      'Path segment the application uses for the page when `mode` is `Slug`. Empty when the application has no link path for the item.'
    ),
  staticUrl: z
    .string()
    .describe(
      'Full address the application serves the page at when `mode` is `Static`. Empty when the application has no link path for the item.'
    ),
  backgroundColor: z
    .string()
    .nullable()
    .describe(
      'Background color the application paints the item with in the sitemap. Null when it uses the default.'
    ),
  foregroundColor: z
    .string()
    .nullable()
    .describe(
      'Text color the application paints the item with in the sitemap. Null when it uses the default.'
    ),
  hreflang: z
    .array(hreflangSchema)
    .describe(
      'Language alternates recorded for the page. Empty when it has none.'
    ),
});

/**
 * The item shape the create and update writes return, which adds
 * `linkPathSaved` when `pathMode` was sent.
 */
export const sitemapItemWithLinkPathSchema = sitemapItemSchema.extend({
  linkPathSaved: z
    .boolean()
    .optional()
    .describe(
      'Present only when `pathMode` was sent. `true` when the application saved the link path; `false` when the item was written but its address was not, which `update_project_sitemap_item` with `pathMode` retries.'
    ),
});

/**
 * One row of the sitemap tree, as the list returns it.
 */
export const sitemapItemListRowSchema = z.object({
  id: z
    .number()
    .describe(
      'Item id. Read the item through `get_project_sitemap_item_details`, and use it in `includeLinksByProject` or `excludeLinksByProject` when calling `create_project_from_url`.'
    ),
  title: z
    .string()
    .describe('Title of the page or container, as the application stores it.'),
  url: z
    .string()
    .nullable()
    .describe(
      'Address of the page this item represents. Null when the item has no address of its own, as a container normally does not.'
    ),
  type: z
    .enum(['link', 'container'])
    .describe(
      'What the item is. `link` is a page with a URL; `container` is a folder that groups other items and is not itself a page.'
    ),
  category: z
    .number()
    .nullable()
    .describe(
      'ID of the category assigned to the item, from `get_project_categories`. Null when it is uncategorized.'
    ),
  workflowStatus: z
    .string()
    .nullable()
    .describe(
      'Workflow status assigned to the item, as the key returned by `get_project_workflow_statuses`, for example `publish`. Null when no status is set.'
    ),
  parent: z
    .number()
    .nullable()
    .describe(
      'ID of the item’s parent in the sitemap tree. 0 when the item sits at the root.'
    ),
  ordering: z
    .number()
    .describe(
      'Order index the application uses to sort items within their parent.'
    ),
  depth: z
    .number()
    .describe(
      'Level the sitemap tree records for the row: its position in the tree rather than a count of link hops from the start URL.'
    ),
  children: z
    .number()
    .describe(
      'Number of published items the application counts beneath this one.'
    ),
  comments: z
    .number()
    .describe('Number of published comments recorded for the item’s page.'),
  contentCount: z
    .number()
    .describe(
      'Number of content blocks the page holds, as the application counts them. 0 for a container, and for a page whose content has not been crawled or written yet. Read the blocks themselves through `get_project_sitemap_item_content`.'
    ),
  linkStatus: z
    .number()
    .nullable()
    .describe(
      'Link status the crawler recorded for the item, in the application’s own encoding. Null when the item has no recorded status.'
    ),
  linkType: z
    .string()
    .nullable()
    .describe(
      'Link type the crawler recorded for the item, in the application’s own encoding. Null when it has none.'
    ),
  backgroundColor: z
    .string()
    .nullable()
    .describe(
      'Background color the application paints the item with in the sitemap. Null when it uses the default.'
    ),
  foregroundColor: z
    .string()
    .nullable()
    .describe(
      'Text color the application paints the item with in the sitemap. Null when it uses the default.'
    ),
});

/**
 * The paged sitemap list.
 */
export const sitemapItemListSchema = z.object({
  parentId: z
    .number()
    .nullable()
    .describe(
      'Item the listing was made from: `parentId` from the request, or null when the whole tree was listed.'
    ),
  total: z
    .number()
    .describe(
      'Number of items the listing covers, across every page — not the number of rows in `items`. It includes the item named by `parentId`, and it can be larger than the rows even without paging, because the tree is cut at the project’s maximum level.'
    ),
  limit: z
    .number()
    .nullable()
    .describe(
      'Page size the request used, or null when `limit` was omitted and everything was returned.'
    ),
  offset: z
    .number()
    .nullable()
    .describe(
      'Number of items skipped before the first row, or null when the request sent no `offset`.'
    ),
  nextOffset: z
    .number()
    .nullable()
    .describe(
      'Offset to send for the next page: `offset + limit`. It is computed without checking whether more items exist, so a page shorter than `limit` means there is nothing left. Null when `offset` or `limit` was omitted.'
    ),
  items: z.array(sitemapItemListRowSchema).describe('The items on this page.'),
});

/**
 * One content block of a sitemap item.
 */
export const contentBlockSchema = z.object({
  id: z
    .number()
    .describe(
      'ID of the block, unique within the item. It is what a write refers to: a block sent with this id is rewritten in place, a block sent without one is added, and a stored block the write leaves out is deleted.'
    ),
  type: z
    .string()
    .describe(
      'Kind of block: `richtext`, `text`, `link`, `image`, `file` or `video`. It decides what `content` and `properties` mean and how the block renders, and it cannot be changed after the block is created.'
    ),
  content: z
    .string()
    .describe(
      'The body the block renders. For `richtext` this is HTML as the page shows it, for `text` plain text that is escaped when rendered, and for a `video` whose `properties.custom` is set it is the embed markup. The application ignores it for `link`, `image` and `file` and renders those from `properties` alone.'
    ),
  properties: z
    .record(z.string(), z.unknown())
    .describe(
      'Settings the block’s type reads, as an object of free-form keys, by type: `richtext` and `text` read none; `link` reads `url`, `text` and `newTab`; `image` reads `imageUrl`, or `custom: 1` with `url` and `alt`; `file` reads `url` and `name`; `video` reads `url` and `text`, or `custom: 1` with the embed in `content`. A key the type does not read is kept as stored and has no effect on the markup.'
    ),
  settings: z
    .object({
      wrapper: z
        .string()
        .describe(
          'Tag the application wraps the block in — `div`, `section`, `figure` and the other container tags this API accepts — or `none` for no wrapper at all. A block stored with no wrapper, an empty one, or one this API cannot safely interpolate into markup renders as `none`.'
        ),
      wrapperClass: z
        .string()
        .describe(
          'Class the wrapper element carries. Empty when the wrapper has none.'
        ),
      wrapperId: z
        .string()
        .describe(
          'ID the wrapper element carries. Empty when the wrapper has none.'
        ),
    })
    .describe('How the block is wrapped when it is rendered.'),
  ordering: z
    .number()
    .describe(
      'Position among the item’s blocks. A write sets it from the position of the block in the array it sends, so the array’s order is the page’s order, and the positions run from 1 without gaps afterwards. A page the application wrote may have blocks that share a position; a read returns those in id order.'
    ),
  rendered: z
    .string()
    .describe(
      'The block as the application renders it into the page, wrapper included — an anchor for a `link`, an `img` for an `image`, a player embed for a `video`, the stored HTML for `richtext`. It is built from the stored values on every read, and its HTML is sanitized: scripts, event handlers and `javascript:` addresses are removed, while frames, media and inline SVG survive. A `<form>` and its controls are removed and their text kept, so a page that pasted one renders without it.'
    ),
});

export const contentBlocksSchema = z.object({
  items: z
    .array(contentBlockSchema)
    .describe('The blocks of the item, in render order.'),
});

/**
 * The step a read of the undo or redo history reports.
 */
export const historyStepSchema = z.object({
  entity: z
    .string()
    .nullable()
    .describe(
      'Kind of edit the step would apply, for example `moveItem`, `deleteItems` or `renameTitle`. Null when there is nothing left to undo or redo.'
    ),
  label: z
    .string()
    .nullable()
    .describe(
      'The label the application shows for that kind, for example `Move` or `Assign Tag`. Null when there is nothing to undo or redo.'
    ),
  appliedAt: z.iso
    .datetime()
    .nullable()
    .describe(
      'When the step was recorded, or last walked, as an ISO 8601 timestamp. Null when there is nothing to undo or redo.'
    ),
});

/**
 * The step an undo or redo write reports.
 */
export const historyActionSchema = z.object({
  action: z.enum(['undo', 'redo']).describe('Which direction was applied.'),
  entity: z.string().describe('Kind of edit that was reversed or replayed.'),
  label: z
    .string()
    .describe('The label the application shows for that kind of edit.'),
});

export const itemIdsResultSchema = z.object({
  itemIds: z
    .array(z.number())
    .describe(
      'IDs the response reports: the items the request named, in the order they were given, or the new copies for `duplicate_project_sitemap_item`.'
    ),
  totalItems: z
    .number()
    .describe(
      'Published item count the project reports after the write, as `get_project_details` returns it. Deleting, restoring or duplicating items changes it; moving them does not.'
    ),
});

export const deletedItemsResultSchema = z.object({
  deletedItemIds: z
    .array(z.number())
    .describe(
      'IDs the request deleted — the named items only, not the descendants that were soft-deleted with them. An item that was already deleted still appears here, so the list always matches the request.'
    ),
  totalItems: z
    .number()
    .describe('Published item count the project reports after the delete.'),
});

export const sortResultSchema = z.object({
  parentId: z
    .number()
    .nullable()
    .describe(
      'Container whose children were reordered, or null for the roots.'
    ),
  itemIds: z
    .array(z.number())
    .describe(
      'Children of `parentId` after the sort, in the order they were left in.'
    ),
  totalItems: z
    .number()
    .describe('Published item count the project reports after the sort.'),
});
