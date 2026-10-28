import { z } from 'zod';
export const create_project_from_sharepoint = {
    name: 'create_project_from_sharepoint',
    description: 'Create a project from a private SharePoint team site. ' +
        'The crawl runs with a fixed scope: platform plumbing and first-party Microsoft domains are excluded, and the sign-in goes through the Microsoft login form with the supplied credentials, so unlike `create_project_from_url` nothing else is configurable. ' +
        'Track the crawl with `get_project_url_job_status`. When the account is protected by MFA the crawl pauses: poll `get_project_login_inputs` for the prompt and send the code with `submit_project_login_input` — the prompts it may use are already listed in this response, so their ids are known before the pause happens. ' +
        'The project is stored private and flagged as a SharePoint project, which is what makes it eligible for `get_project_dacq_score` rather than `get_project_vacq_score`. ' +
        'The credentials are forwarded to the crawler and never stored, but they are tool arguments: they will appear in this conversation and in any client-side transcript or log.',
    inputSchema: z.object({
        subdomain: z
            .string()
            .min(1)
            .describe('SharePoint team site subdomain')
            .meta({ example: 'mycompany' }),
        username: z
            .string()
            .min(1)
            .describe('Microsoft account that can sign in to the site. It is sent to the crawler and never stored.')
            .meta({ example: 'user@mycompany.com' }),
        password: z
            .string()
            .min(1)
            .describe('Password of that account. It is sent to the crawler and never stored. If the account requires MFA, the project reports login inputs to answer during the crawl.'),
    }),
    outputSchema: z.object({
        id: z
            .number()
            .describe('Id of the project that was created. Poll `get_project_url_job_status` for the crawl it started.'),
        loginInputs: z
            .array(z.object({
            id: z
                .number()
                .describe('Position of the input in this list, used as `inputId` when submitting its value.'),
            label: z
                .string()
                .describe('Short label of the prompt, for example the sign-in step.'),
            description: z
                .string()
                .optional()
                .describe('What the prompt asks for, in the words of the login recipe. An empty string when it carries no explanation.'),
        }))
            .describe('Prompts the crawl may stop on while signing in, in the order it may ask them. Each `id` is what `submit_project_login_input` takes.'),
    }),
    method: 'post',
    path: '/v1/project/sharepoint',
};
