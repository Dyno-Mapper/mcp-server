import { z } from 'zod';

export const get_project_url_job_status = {
  name: 'get_project_url_job_status',
  description: 'Get Project job status created by URL',
  inputSchema: z.object({
    id: z.coerce.number().describe('Job ID'),
  }),
  outputSchema: z.object({
    id: z.coerce.number().describe('Job ID'),
    status: z
      .enum(['PENDING', 'RUNNING', 'PERSIST', 'FINISHED'])
      .describe('Job Status')
      .default('PENDING'),
    data: z
      .object({
        pageCount: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Page Count'),
        downloadCount: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Download Count'),
        crawlTime: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe('Crawl Time in Milliseconds'),
      })
      .optional()
      .nullish()
      .default(null)
      .describe('Job Progress Data'),
    created: z.iso.datetime().describe('Job Created Date'),
  }),
  method: 'get',
  path: '/v1/project/url/{id}',
};
