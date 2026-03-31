import { z } from 'zod';

export const get_accessibility_pdf_guidelines = {
  name: 'get_accessibility_pdf_guidelines',
  description: 'List PDF accessibility guidelines',
  inputSchema: z.object({}),
  outputSchema: z.object({
    WCAG20: z.array(
      z.object({
        criteria: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        url: z.string(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/pdf-guidelines',
};
