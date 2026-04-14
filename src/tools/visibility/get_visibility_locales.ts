import { z } from 'zod';

export const get_visibility_locales = {
  name: 'get_visibility_locales',
  description: 'Get list of available locales for a keyword',
  inputSchema: z.object({}),
  outputSchema: z.object({
    locales: z
      .array(
        z.object({
          locale: z.string().describe('The locale code (e.g., en-us)'),
          name: z.string().describe('The descriptive name of the locale'),
        })
      )
      .describe('List of locales'),
  }),
  method: 'get',
  path: '/v1/visibility/locales',
};
