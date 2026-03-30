import { z } from 'zod';

export const get_inventory_summary = {
  name: 'get_inventory_summary',
  description: 'Get inventory summary of a project',
  inputSchema: z.object({
    projectId: z.number().describe('Project ID'),
  }),
  outputSchema: z.object({
    subdomains: z
      .array(z.string())
      .describe('List of subdomains found in the project'),
    pages: z.number().describe('Total number of pages'),
    internalLinks: z.number().describe('Total number of internal links'),
    externalLinks: z.number().describe('Total number of external links'),
    badLinks: z.number().describe('Total number of broken or bad links'),
    errors: z.number().describe('Total number of pages with errors'),
  }),
  method: 'get',
  path: '/v1/inventory/{projectId}/summary',
};
