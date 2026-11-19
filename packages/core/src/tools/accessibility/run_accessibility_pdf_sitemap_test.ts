import { z } from 'zod';

export const run_accessibility_pdf_sitemap_test = {
  name: 'run_accessibility_pdf_sitemap_test',
  description:
    'Start a PDF accessibility check of the PDF files already found on a project, and answer the ID of the run it queued. For a project created by crawling, the files come from the crawl; for one created from a sitemap, each sitemap item is fetched to see whether it serves a PDF. Each file the run finds becomes a row in `get_accessibility_pdf_files`. ' +
    'The run checks no more files than the plan’s allowance has left, so it costs at most that many checks, and a request with none left is refused with `403 pdf_testing_limit_reached`. ' +
    'A project with no crawled pages, and one with no PDF files, still starts a run: it finishes as `completed` with the reason in `errorReason` and `urls` of `0`, which is why `completed` alone is not success. ' +
    'Watch it with `get_accessibility_pdf_run`, whose `items` counts show how many found files have been checked. `429 too_many_runs` means the account already has its maximum runs queued or running, and `502 accessibility_service_unavailable` queued nothing, so the call can be retried as it was.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project the run belongs to.'),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'ID of the run that was queued. It is the `runId` that `get_accessibility_pdf_run` takes, and the run reports what it has done so far.'
      ),
  }),
  method: 'post',
  path: '/v1/accessibility/{projectId}/pdf/sitemap',
};
