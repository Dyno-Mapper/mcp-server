import { z } from 'zod';

export const get_inventory = {
  name: 'get_inventory',
  description: 'Get inventory of a project',
  inputSchema: z.object({
    projectId: z.number().describe('Project ID'),
    limit: z.coerce
      .number()
      .optional()
      .describe('Limit the number of results returned per page'),
    page: z.coerce.number().optional().describe('Page number to retrieve'),
    orderBy: z
      .enum(['occurrence', 'status', 'id', 'last_modified'])
      .optional()
      .describe('Order results by a specific field'),
    search: z
      .string()
      .trim()
      .optional()
      .describe('Search for a specific URL or title'),
    status: z
      .enum(['ok', 'bad', 'redirect', 'unexpected'])
      .optional()
      .describe('Filter by status code category'),
    type: z
      .enum(['page', 'image', 'file', 'document', 'audio', 'video'])
      .optional()
      .describe('Filter by item type'),
    location: z
      .enum(['internal', 'external'])
      .optional()
      .describe('Filter by location'),
    language: z.string().optional().describe('Filter by language code'),
    discoverability: z
      .enum([
        'crawlable',
        'non-crawlable',
        'indexable',
        'non-indexable',
        'orphan',
      ])
      .optional()
      .describe('Filter by discoverability status'),
  }),
  outputSchema: z.object({
    total: z.number().describe('Total number of inventory items found'),
    limit: z.number().describe('Number of items per page'),
    page: z.number().describe('Current page number'),
    pageSize: z
      .number()
      .describe('Actual number of items in the current response'),
    items: z
      .array(
        z.object({
          id: z.number().describe('Unique identifier for the item'),
          sourceTag: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Source tag of the item'),
          url: z.string().describe('Full URL of the item'),
          title: z.string().describe('Page title or filename'),
          status: z.number().describe('HTTP status code'),
          mimetype: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Content MIME type'),
          encoding: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Character encoding'),
          isExternal: z
            .boolean()
            .describe('True if the item is external to the project'),
          occurrences: z
            .number()
            .describe('Number of times URL is referenced on the website'),
          linkText: z
            .string()
            .describe('Text of the link leading to this item'),
          metaDescription: z.string().describe('Meta description of the page'),
          metaKeywords: z.string().describe('Meta keywords of the page'),
          language: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Language of the content'),
          lastModified: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Last modification timestamp'),
          headers: z
            .array(z.array(z.string()))
            .describe(
              'Header tags found on the page. ex: [[H1, Title], [H2, Subtitle]'
            ),
        })
      )
      .describe('Array of inventory items'),
  }),
  method: 'get',
  path: '/v1/inventory/{projectId}',
};
