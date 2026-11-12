import { z } from 'zod';

export const COMMENT_ID_DESCRIPTION =
  'ID of the comment, as any comment response reports it. It must sit on the item named before it, or the write answers 404 with `comment_not_found`.';

/**
 * One comment as the item-level reads and the comment writes report it.
 */
export const commentSchema = z.object({
  id: z
    .number()
    .describe(
      'ID of the comment itself — not the sitemap item id, which is `itemId` here and the `commentId` argument of the item comment tools.'
    ),
  comment: z
    .string()
    .describe(
      'Text of the comment exactly as it was stored, passed through untouched: the API neither renders nor formats it. Surrounding whitespace was trimmed when it was written; the value is between 1 and 1000 characters.'
    ),
  name: z
    .string()
    .describe(
      'Name the commenter’s account carries, taken from their display name when the comment was written. An empty string when the account has none, never `null`.'
    ),
  email: z
    .string()
    .describe(
      'Email address the commenter’s account carries. An empty string when none is stored, never `null`. This is personal data, and it is the value `picture` is computed from.'
    ),
  picture: z
    .string()
    .describe(
      'Avatar URL on gravatar.com, built from the MD5 hash of the commenter’s lowercased, trimmed email address. An empty string when there is no email to hash, never `null`. The image is served by gravatar.com, not by this API.'
    ),
  created: z.iso
    .datetime()
    .describe(
      'ISO 8601 date and time, in UTC, when the comment was written. What `order` sorts on.'
    ),
  modified: z.iso
    .datetime()
    .nullable()
    .describe(
      'ISO 8601 date and time, in UTC, when the comment was last edited, or `null` when it has never been edited since it was written. A deletion also stamps the row, but a deleted comment is never returned, so a value here always means an edit.'
    ),
  itemId: z
    .number()
    .describe(
      'ID of the sitemap item the comment is attached to, as `get_project_sitemap_items` reports it and as the item comment tools take as `itemId`.'
    ),
});

/**
 * A row of the project-wide comment feed, which also names the item it
 * belongs to.
 */
export const projectCommentSchema = commentSchema.extend({
  itemTitle: z
    .string()
    .describe(
      'Title of the sitemap item the comment is attached to, as the project’s tree shows it. An empty string when the item has no title.'
    ),
  itemUrl: z
    .string()
    .nullable()
    .describe(
      'URL of the sitemap item the comment is attached to, or `null` when it has none — a container usually does not.'
    ),
});

const pageFields = {
  total: z
    .number()
    .describe(
      'Number of published comments that match the filters. Independent of `page` and `limit`.'
    ),
  limit: z
    .number()
    .describe(
      'Comments per page this response was built with: the `limit` that was sent, or 20 when none was, after the 100 cap was applied.'
    ),
  page: z
    .number()
    .describe(
      '1-based number of the page this response holds: the `page` that was sent, or 1 when none was.'
    ),
  pageSize: z
    .number()
    .describe(
      'Number of pages `total` divides into at this `limit`, rounded up. It is a page count rather than an item count: 41 comments at `limit` 20 report `pageSize` 3.'
    ),
};

/**
 * A page of one item’s comments.
 */
export const commentPageSchema = z.object({
  ...pageFields,
  items: z
    .array(commentSchema)
    .describe(
      'The comments on this page, oldest first unless `order=desc` was sent.'
    ),
});

/**
 * A page of the project-wide comment feed.
 */
export const projectCommentPageSchema = z.object({
  ...pageFields,
  items: z
    .array(projectCommentSchema)
    .describe(
      'The comments on this page, newest first unless `order=asc` was sent, each carrying the item it belongs to.'
    ),
});
