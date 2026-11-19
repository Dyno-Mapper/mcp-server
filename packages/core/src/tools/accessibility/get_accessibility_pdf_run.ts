import { z } from 'zod';

export const get_accessibility_pdf_run = {
  name: 'get_accessibility_pdf_run',
  description:
    'Return the state of one PDF accessibility run and what it has found so far, for a caller that queued one and wants to know when the results are in the file list. The run is scoped to the project and the account that started it. ' +
    'Checking is asynchronous, so the run moves from `queued` to `running` and then to `completed`, and `urls` fills in once the checker has resolved its work. `completed` is not a verdict: a run that found nothing to check, or could not reach a URL, also ends there and says why in `error` and `errorReason`. ' +
    'The per-file results are in `get_accessibility_pdf_files`, and the criteria they were judged against in `get_accessibility_pdf_guidelines`. ' +
    '`items` is present for a run over URLs or a sitemap, which produce several files at once, and omitted for a run over one uploaded file, whose single row is the file list. ' +
    'A run of another project or account answers `404 pdf_run_not_found`, and so does a `runId` that is not a number.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project the run belongs to.'),
    runId: z
      .number()
      .int()
      .describe(
        'ID of the run, as the call that started it returned it: `run_accessibility_pdf_upload_test`, `run_accessibility_pdf_url_test` or `run_accessibility_pdf_sitemap_test`.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe('ID of the run — the `id` the call that started it returned.'),
    method: z
      .enum(['upload', 'url', 'sitemap', 'unknown'])
      .describe(
        'What the run was pointed at: `upload` for one uploaded file, `url` for a list of URLs, and `sitemap` for the PDF files found on the project. `unknown` for a stored value this API does not recognize.'
      ),
    state: z
      .enum(['queued', 'running', 'completed', 'deleted', 'unknown'])
      .describe(
        'Lifecycle of the run: `queued` until the checker starts it, `running` while it checks files, `completed` when it has finished, and `deleted` for a run that was removed. `completed` covers a run that failed, so read `error` before treating it as a success.'
      ),
    urls: z
      .number()
      .describe(
        'Number of files the run will check. `0` until the checker has resolved its work — for an uploaded run that is the single file, and for a project run the PDF files it found.'
      ),
    knownProblems: z
      .number()
      .describe(
        'Known problems found in the run’s files, summed. `0` while the run has not finished.'
      ),
    likelyProblems: z
      .number()
      .describe(
        'Likely problems found in the run’s files, summed. `0` while the run has not finished.'
      ),
    potentialProblems: z
      .number()
      .describe(
        'Potential problems found in the run’s files, summed. `0` while the run has not finished.'
      ),
    error: z
      .string()
      .nullable()
      .describe(
        'Short reason the run failed, as the checker recorded it — `process` for a check that ended badly. Null when the run has not failed, including while it is still queued or running.'
      ),
    errorReason: z
      .string()
      .nullable()
      .describe(
        'Detail behind `error`, in the checker’s words. A run that found nothing to check, or was pointed at a project the crawler has no pages for, reports that here. Null when it recorded none.'
      ),
    items: z
      .object({
        finished: z.number().describe('Files the checker has finished.'),
        pending: z.number().describe('Files it has not started.'),
        deleted: z.number().describe('Files dropped without being checked.'),
      })
      .optional()
      .describe(
        'Progress across the run’s files. Present for `url` and `sitemap` runs, which produce several files at once, and omitted for `upload` runs, whose single file is reported by `get_accessibility_pdf_files`.'
      ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/pdf/runs/{runId}',
};
