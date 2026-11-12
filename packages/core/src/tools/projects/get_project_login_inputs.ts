import { z } from 'zod';

export const get_project_login_inputs = {
  name: 'get_project_login_inputs',
  description:
    'List the login prompts a project’s crawl is waiting on, with the current state of each. ' +
    'A crawl of a site behind a login can stop and ask for a value such as an MFA code, and the work stays `RUNNING` (see `get_project_url_job_status`) while it waits; poll this tool until an item reports `ready: 1`, then send the value with `submit_project_login_input`. ' +
    'The list is empty for a project that does not sign in. ' +
    'A prompt that expired about an hour after the crawl created it reports `completed: 1` rather than disappearing, so it will never become answerable: refresh the project to request a new prompt.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe(
        'ID of the project whose crawl to inspect, as returned by `create_project_from_url` or `create_project_from_sharepoint`.'
      ),
  }),
  outputSchema: z.object({
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Position of the input, 0-based. Submit its value to this id; it never changes for the life of the crawl.'
            ),
          label: z
            .string()
            .describe(
              'Short label of the prompt, for example `Microsoft Authenticator approval`. Defaults to `Input` when the login recipe gives none.'
            ),
          description: z
            .string()
            .optional()
            .describe(
              'What the prompt asks for, in the words of the login recipe. An empty string when it carries no explanation.'
            ),
          ready: z
            .number()
            .describe(
              '1 once the crawl is actually waiting for this value, 0 before it reaches the prompt.'
            ),
          completed: z
            .number()
            .describe(
              '1 once the input has been answered or has expired, 0 while it is still outstanding. An expired input is reported completed rather than removed, so ids never come to mean a different prompt.'
            ),
          value: z
            .string()
            .describe(
              'Value of the input: what the crawl filled in to show the user something (the number to match in an authenticator app, for example), or the value a client submitted. Empty when the crawl is waiting for a value and has none of its own.'
            ),
        })
      )
      .describe(
        'Every login prompt of the project’s current crawl, in the order the crawl will ask for them.'
      ),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/login-inputs',
};
