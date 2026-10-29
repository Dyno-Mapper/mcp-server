import { z } from 'zod';

export const get_project_custom_logins = {
  name: 'get_project_custom_logins',
  description:
    'List the multi-step login definitions the account has saved, ordered by title. Each one is a recipe for signing in to a site: an `id` here is what `create_project_from_url` takes as `authOptions.id` when a crawl has to sign in, and the definition’s `inputs` are the values that call takes as `authOptions.inputs`, in the same order. Definitions the application manages itself are left out, because they are not something a user can pick or edit. Try one out with `test_project_custom_login` and read the verdict with `get_project_custom_login_test_result` before using it for a project.',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    items: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Login definition id. Pass it as `authOptions.id` when creating a project with `create_project_from_url`.'
            ),
          title: z.string().describe('Name the account gave the login.'),
          url: z
            .string()
            .optional()
            .nullish()
            .describe(
              'Login page URL recorded in the definition. Null when the definition records none.'
            ),
          inputs: z
            .array(
              z.object({
                label: z
                  .string()
                  .describe(
                    'Label of one value the login asks for, as shown to the person signing in.'
                  ),
                obscure: z
                  .boolean()
                  .describe(
                    'True when the value must be hidden as it is typed, as a password is.'
                  ),
              })
            )
            .describe(
              'Values the login asks for, in the order it asks for them. That order is the order to send in `authOptions.inputs`.'
            ),
          created: z
            .string()
            .describe('ISO 8601 date and time the definition was created.'),
          modified: z
            .string()
            .optional()
            .nullish()
            .describe(
              'ISO 8601 date and time the definition was last changed. Null when it has never been changed.'
            ),
        })
      )
      .describe(
        'The account’s visible multi-step login definitions, ordered by title.'
      ),
  }),
  method: 'get',
  path: '/v1/project/custom-login',
};
