import { z } from 'zod';

export const create_visibility_keywords = {
  name: 'create_visibility_keywords',
  description: 'Add keywords to a project',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    keywords: z
      .array(z.string().min(1).max(255))
      .min(1)
      .max(100)
      .describe('List of keywords to add. Maximum 100 keywords.'),
    locale: z
      .string()
      .default('en-us')
      .describe('The locale of the keywords (e.g., en-us)'),
    device: z
      .enum(['desktop', 'tablet', 'mobile'])
      .default('desktop')
      .describe('The device used for tracking'),
    group: z.number().optional().describe('The ID of the keyword group'),
  }),
  outputSchema: z.object({
    ids: z.array(z.number()).describe('The IDs of the created keywords'),
  }),
  method: 'post',
  path: '/v1/visibility/{projectId}/keyword',
};
