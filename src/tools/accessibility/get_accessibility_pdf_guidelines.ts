import { z } from 'zod';

export const get_accessibility_pdf_guidelines = {
  name: 'get_accessibility_pdf_guidelines',
  description: 'List PDF accessibility guidelines',
  inputSchema: z.object({}),
  outputSchema: z.object({
    WCAG20: z
      .array(
        z.object({
          criteria: z.string().describe('The guideline criteria (e.g., 1.1.1)'),
          title: z.string().describe('The title of the guideline'),
          description: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('The description of the guideline'),
          url: z
            .string()
            .describe('The URL for more information about the guideline'),
        })
      )
      .describe('An array of WCAG 2.0 PDF accessibility guidelines'),
  }),
  method: 'get',
  path: '/v1/accessibility/pdf-guidelines',
};
