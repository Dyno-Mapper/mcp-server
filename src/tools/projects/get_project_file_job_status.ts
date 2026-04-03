import { z } from 'zod';

export const get_project_file_job_status = {
  name: 'get_project_file_job_status',
  description: 'Get status of project job created from text or xml file',
  inputSchema: z.object({
    type: z.enum(['text', 'xml']).describe('Project file type'),
    id: z.coerce.number().describe('Project ID'),
  }),
  outputSchema: z.object({
    id: z.number().describe('Project ID'),
    startDateTime: z.iso
      .datetime()
      .optional()
      .nullish()
      .describe('Start date and time'),
    finishDateTime: z.iso
      .datetime()
      .optional()
      .nullish()
      .describe('Finish date and time'),
    finished: z.boolean().describe('Whether the crawl is finished'),
    lastUrl: z.string().optional().nullish().describe('Last URL crawled'),
    totalUrls: z.number().describe('Total number of URLs to crawl'),
    finishedUrls: z.number().describe('Number of URLs crawled'),
    failedUrls: z.number().describe('Number of URLs failed to crawl'),
    processedUrls: z.number().describe('Number of URLs processed'),
    message: z.string().optional().nullish().describe('Task message'),
  }),
  method: 'get',
  path: '/v1/project/{type}/{id}',
};
