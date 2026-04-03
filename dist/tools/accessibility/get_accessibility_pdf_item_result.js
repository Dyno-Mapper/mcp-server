import { z } from 'zod';
export const get_accessibility_pdf_item_result = {
    name: 'get_accessibility_pdf_item_result',
    description: 'Get PDF accessibility item result',
    inputSchema: z.object({
        projectId: z.number().describe('The ID of the project'),
        itemId: z.number().describe('The ID of the PDF file'),
    }),
    outputSchema: z.object({
        result: z
            .array(z.object({
            id: z.number().describe('The ID of the result item'),
            guideline: z.string().describe('The guideline name'),
            criteria: z.string().describe('The guideline criteria (e.g., 1.1.1)'),
            valid: z.boolean().describe('Whether the criteria is valid'),
            group: z
                .enum([
                'known_problems',
                'likely_problems',
                'potential_problems',
                'unknown',
            ])
                .describe('The problem group'),
            needsManualCheck: z
                .boolean()
                .describe('Whether the criteria needs manual check'),
            message: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('The message of the result'),
            isArchived: z.boolean().describe('Whether the result is archived'),
        }))
            .describe('An array of PDF accessibility item results'),
    }),
    method: 'get',
    path: '/v1/accessibility/{projectId}/pdf/{itemId}',
};
