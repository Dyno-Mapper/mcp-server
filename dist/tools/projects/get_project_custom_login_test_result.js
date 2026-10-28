import { z } from 'zod';
export const get_project_custom_login_test_result = {
    name: 'get_project_custom_login_test_result',
    description: 'Report the outcome of a test started by `test_project_custom_login`. Poll it with the test id until `success` is true or `reason` explains the failure; a missing verdict reads as `success: false`, so a test that is still running also reads false — read `reason` before treating false as a rejection. The result is held by the crawler rather than looked up here, so an unknown test id cannot be answered with a 404: the crawler’s own answer decides what comes back, and a crawler that refuses the lookup surfaces as 500. The test changes nothing about the site or the project.',
    inputSchema: z.object({
        id: z
            .string()
            .describe('Test id, as returned by `test_project_custom_login`.'),
    }),
    outputSchema: z.object({
        id: z
            .string()
            .describe('Test id this result belongs to, echoed from the request.'),
        success: z
            .boolean()
            .optional()
            .nullish()
            .default(false)
            .describe('Whether the login test succeeded. Defaults to false when the crawler has not reported a verdict, so a test that is still running also reads false.'),
        reason: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('Explanation the crawler gave for the outcome — the step that failed, or the status of a test that has not finished yet. Null when it gave none.'),
    }),
    method: 'get',
    path: '/v1/project/custom-login/test',
};
