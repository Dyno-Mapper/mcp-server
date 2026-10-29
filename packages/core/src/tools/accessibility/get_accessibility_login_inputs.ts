import { z } from 'zod';

export const get_accessibility_login_inputs = {
  name: 'get_accessibility_login_inputs',
  description:
    'List the login prompts an accessibility run may be waiting on, with the current state of each. ' +
    'Authenticated projects reuse the crawl’s login recipe, so a run can pause for a deferred value such as an MFA code; poll this tool until an item reports `ready: 1`, then send it with `submit_accessibility_login_input`. ' +
    'Only the user who started the run sees its prompts: a colleague with access to the same project can read the report but gets an empty list here. The list is also empty for a project that does not sign in. ' +
    'A prompt that expired about an hour after the run created it reports `completed: 1` and can never be answered: start a new run with `run_accessibility_checker` to get fresh prompts.',
  inputSchema: z.object({
    projectId: z.number().describe('Id of the project the run belongs to.'),
    reportId: z
      .number()
      .describe(
        'Id of the accessibility run — the `id` from `get_accessibility_results`, or the `id` that `run_accessibility_checker` returned.'
      ),
  }),
  outputSchema: z.object({
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              '0-based position of the prompt in the run’s stored login recipe. It is the `inputId` the submit tool takes, and it stays the same for the whole run.'
            ),
          label: z
            .string()
            .describe(
              'Short prompt to show the person answering, for example `Microsoft Authenticator approval`. `Input` when the recipe gave the prompt no label.'
            ),
          description: z
            .string()
            .optional()
            .describe(
              'Longer explanation of the value expected for this prompt. An empty string when the recipe gave none, never null.'
            ),
          ready: z
            .number()
            .describe(
              '1 once the checker has reached this prompt and is waiting for an answer, 0 while it has not got there yet. Only an input at 1 can usefully be answered.'
            ),
          completed: z
            .number()
            .describe(
              '1 once the value has been submitted, or once the slot has expired and can no longer be answered, 0 while it is still waiting. A slot that has expired reports 1 here so a client never polls it forever.'
            ),
          value: z
            .string()
            .describe(
              'Value currently held for this prompt: what a previous submit stored, or the text the run itself filled in (the authenticator prompt puts the number to match here). An empty string when nothing has been written, never null.'
            ),
        })
      )
      .describe(
        'Every prompt of this run, in the order the checker walks them and including ones that are already answered or expired, so the positions are stable across polls. Empty when the run has no prompts or was started by another user.'
      ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/{reportId}/login-inputs',
};
