import { z } from 'zod';

export const get_project_sitemap_items = {
  name: 'get_project_sitemap_items',
  description:
    'List sitemap items. ' +
    'Lists the sitemap tree of a project, one row per item: either a page (`type: link`) or a container that groups pages (`type: container`). ' +
    'Send `parentId` to list the children of one container instead of the whole tree. ' +
    '`limit` and `offset` page the result: `offset` is 0-based and only applied when `limit` is sent, and when both are sent `nextOffset` is `offset + limit`. Without `limit` everything matching is returned and `nextOffset` is null. ' +
    'The tree is cut at the configured maximum level of the project, so `total` can be larger than the number of rows. ' +
    'To read one item with its metadata, call `get_project_sitemap_item_details`.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('Id of the project, as returned by `get_projects`.'),
    parentId: z
      .number()
      .optional()
      .describe(
        'Id of the container whose children to list. Omit it to list from the top of the sitemap. An id that is not a container of this project lists nothing rather than failing.'
      ),
    limit: z
      .number()
      .optional()
      .describe(
        'Maximum number of items to return. Omit it to return every matching item; there is no default and no maximum.'
      ),
    offset: z
      .number()
      .optional()
      .describe(
        'Number of items to skip, 0-based. Only applied when `limit` is also sent; without `limit` the whole set is returned from the beginning.'
      ),
  }),
  outputSchema: z.object({
    parentId: z
      .number()
      .nullable()
      .describe(
        'Container the listing was made under: `parentId` as sent, or null when the whole tree was listed.'
      ),
    total: z
      .number()
      .describe(
        'Number of items under `parentId`, across every page — not the number of rows in `items`. It can be larger than the rows even without paging, because the tree is cut at the maximum level of the project.'
      ),
    limit: z
      .number()
      .nullable()
      .describe(
        'Page size the call used, or null when `limit` was omitted and everything was returned.'
      ),
    offset: z
      .number()
      .nullable()
      .describe(
        'Number of items skipped before the first row, or null when no `offset` was sent.'
      ),
    nextOffset: z
      .number()
      .nullable()
      .describe(
        'Offset to send for the next page: `offset + limit`. It is computed without checking whether more items exist, so a page shorter than `limit` means there is nothing left. Null when `offset` or `limit` was omitted.'
      ),
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Item id. Read the item through `get_project_sitemap_item_details`, and pass it in `includeLinksByProject` or `excludeLinksByProject` when calling `create_project_from_url`.'
            ),
          title: z
            .string()
            .describe(
              'Title of the page or container, as the application stores it.'
            ),
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
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Id of the category assigned to the item, from `get_project_categories`. Null when it is uncategorised.'
            ),
          workflowStatus: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Workflow status assigned to the item, as the key returned by `get_project_workflow_statuses`, for example `publish`. Null when no status is set.'
            ),
          parent: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Id of the parent item in the sitemap tree. 0 when the item sits at the root, and null when no parent is recorded.'
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
            .describe(
              'Number of published comments recorded for the page of the item.'
            ),
          linkStatus: z
            .number()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Link status the crawler recorded for the item, in the encoding of the application. Null when the item has no recorded status.'
            ),
          linkType: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Link type the crawler recorded for the item, in the encoding of the application. Null when it has none.'
            ),
          backgroundColor: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Background colour the application paints the item with in the sitemap. Null when it uses the default.'
            ),
          foregroundColor: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe(
              'Text colour the application paints the item with in the sitemap. Null when it uses the default.'
            ),
        })
      )
      .describe('The items on this page.'),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/item',
};
