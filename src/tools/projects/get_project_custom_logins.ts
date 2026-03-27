import { z } from 'zod';

export const get_project_custom_logins = {
  name: 'get_project_custom_logins',
  description: 'Get the list of custom login definitions',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    items: z.array(
      z.object({
        id: z.number().describe('Custom login ID'),
        title: z.string().describe('Login title'),
        url: z.string().nullable().describe('Login URL'),
        inputs: z.array(
          z.object({
            label: z.string().describe('Input label'),
            obscure: z.boolean().describe('Whether to obscure the input'),
          })
        ),
        created: z.string().describe('Creation timestamp'),
        modified: z.string().nullable().describe('Modification timestamp'),
      })
    ),
  }),
  method: 'get',
  path: '/v1/project/custom-login',
};
