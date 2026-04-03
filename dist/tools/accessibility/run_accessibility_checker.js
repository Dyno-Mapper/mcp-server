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
    description: 'Run accessibility checker on a project',
    inputSchema: z.object({
        projectId: z.number().describe('Project ID'),
        guidelines: z
            .array(z.enum(AccessibilityGuide))
            .default([AccessibilityGuide.WCAG22_AAA])
            .describe('Accessibility guidelines to follow'),
        reportSettings: z
            .object({
            likelyProblems: z
                .boolean()
                .optional()
                .describe('Include likely problems'),
            potentialProblems: z
                .boolean()
                .optional()
                .describe('Include potential problems'),
            manualTests: z
                .boolean()
                .optional()
                .describe('Include manual tests. Can only be enabled when likelyProblems or potentialProblems is enabled'),
        })
            .optional(),
        authOptions: z
            .object({
            inputs: z
                .array(z.string())
                .optional()
                .describe('Website authentication inputs')
                .meta({
                example: ['username@email.com', 'password321'],
            }),
            basicAuth: z
                .object({
                username: z
                    .string()
                    .optional()
                    .describe('Website basic auth username'),
                password: z
                    .string()
                    .optional()
                    .describe('Website basic auth password'),
            })
                .optional()
                .describe('Website basic auth'),
        })
            .describe('Website authentication options. Only available for projects created by URL with enabled authentication.')
            .optional(),
    }),
    outputSchema: z.object({
        id: z.number().describe('Accessibility test report ID'),
    }),
    method: 'post',
    path: '/v1/accessibility/{projectId}',
};
