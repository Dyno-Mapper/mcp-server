import { z } from 'zod';
export const get_accessibility_pdf_guidelines = {
    name: 'get_accessibility_pdf_guidelines',
    description: 'Return the checklist that PDF results are reported against: the WCAG 2.0 success criteria, each with its number, title, explanation and a link to the published criterion. ' +
        'Join it to a result’s `criteria` to show what a failing check means, and to its `guideline` to find the family. ' +
        'It needs no project and answers the same list for every account whose plan includes PDF Accessibility; the criteria are grouped into one array per family on the way out, and only the `WCAG20` family is published today.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        WCAG20: z
            .array(z.object({
            criteria: z
                .string()
                .describe('Number of the success criterion, for example `1.1.1`. Results refer to it by this value, so it is the key to join on.'),
            title: z
                .string()
                .describe('Title of the criterion, for example `Non-text Content`.'),
            description: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Explanation of what the criterion requires, in the checker’s words. `null` when none is stored for it.'),
            url: z
                .string()
                .describe('Link to the published criterion, for a client that wants to send the reader to the source.'),
        }))
            .describe('The WCAG 2.0 criteria the checker tests PDFs against, ordered by criterion number. Empty when none are configured.'),
    }),
    method: 'get',
    path: '/v1/accessibility/pdf-guidelines',
};
