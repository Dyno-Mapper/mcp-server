import { z } from 'zod';

export const create_project_from_file = {
  name: 'create_project_from_file',
  description: 'Create a Project from a text or xml file',
  inputSchema: z.object({
    type: z.enum(['text', 'xml']).describe('File format type'),
    speed: z
      .enum(['slower', 'slowest'])
      .optional()
      .describe('Crawl speed (default: as fast as possible)'),
    url: z
      .url({ protocol: /^https?$/ })
      .optional()
      .describe(
        'URL of the sitemap file (e.g. https://example.com/sitemap.xml, https://example.com/urllist.txt)'
      ),
    file: z
      .string()
      .optional()
      .describe('Absolute path to file if URL is not provided (Max: 64MB)'),
  }),
  outputSchema: z.object({
    id: z.number().describe('Project ID'),
  }),
  method: 'post',
  path: '/v1/project/{type}',
  multipart: true,
};
