import { z } from 'zod';

export const submit_project_login_input = {
  name: 'submit_project_login_input',
  description:
    'Submit the value of a project’s login prompt, which releases the crawl to continue signing in. ' +
    'Omit `value` — the tool then sends an empty object — when the prompt already carries the value the crawl needs, such as a Microsoft Authenticator approval where the crawl reports the number to match and only waits to be told to continue; the input is marked complete and the value the crawl filled in is left as it is. ' +
    'Re-read `get_project_login_inputs` if the prompt has expired, or refresh the project to request a new prompt; the crawl is still waiting while `get_project_url_job_status` reports it as `RUNNING`.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe(
        'Id of the project whose crawl is waiting, as returned by `create_project_from_url` or `create_project_from_sharepoint`.'
      ),
    inputId: z
      .number()
      .int()
      .min(0)
      .describe(
        'Position of the input, 0-based, as returned by `get_project_login_inputs`.'
      ),
    value: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Value to enter, for example the MFA verification code. Omit it to mark an input complete without changing the value the crawl filled in. A value that is sent must not be empty.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'Position of the input that was completed, echoed from the path.'
      ),
    completed: z
      .boolean()
      .describe(
        'Always true: the input was released, so the crawl is no longer waiting on this id.'
      ),
  }),
  method: 'put',
  path: '/v1/project/{projectId}/login-inputs/{inputId}',
};
