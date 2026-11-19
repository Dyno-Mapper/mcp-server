import { z } from 'zod';

export const run_accessibility_pdf_upload_test = {
  name: 'run_accessibility_pdf_upload_test',
  description:
    'Start a PDF accessibility check of one file the account has uploaded, and answer the ID of the run it queued. Nothing is returned about the file itself: the check happens in another process and the result arrives as a row in `get_accessibility_pdf_files`. ' +
    'Upload the PDF once with `upload_file` and the `pdf_accessibility` purpose, then send the key it returned here. The key is not consumed, so one upload can back several runs, and each run copies the file for the checker and evaluates it again from scratch. ' +
    'A run costs one PDF check against the plan’s allowance, and a request with none left is refused before anything is copied or queued. Watch it with `get_accessibility_pdf_run`, which reports `queued`, `running` and then `completed`, and read the run’s `error` before trusting a `completed` run. ' +
    'A `400 purpose_mismatch` means the key was uploaded for another purpose, and `413 file_too_large` that the stored file is over the 30 MB the purpose allows. `429 too_many_runs` means the account already has its maximum runs queued or running, and a retry succeeds once one finishes. `502 accessibility_service_unavailable` queued nothing, so the call can be retried as it was.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project the run belongs to.'),
    fileKey: z
      .string()
      .min(1)
      .describe(
        'Key returned by `upload_file` for a file uploaded with the `pdf_accessibility` purpose. It is not a public link, and only the account that uploaded it can use it.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'ID of the run that was queued. It is the `runId` that `get_accessibility_pdf_run` takes, and the run reports what it has done so far.'
      ),
  }),
  method: 'post',
  path: '/v1/accessibility/{projectId}/pdf',
};
