import { z } from 'zod';

export const run_accessibility_pdf_url_test = {
  name: 'run_accessibility_pdf_url_test',
  description:
    'Start a PDF accessibility check of files named by URL, and answer the ID of the run it queued. Each URL becomes one file row in `get_accessibility_pdf_files`, identified by that URL. ' +
    'The checker fetches each URL itself, so only `http` and `https` are accepted, a host on a loopback, private or link-local address is refused with `400 invalid_url`, and so is a value that is not a URL at all. At most 100 URLs go in one call, and a URL repeated in the call is checked once. ' +
    'A run costs one PDF check per URL against the plan’s allowance, so a call that asks for more files than the allowance has left is refused with `403 pdf_testing_limit_reached` rather than queueing a run that would stop halfway. ' +
    'Watch it with `get_accessibility_pdf_run`, whose `items` counts show how many of the URLs have been checked. `429 too_many_runs` means the account already has its maximum runs queued or running, and `502 accessibility_service_unavailable` queued nothing, so the call can be retried as it was.',
  inputSchema: z.object({
    projectId: z
      .number()
      .int()
      .positive()
      .describe('ID of the project the run belongs to.'),
    urls: z
      .array(z.string().min(1))
      .min(1)
      .max(100)
      .describe(
        'URLs of the PDF files to check, at most 100 per call. Each must be `http` or `https`, and each must be reachable from the checker rather than resolving to an internal address.'
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
  path: '/v1/accessibility/{projectId}/pdf/urls',
};
