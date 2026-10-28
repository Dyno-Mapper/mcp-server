import { z } from 'zod';
export const get_project_sitemap_item_details = {
    name: 'get_project_sitemap_item_details',
    description: 'Get a sitemap item. ' +
        'Returns one sitemap item with its metadata: meta keywords and description, sitemap `priority` and `changeFrequency`, tags, language alternates and thumbnail. ' +
        'Metadata falls back to what the crawler recorded for the page when the item itself carries none. ' +
        '`mode`, `slug` and `staticUrl` describe the public address the page is given: `Slug` builds it from `slug`, `Static` from `staticUrl`, and an empty `mode` means the application has no link path for the item. ' +
        'The item is looked up through the project, so a project that cannot be read answers 404 or 403 first, and an `itemId` missing from this project answers 500 `Item not found` rather than 404. ' +
        'The paged list is `get_project_sitemap_items`.',
    inputSchema: z.object({
        projectId: z
            .number()
            .describe('Id of the project, as returned by `get_projects`.'),
        itemId: z
            .number()
            .describe('Id of the item, as returned by `get_project_sitemap_items`.'),
    }),
    outputSchema: z.object({
        id: z.number().describe('Item id.'),
        title: z
            .string()
            .describe('Title of the page or container, as the application stores it.'),
        url: z
            .string()
            .describe('Address of the page this item represents. A container normally has none.'),
        type: z
            .enum(['link', 'container'])
            .describe('What the item is. `link` is a page with a URL; `container` is a folder that groups other items and is not itself a page.'),
        category: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Id of the category assigned to the item, from `get_project_categories`. Null when it is uncategorised.'),
        workflowStatus: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Workflow status assigned to the item, as the key returned by `get_project_workflow_statuses`, for example `publish`. Null when no status is set.'),
        priority: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe('Sitemap priority recorded for the page, as the application stores it. Null when no priority is set.'),
        changeFrequency: z
            .string()
            .describe('How often the page is expected to change, as a sitemap change frequency such as `weekly` or `monthly`. The application reports `monthly` when the item has none set.'),
        metaKeywords: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Meta keywords of the page, taken from the item or from what the crawler recorded for it. Null when neither has them.'),
        metaDescription: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Meta description of the page, taken from the item or from what the crawler recorded for it. Null when neither has them.'),
        tags: z
            .array(z.string().describe('Tag name'))
            .describe('Tags attached to the item in the application. Empty when it has none.'),
        thumbnail: z
            .object({
            title: z.string().describe('Title recorded for the thumbnail image.'),
            sm: z
                .string()
                .describe('Small variant of the thumbnail image, as the application stores it.'),
            lg: z
                .string()
                .describe('Large variant of the thumbnail image, as the application stores it.'),
        })
            .optional()
            .nullish()
            .default(null)
            .describe('Thumbnail images recorded for the item. Null when it has none.'),
        mode: z
            .enum(['', 'Slug', 'Static'])
            .describe('Which address scheme applies to the page. `Slug` means the address is built from `slug`, `Static` that it is `staticUrl`, and an empty string that the application has no link path for the item, so neither field means anything.'),
        slug: z
            .string()
            .describe('Path segment the application uses for the page when `mode` is `Slug`. Empty when the application has no link path for the item.'),
        staticUrl: z
            .string()
            .describe('Full address the application serves the page at when `mode` is `Static`. Empty when the application has no link path for the item.'),
        backgroundColor: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Background colour the application paints the item with in the sitemap. Null when it uses the default.'),
        foregroundColor: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Text colour the application paints the item with in the sitemap. Null when it uses the default.'),
        hreflang: z
            .array(z.object({
            href: z
                .string()
                .describe('Address of the page in that language, as recorded for the item.'),
            lang: z
                .string()
                .describe('Language code of that version, for example `en-US` or `de`.'),
        }))
            .describe('Language alternates recorded for the page. Empty when it has none.'),
    }),
    method: 'get',
    path: '/v1/project/{projectId}/item/{itemId}',
};
