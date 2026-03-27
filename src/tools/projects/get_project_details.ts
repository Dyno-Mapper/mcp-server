import { z } from 'zod';

export const get_project_details = {
  name: 'get_project_details',
  description: 'Get the details of a project',
  inputSchema: z.object({
    projectId: z.number().describe('Project ID'),
  }),
  outputSchema: z.object({
    id: z.number().describe('Project ID'),
    alphaId: z.string().describe('Alpha ID'),
    type: z
      .enum(['scratch', 'crawler', 'xml', 'text', 'duplicate', 'merge'])
      .describe('Project type'),
    title: z.string().describe('Project title'),
    items: z.number().describe('Number of items in the project'),
    pages: z.number().describe('Number of pages in the project'),
    buckets: z.number().describe('Number of buckets in the project'),
    isPublic: z.boolean().describe('Whether the project is public'),
    domain: z.string().describe('Project domain'),
    groupId: z.number().nullable().describe('Group ID'),
    groupName: z.string().nullable().describe('Group name'),
    groupColor: z.string().nullable().describe('Group color'),
    logoUrl: z.string().describe('Logo URL'),
    thumbnail: z.string().nullable().describe('Thumbnail URL'),
    allowTextRefresh: z.boolean().describe('Whether text refresh is allowed'),
    allowXmlRefresh: z.boolean().describe('Whether XML refresh is allowed'),
    createdAt: z.string().describe('Creation timestamp'),
    crawlDate: z.string().describe('Crawl timestamp'),
    lastModified: z.string().describe('Last modified timestamp'),
    sitemapUrl: z.string().describe('Sitemap URL'),
  }),
  method: 'get',
  path: '/v1/project/{projectId}',
};
