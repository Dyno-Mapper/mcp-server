import { z } from 'zod';

export const submit_accessibility_login_input = {
  name: 'submit_accessibility_login_input',
  description:
    'Submit the value of a login prompt an accessibility run is waiting on, which releases the run to carry on checking. ' +
    'Omit `value` — the tool then sends an empty object — when the prompt already carries the value the run needs, such as an authenticator approval where the run reports the number to match; the input is marked complete and the value the run filled in is left as it is. ' +
    'Re-read `get_accessibility_login_inputs` if the prompt has expired, or start a new run with `run_accessibility_checker`; the run is still waiting while `get_accessibility_results` shows it unfinished.',
  inputSchema: z.object({
    projectId: z.number().describe('Id of the project the run belongs to.'),
    reportId: z
      .number()
      .describe(
        'Id of the accessibility run — the `id` from `get_accessibility_results`, or the `id` that `run_accessibility_checker` returned.'
      ),
    inputId: z
      .number()
      .int()
      .min(0)
      .describe(
        '0-based position of the prompt, as returned by `get_accessibility_login_inputs`.'
      ),
    value: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Value to enter, for example the MFA verification code. Omit it to mark the prompt complete without changing the value the run filled in. A value that is sent must not be empty.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'Position of the prompt that was completed, echoed from the path.'
      ),
    completed: z
      .boolean()
      .describe(
        'Always true: the input was released, so the run is no longer waiting on this id.'
      ),
  }),
  method: 'put',
  path: '/v1/accessibility/{projectId}/{reportId}/login-inputs/{inputId}',
};
