import { z } from 'zod';
export const test_project_custom_login = {
    name: 'test_project_custom_login',
    description: 'Run a saved login definition against a site with the values you supply, so a login can be checked before it is used for a project. The test is queued and this call returns its id immediately; nothing about the site or the project is changed. Poll the verdict with `get_project_custom_login_test_result` using that id. When the test passes, pass the same definition as `authOptions.id` and the same values as `authOptions.inputs` to `create_project_from_url`, which is what makes the crawl sign in. Only a multi-step login of this account can be tested: a definition that does not exist, one belonging to another account and a legacy single-step one all answer 500 with the reason rather than 404.',
    inputSchema: z.object({
        id: z.coerce
            .number()
            .describe('Id of the login definition to test, from `get_project_custom_logins`.'),
        inputs: z
            .array(z.string())
            .describe('Values for the definition’s inputs, in the same order as its `inputs` in the listing — typically the username and password. All of them are sent to the test as it runs.'),
        url: z
            .url()
            .optional()
            .describe('Login page to test against, for a definition that does not fix a complete URL. Omit it to use the URL stored in the definition.'),
        httpUsername: z
            .string()
            .optional()
            .describe('Username for HTTP basic authentication, when the login page is also behind it. Omit it when it is not.'),
        httpPassword: z
            .string()
            .optional()
            .describe('Password for HTTP basic authentication, when the login page is also behind it. Omit it when it is not.'),
    }),
    outputSchema: z.object({
        id: z
            .string()
            .describe('Id of the running login test. Pass it as `id` to `get_project_custom_login_test_result` to read the result.'),
    }),
    method: 'post',
    path: '/v1/project/custom-login/test',
};
