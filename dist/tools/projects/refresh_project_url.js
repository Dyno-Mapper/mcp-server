import { z } from 'zod';
export const refresh_project_url = {
    name: 'refresh_project_url',
    description: 'Refresh a crawled project. ' +
        'Re-crawls a project created from a URL and merges the results into it rather than a second project; the project must already be published: a crawl still pending answers 500 “Project does not exist”. ' +
        'Choose what the re-crawl may change with `addNewPages`, `updateTitles`, `overwriteMetadata` and `overwriteContent`; an option left false applies none of its changes. ' +
        'A project that signs in needs `authOptions.inputs` on every refresh — the credentials were never stored — and omitting them answers 400 `login_inputs_required` before anything is written. ' +
        'Answer a prompt in `loginInputs` with `submit_project_login_input`. ' +
        'The re-crawl is queued and returns immediately, and nothing reports its progress: its effect appears as changed content in `get_project_details`. ' +
        'Cancel an outstanding refresh with `cancel_project_url_refresh`.',
    inputSchema: z.object({
        id: z.coerce
            .number()
            .describe('Id of the project to refresh, as returned by `create_project_from_url`.'),
        speed: z
            .enum(['slower', 'slowest'])
            .optional()
            .describe('Pace of the re-crawl. `slower` throttles it, `slowest` throttles it further; omit it to crawl as fast as the crawler allows.'),
        overwriteMetadata: z
            .boolean()
            .optional()
            .describe('Whether to replace the metadata already stored on the project’s items with what the re-crawl finds. Defaults to false, which leaves existing metadata alone.'),
        addNewPages: z
            .boolean()
            .optional()
            .describe('Add pages the re-crawl finds that the project does not have yet. Defaults to false, so an omitted value only re-reads the pages already there.'),
        updateTitles: z
            .boolean()
            .optional()
            .describe('Whether to replace existing item titles with the titles the re-crawl finds. Defaults to false.'),
        overwriteContent: z
            .boolean()
            .optional()
            .describe('Whether to replace existing page content with what the re-crawl downloads. Defaults to false.'),
        authOptions: z
            .object({
            inputs: z
                .array(z.string())
                .optional()
                .describe('Values for the project’s login, in the order its inputs are listed by `get_project_custom_logins` — typically the username and password. Required for a project that signs in: the credentials were never stored, so a refresh must repeat them, and omitting them answers 400 `login_inputs_required`.'),
            basicAuth: z
                .object({
                username: z
                    .string()
                    .optional()
                    .describe('Username for HTTP basic authentication in front of the site.'),
                password: z
                    .string()
                    .optional()
                    .describe('Password for HTTP basic authentication in front of the site.'),
            })
                .optional()
                .describe('HTTP basic authentication credentials, for a site that asks for them before it serves any page. Omit the object when the site does not.'),
        })
            .optional()
            .describe('Credentials for the login the project was created with. Omit it for a project that does not sign in.'),
    }),
    outputSchema: z.object({
        id: z.coerce
            .number()
            .describe('Id of the project being refreshed. Its contents change as the refresh runs; no tool reports the refresh itself.'),
        loginInputs: z
            .array(z.object({
            id: z
                .number()
                .describe('Position of the input in this list. It stays the same for the life of the crawl and is what `submit_project_login_input` later takes.'),
            label: z
                .string()
                .describe('Short label of the prompt, for example the name of the sign-in step.'),
            description: z
                .string()
                .optional()
                .describe('What the prompt asks for, in the words the login recipe uses. An empty string when it carries no explanation.'),
        }))
            .optional()
            .describe('Prompts the re-crawl may stop on while signing in, answered with `submit_project_login_input`. Empty when the project does not sign in.'),
    }),
    method: 'post',
    path: '/v1/project/url/{id}/refresh',
};
