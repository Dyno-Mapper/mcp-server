import { z } from 'zod';

export const get_project_file_job_status = {
  name: 'get_project_file_job_status',
  description:
    "Report the import started by `create_project_from_file` with `type: 'text'` or `type: 'xml'`: whether it has finished, when it started and finished, how many of the listed URLs have been read, and the last URL it processed. Poll it after the create call until `finished` is true; the project is readable meanwhile with `get_project_details`. A refresh started by `refresh_project_file` reports here too, because the project’s import record is pointed at the new task. An id that is not an import project of that `type`, a deleted one, or one belonging to another account answers 500 with the reason rather than 404. Cancel the import with `cancel_project_file_job`, or only its outstanding refresh with `cancel_project_file_refresh`.",
  inputSchema: z.object({
    type: z
      .enum(['text', 'xml'])
      .describe(
        'Which import to report: `text` for a plain-text list of URLs, `xml` for an XML sitemap. It must match the import the project was created by, or the call answers 500.'
      ),
    id: z.coerce
      .number()
      .describe('Id of the project whose import this reports.'),
  }),
  outputSchema: z.object({
    id: z.number().describe('Id of the project whose import this reports.'),
    startDateTime: z.iso
      .datetime()
      .optional()
      .nullish()
      .describe(
        'ISO 8601 date and time the import started. Null until it starts.'
      ),
    finishDateTime: z.iso
      .datetime()
      .optional()
      .nullish()
      .describe(
        'ISO 8601 date and time the import finished. Null until it finishes.'
      ),
    finished: z
      .boolean()
      .describe(
        'True once the import service reports the import is done; false while it runs.'
      ),
    lastUrl: z
      .string()
      .optional()
      .nullish()
      .describe(
        'URL of the last entry the import processed. Null before it processes one.'
      ),
    totalUrls: z
      .number()
      .describe('Number of URLs the import has to process, as it counts them.'),
    finishedUrls: z
      .number()
      .describe('Number of URLs the import service reports as finished.'),
    failedUrls: z
      .number()
      .describe(
        'Number of URLs the import service reports as errors — the ones it could not import.'
      ),
    processedUrls: z
      .number()
      .describe(
        'Number of URLs processed so far, as the import service counts them.'
      ),
    message: z
      .string()
      .optional()
      .nullish()
      .describe(
        'Message from the import service about the run, for example why it failed. Null when it has nothing to report.'
      ),
  }),
  method: 'get',
  path: '/v1/project/{type}/{id}',
};
