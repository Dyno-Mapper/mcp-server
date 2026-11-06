import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  SITEMAP_ITEM_ID_DESCRIPTION,
  sitemapItemWithLinkPathSchema,
} from '../schemas/sitemap.js';

export const update_project_sitemap_item = {
  name: 'update_project_sitemap_item',
  description:
    'Update a sitemap item. ' +
    'Changes the fields an item carries. Only the keys you send are written, so this is safe to use for a rename as well as for a full edit; `url: null` turns the item into a container and `category: null` or `workflowStatus: null` clears them. ' +
    'Sending `url` re-derives the item’s type, and editing the root’s URL also rewrites the project’s domain. ' +
    '`pathMode` sets the address scheme, with `slug` or `staticUrl`; sending it again retries an address that was not saved, and `linkPathSaved` reports whether it was. ' +
    'The write is one undo step, reversible with `undo_project_sitemap_edit`. ' +
    'The response is the item as `get_project_sitemap_item_details` returns it.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
    itemId: z.number().describe(SITEMAP_ITEM_ID_DESCRIPTION),
    title: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Title of the page or container, shown in the tree and used as the page title. Cannot be empty when it is sent.'
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
        'Id of the category to assign, from `get_project_categories`. `null` clears it. An id this account cannot see is rejected with `unknown_category`; categories are never created implicitly.'
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
        'Background colour the application paints the item with in the sitemap. `null` restores the default.'
      ),
    foregroundColor: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Text colour the application paints the item with in the sitemap. `null` restores the default.'
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
  }),
  outputSchema: sitemapItemWithLinkPathSchema,
  method: 'patch',
  path: '/v1/project/{projectId}/item/{itemId}',
};
