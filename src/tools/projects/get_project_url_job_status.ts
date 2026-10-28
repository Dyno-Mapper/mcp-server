import { z } from 'zod';

export const get_project_url_job_status = {
  name: 'get_project_url_job_status',
  description:
    'Get the status and progress of a project that is being crawled. ' +
    'Poll it immediately with the project id returned by `create_project_from_url` or `create_project_from_sharepoint` — the project exists while the crawl is still queued. ' +
    '`status` goes from `PENDING` (queued) to `RUNNING` (crawling pages, or waiting for a login input) to `PERSIST` (writing the results) to `FINISHED`; `data` is null until the crawler reports progress, then carries `pageCount`, `downloadCount` and `crawlTime` in milliseconds. ' +
    'Answer a paused sign-in with `get_project_login_inputs` and `submit_project_login_input`, and read a `FINISHED` project with `get_project_details`. ' +
    'A project with no crawl job, or a job the crawler has discarded, answers 500 with the reason rather than 404.',
  inputSchema: z.object({
    id: z.coerce
      .number()
      .describe(
        'Id of the project whose crawl to report, as returned by `create_project_from_url` or `create_project_from_sharepoint`.'
      ),
  }),
  outputSchema: z.object({
    id: z.coerce
      .number()
      .describe('Id of the project whose crawl this reports.'),
    status: z
      .enum(['PENDING', 'RUNNING', 'PERSIST', 'FINISHED'])
      .describe(
        'State of the crawl. `PENDING` — queued and not started; `RUNNING` — crawling pages, or paused waiting for a login input; `PERSIST` — writing the crawled pages into the project; `FINISHED` — complete and ready to read. Reported as `PENDING` when the crawler has no state.'
      )
      .default('PENDING'),
    data: z
      .object({
        pageCount: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe(
            'Pages crawled so far. 0 while the crawler has not reported a count yet.'
          ),
        downloadCount: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe(
            'Downloadable files (PDFs and other non-HTML documents) found so far. 0 while the crawler has not reported a count yet.'
          ),
        crawlTime: z
          .number()
          .optional()
          .nullish()
          .default(null)
          .describe(
            'Time spent crawling so far, in milliseconds. 0 while the crawler has not reported a time yet.'
          ),
      })
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Progress figures for the crawl, null until the crawler reports any. When it is present, every member is a number.'
      ),
    created: z.iso
      .datetime()
      .describe(
        'ISO 8601 date and time the project was created, which is when its crawl was submitted.'
      ),
  }),
  method: 'get',
  path: '/v1/project/url/{id}',
};
