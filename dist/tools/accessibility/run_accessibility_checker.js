import { z } from 'zod';
export var AccessibilityGuide;
(function (AccessibilityGuide) {
    AccessibilityGuide["BITV1"] = "BITV1";
    AccessibilityGuide["SECTION_508"] = "508";
    AccessibilityGuide["STANCA"] = "STANCA";
    AccessibilityGuide["WCAG1_A"] = "WCAG1-A";
    AccessibilityGuide["WCAG1_AA"] = "WCAG1-AA";
    AccessibilityGuide["WCAG1_AAA"] = "WCAG1-AAA";
    AccessibilityGuide["WCAG2_A"] = "WCAG2-A";
    AccessibilityGuide["WCAG2_AA"] = "WCAG2-AA";
    AccessibilityGuide["WCAG2_AAA"] = "WCAG2-AAA";
    AccessibilityGuide["WCAG21_A"] = "WCAG21-A";
    AccessibilityGuide["WCAG21_AA"] = "WCAG21-AA";
    AccessibilityGuide["WCAG21_AAA"] = "WCAG21-AAA";
    AccessibilityGuide["WCAG22_A"] = "WCAG22-A";
    AccessibilityGuide["WCAG22_AA"] = "WCAG22-AA";
    AccessibilityGuide["WCAG22_AAA"] = "WCAG22-AAA";
})(AccessibilityGuide || (AccessibilityGuide = {}));
export const run_accessibility_checker = {
    name: 'run_accessibility_checker',
    description: 'Start an accessibility check of a project and return the id of the run it queued. ' +
        'The work is asynchronous: the call answers with an id, not results, and the checker starts on its own. ' +
        'Watch the run with `get_accessibility_results`, where the page count, the problem counts and the score appear as it progresses, and per page with `get_accessibility_report_items`; `get_accessibility_score` then reports the finished run’s score. ' +
        'If the project has a stored login recipe the run reuses it and may pause on a sign-in prompt: `loginInputs` lists those prompts, `get_accessibility_login_inputs` reports when one is ready, and `submit_accessibility_login_input` answers it. For any other project `loginInputs` is empty and the run needs no answers.',
    inputSchema: z.object({
        projectId: z.number().describe('Id of the project to check.'),
        guidelines: z
            .array(z.enum(AccessibilityGuide))
            .default([AccessibilityGuide.WCAG22_AAA])
            .describe('Guideline sets to check the pages against, one entry per standard and level. ' +
            '`WCAG2-A`, `WCAG2-AA` and `WCAG2-AAA` are WCAG 2.0 at levels A, AA and AAA; `WCAG21-*` is WCAG 2.1 and `WCAG22-*` is WCAG 2.2 at the same three levels; `WCAG1-*` is WCAG 1.0. ' +
            '`BITV1` is the German BITV 1.0 catalogue, `508` the United States Section 508 catalogue, and `STANCA` the Italian Stanca Act catalogue — a single set each rather than a level. ' +
            'Defaults to `["WCAG22-AAA"]`.'),
        reportSettings: z
            .object({
            likelyProblems: z
                .boolean()
                .optional()
                .describe('Record likely problems: findings the checker believes are violations but cannot confirm without a person inspecting the page. Defaults to `true` when `reportSettings`, or this key, is omitted.'),
            potentialProblems: z
                .boolean()
                .optional()
                .describe('Record potential problems: findings that may be violations depending on runtime or human judgement. Defaults to `true` when omitted.'),
            manualTests: z
                .boolean()
                .optional()
                .describe('Include the manual checks, which the automated run cannot decide and a person has to complete in the application. Only takes effect when `likelyProblems` or `potentialProblems` is also enabled — otherwise it is stored as `false`. Defaults to `false`.'),
        })
            .describe('Which classes of problem the run records. Omit it to record likely and potential problems and no manual checks.')
            .optional(),
        authOptions: z
            .object({
            inputs: z
                .array(z.string())
                .optional()
                .describe('Values for the prompts of the project’s login recipe, in the order the recipe asks for them — usually the username followed by the password. Encrypted per project before storage and never returned by any tool.')
                .meta({
                example: ['username@email.com', 'password321'],
            }),
            basicAuth: z
                .object({
                username: z
                    .string()
                    .optional()
                    .describe('Username for HTTP basic authentication, for a site protected at the server rather than by a sign-in form.'),
                password: z
                    .string()
                    .optional()
                    .describe('Password for HTTP basic authentication, encrypted per project before storage.'),
            })
                .optional()
                .describe('HTTP basic-auth credentials, for a site protected by basic authentication instead of a sign-in form.'),
        })
            .describe('Credentials for a project that signs in, such as a private SharePoint team site or a project created from a URL with authentication. Only used when the project has a stored login recipe; for any other project the run signs in with nothing and this object has no effect. Omit it for a public project.')
            .optional(),
    }),
    outputSchema: z.object({
        id: z
            .number()
            .describe('Id of the run that was queued: the `reportId` every other accessibility tool takes. The run appears in `get_accessibility_results` straight away.'),
        loginInputs: z
            .array(z.object({
            id: z
                .number()
                .describe('0-based position of the prompt in the run’s stored login recipe. It is the `inputId` that `submit_accessibility_login_input` takes, and it stays the same for the whole run.'),
            label: z
                .string()
                .describe('Short prompt to show the person answering, for example `Microsoft Authenticator approval`. `Input` when the recipe gave the prompt no label.'),
            description: z
                .string()
                .optional()
                .describe('Longer explanation of the value expected for this prompt. An empty string when the recipe gave none, never null.'),
        }))
            .describe('Prompts the run may pause on, in the order the checker walks them. Empty when the project does not sign in, or when its login recipe asks for nothing deferred. Read the live state of each with `get_accessibility_login_inputs` and answer one with `submit_accessibility_login_input`.'),
    }),
    method: 'post',
    path: '/v1/accessibility/{projectId}',
};
