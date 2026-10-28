import { z } from 'zod';

export const get_current_user = {
  name: 'get_current_user',
  description:
    'Get the authenticated user’s profile: the user the access token belongs to, and the account that user works in. This is the cheapest way to check that a token works — it reads no project and needs no id, so it is the call to make first when a request fails and you want to know whether the credential or the request is at fault. `accountId` is what the rest of the tools are scoped to, because every project, keyword and report belongs to an account rather than to a user. `thirdPartyProviders` lists the external identities linked for signing in.',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    id: z.number().describe('Id of the authenticated user.'),
    accountId: z
      .number()
      .describe(
        'Id of the account the user works in. Every project and report belongs to an account rather than to a user, so this is the id shared with the account’s other members.'
      ),
    email: z.string().describe('Email address the user signs in with.'),
    name: z
      .string()
      .describe(
        'Display name the user chose in the application. An empty string when the user has not set one, never null.'
      ),
    company: z
      .string()
      .describe(
        'Company recorded on the user’s profile. An empty string when unset, never null.'
      ),
    thirdPartyProviders: z
      .array(
        z.object({
          name: z
            .string()
            .describe(
              'Provider the linked identity belongs to, as the application stores it.'
            ),
          id: z
            .string()
            .describe(
              'The user’s own id at that provider, not a DYNO Mapper id.'
            ),
        })
      )
      .describe(
        'External identities linked to the user for signing in. Empty when the account signs in with an email address and password alone.'
      ),
  }),
  method: 'get',
  path: '/v1/user/me',
};
