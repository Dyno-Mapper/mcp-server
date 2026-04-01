import { z } from 'zod';

export const test_project_custom_login = {
  name: 'test_project_custom_login',
  description: 'Test custom login',
  inputSchema: z.object({
    id: z.coerce.number().describe('Custom login definition ID'),
    inputs: z.array(z.string()).describe('Array of input values'),
    url: z
      .url()
      .optional()
      .describe('Login page URL if not specified in settings'),
    httpUsername: z.string().optional().describe('HTTP basic auth username'),
    httpPassword: z.string().optional().describe('HTTP basic auth password'),
  }),
  outputSchema: z.object({
    id: z.string().describe('Test id that can be used to retrieve the result'),
  }),
  method: 'post',
  path: '/v1/project/custom-login/test',
};
