import { z } from 'zod';

/**
 * One allowance counter. The API reports three shapes under one key, told
 * apart by `kind`, so the schema mirrors that: `kind` is always there and the
 * numbers are present only for the shapes that carry them.
 */
const counterSchema = z.object({
  kind: z
    .enum(['capped', 'unlimited', 'unavailable'])
    .describe(
      'Which shape this counter takes. `capped` sets a ceiling the plan describes with `used`, `limit` and `remaining`. `unlimited` reports `used` with no ceiling, so nothing stops it growing. `unavailable` means the plan does not include the allowance, and it carries no numbers at all.'
    ),
  used: z
    .number()
    .optional()
    .describe(
      'How much of the allowance is in use, on a `capped` or `unlimited` counter. Projects are counted as projects, keywords as keywords, seats as seats, and `content` as bytes. Absent on an `unavailable` counter.'
    ),
  limit: z
    .number()
    .optional()
    .describe(
      'The ceiling the plan sets, on a `capped` counter only. An `unlimited` counter reports no limit rather than this field.'
    ),
  remaining: z
    .number()
    .optional()
    .describe(
      'How much of the allowance is left on a `capped` counter: the limit minus usage, and never negative. `0` when the account has used the allowance up and also when a downgrade left it over the limit, so read `0` as "nothing more" rather than as an exact figure.'
    ),
});

export const get_account_usage = {
  name: 'get_account_usage',
  description:
    'Report the plan’s allowances for the authenticated account and how much of each is already in use, so a caller can tell whether there is room for the work before it starts writing. ' +
    'Four counters come back. `projects` counts projects that are pending or published; `keywords` counts tracked keywords that are active; `content` is the page-content storage the account occupies; `users` counts the owner and the invites that hold a seat. ' +
    'Only `content` is measured in bytes, and it uses decimal units, so a 10 GB allowance reads `10000000000`. ' +
    'Each counter is one of three shapes, told apart by `kind`. A `capped` counter gives `used`, `limit` and `remaining`, where `remaining` is the limit minus usage and never negative: an account that was downgraded can sit over its limit, so `remaining: 0` means nothing more is available rather than an exact figure. An `unlimited` counter gives `used` and no ceiling. An `unavailable` counter carries no numbers, because the plan does not include the allowance. ' +
    '`plan` is null when the account has no subscription, and every counter then reports `unavailable`: the call still answers rather than failing, because a missing subscription is a fact about the account and not a failure to read it. ' +
    'Read this before creating a project, adding keywords or storing a page image, and again before retrying a call that was refused for want of room.',
  inputSchema: z.object({}).describe('No input required'),
  outputSchema: z.object({
    accountId: z
      .number()
      .describe('ID of the account the allowances belong to.'),
    plan: z
      .object({
        name: z
          .string()
          .nullable()
          .describe(
            'Name the plan is sold under, for example `Starter`. Null when the plan row carries no name.'
          ),
        term: z
          .string()
          .nullable()
          .describe(
            'Billing term the account signed up for: `monthly` or `annually`. Null when the plan is not sold by term, as a free plan is not.'
          ),
      })
      .nullable()
      .describe(
        'The plan the account is on, or null when the account has no subscription. A null here means every counter reports `unavailable`, not that the account is unlimited.'
      ),
    projects: counterSchema.describe(
      'Projects the account owns that are pending or published, against the plan’s project allowance. An archived project holds no place.'
    ),
    keywords: counterSchema.describe(
      'Tracked keywords that are active, against the plan’s keyword allowance. `unavailable` when the plan does not include keyword tracking: a keyword added without the feature is parked as pending rather than refused, so its count would otherwise suggest room that does not exist.'
    ),
    content: counterSchema.describe(
      'Page-content storage in bytes, the images and files stored across every project, against the plan’s storage allowance. Both `used` and `limit` are decimal bytes, so a 10 GB plan reports `10000000000`.'
    ),
    users: counterSchema.describe(
      'Seats in use, the account owner plus every invite that holds a seat whether the invitee has joined or not, against the plan’s seat allowance.'
    ),
  }),
  method: 'get',
  path: '/v1/account/usage',
};
