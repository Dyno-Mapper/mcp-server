import { z } from 'zod';

export const get_current_user = {
  name: 'get_current_user',
  description: 'Get current user information and account details',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    id: z.number().describe('User ID'),
    accountId: z.number().describe('Account ID'),
    email: z.string().describe('User email'),
    name: z.string().describe('User full name'),
    company: z.string().describe('User company'),
    thirdPartyProviders: z
      .array(
        z.object({
          name: z
            .string()
            .describe('Third party provider name. ex: Google or Facebook'),
          id: z.string().describe('Third party provider ID'),
        })
      )
      .describe('List of third-party providers linked to the user'),
  }),
  method: 'get',
  path: '/v1/user/me',
};
