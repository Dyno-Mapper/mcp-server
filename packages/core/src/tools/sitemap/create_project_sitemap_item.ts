import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  sitemapItemWithLinkPathSchema,
} from '../schemas/sitemap.js';

export const create_project_sitemap_item = {
  name: 'create_project_sitemap_item',
  description:
    'Create a sitemap item. ' +
    'Adds an item to the project’s sitemap tree: a page when `url` is sent, a container when it is not. ' +
    'The item is published immediately, carries no children, and takes its place after `afterItemId` or at the end of its parent’s children. ' +
    'Send `parentId: null` (or omit it) only to create the project’s root item; a project has exactly one, so once it has one this answers `root_exists`. ' +
    '`category` is an id and `workflowStatus` a key, not names; an unknown value is rejected rather than created. ' +
    'The write is one undo step, reversible with `undo_project_sitemap_edit`. ' +
    '`linkPathSaved` reports whether the address was saved; retry it with `update_project_sitemap_item`.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    title: z
      .string()
      .min(1)
      .describe(
        'Title of the new item. Required; the editor’s form requires one too.'
      ),
    url: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Address the item points at, stored verbatim — no trimming, no validation, no de-duplication, so two items may share one URL. Sending `null` or an empty string turns the item into a container; sending a URL turns it into a link and records the URL’s MD5 for the application’s own lookups.'
      ),
    category: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe(
        'ID of the category to assign, from `get_project_categories`. `null` clears it. An id this account cannot see is rejected with `unknown_category`; categories are never created implicitly.'
      ),
    workflowStatus: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Workflow status key to assign, from `get_project_workflow_statuses`, for example `publish`. `null` clears it. An unknown key is rejected with `unknown_workflow_status`; statuses are never created implicitly.'
      ),
    priority: z
      .number()
      .min(0)
      .max(1)
      .nullable()
      .optional()
      .describe(
        'Sitemap priority, between 0 and 1 inclusive. New items default to 0.5, the value the editor uses.'
      ),
    changeFrequency: z
      .enum([
        'always',
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'never',
      ])
      .nullable()
      .optional()
      .describe(
        'How often the page is expected to change, as a sitemap change frequency. `null` clears it. Only these seven values are accepted, unlike the free-text field the editor’s form allows.'
      ),
    metaDescription: z
      .string()
      .nullable()
      .optional()
      .describe('Meta description of the page. `null` clears it.'),
    metaKeywords: z
      .string()
      .nullable()
      .optional()
      .describe('Meta keywords of the page. `null` clears it.'),
    backgroundColor: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Background color the application paints the item with in the sitemap. `null` restores the default.'
      ),
    foregroundColor: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Text color the application paints the item with in the sitemap. `null` restores the default.'
      ),
    tags: z
      .array(z.string().min(1))
      .optional()
      .describe(
        'Tags of the item, as the complete set: the array replaces the tags the item has, in the order given, and duplicates are dropped. Send an empty array to remove them all.'
      ),
    hreflang: z
      .array(
        z.object({
          href: z
            .string()
            .min(1)
            .describe('Address of the page in that language.'),
          lang: z
            .string()
            .min(1)
            .describe('Language code, for example `en-US` or `de`.'),
        })
      )
      .optional()
      .describe(
        'Language alternates of the page, as the complete set: the array replaces the ones recorded. Send an empty array to remove them all.'
      ),
    pathMode: z
      .enum(['Slug', 'Static'])
      .optional()
      .describe(
        'Which address scheme the application should give the page: `Slug` builds the address from `slug`, `Static` uses `staticUrl`. Omit it to leave the item’s link path untouched. There is no way to clear a link path here, matching the editor, which cannot clear one either.'
      ),
    slug: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Path segment used when `pathMode` is `Slug`. Ignored unless `pathMode` is sent. Defaults to an empty string.'
      ),
    staticUrl: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Full address served when `pathMode` is `Static`. Ignored unless `pathMode` is sent. Defaults to an empty string.'
      ),
    parentId: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe(
        'ID of the container to create the item under. Omit it, or send `null`, only to create the project’s root item: a project has exactly one, the sitemap’s entry point, so creating a second answers `root_exists`. The parent must belong to this project.'
      ),
    afterItemId: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe(
        'ID of the sibling to place the new item after. Omit it to append to the end of the parent’s children. The sibling must be a child of `parentId`, otherwise the request is rejected with `invalid_after_item`.'
      ),
  }),
  outputSchema: sitemapItemWithLinkPathSchema,
  method: 'post',
  path: '/v1/project/{projectId}/item',
};
