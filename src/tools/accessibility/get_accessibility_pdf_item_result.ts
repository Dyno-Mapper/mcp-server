import { z } from 'zod';

export const get_accessibility_pdf_item_result = {
  name: 'get_accessibility_pdf_item_result',
  description: 'Get PDF accessibility item result',
  inputSchema: z.object({
    projectId: z.number(),
    itemId: z.number(),
  }),
  outputSchema: z.object({
    result: z.array(
      z.object({
        id: z.number(),
        guideline: z.string(),
        criteria: z.string(),
        valid: z.boolean(),
        group: z.enum([
          'known_problems',
          'likely_problems',
          'potential_problems',
          'unknown',
        ]),
        needsManualCheck: z.boolean(),
        message: z.string().nullable(),
        isArchived: z.boolean(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/accessibility/{projectId}/pdf/{itemId}',
};
