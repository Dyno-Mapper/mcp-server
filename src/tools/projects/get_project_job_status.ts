import { z } from 'zod';

export const get_project_job_status = {
  name: 'get_project_job_status',
  description: 'Get project job status created by URL, text, or XML file',
  inputSchema: z.object({
    id: z.number().describe('Job ID'),
    source: z
      .enum(['url', 'text', 'xml'])
      .describe('Source of project creation'),
  }),
  outputSchema: z.object({
    id: z.number().describe('Job ID'),
    status: z
      .enum(['PENDING', 'RUNNING', 'PERSIST', 'FINISHED'])
      .describe('Job Status'),
    data: z
      .object({
        pageCount: z.number().nullable().describe('Page Count'),
        downloadCount: z.number().nullable().describe('Download Count'),
        crawlTime: z.number().nullable().describe('Crawl Time in Milliseconds'),
      })
      .nullable()
      .describe('Job Progress Data'),
    created: z.string().describe('Job Created Date'),
  }),
  method: 'get',
  path: '/v1/project/{source}/{id}',
};
