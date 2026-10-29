import { z } from 'zod';

export const get_assignment_details = {
  name: 'get_assignment_details',
  description:
    'Get an assignment: one assignment in full, with the fields the list tools leave out — `users`, the people it is assigned to with their display name and preferred colour, and `metadata`, the free-form object stored with it. Unlike the lists it returns the assignment whatever its state. It fails when no assignment carries that id, and also when the assignment’s project is not one of the account’s published projects holding an open or completed assignment, so a failure does not always mean the assignment belongs to somebody else — one in a still-pending project lands there too. Those failures carry `message` alone and no `error` or `code` key, so read the message. Resolve the project with `get_project_details`.',
  inputSchema: z.object({
    id: z.number().describe('Id of the assignment, from `get_assignments`.'),
  }),
  outputSchema: z.object({
    id: z.number().describe('Id of the assignment.'),
    projectId: z
      .number()
      .describe(
        'Id of the project the assignment belongs to. Read the project with `get_project_details`.'
      ),
    itemId: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Id of the inventory page the assignment is attached to. `null` for an assignment that covers the project as a whole instead of one page: the stored value is `0`, reported here as `null`.'
      ),
    title: z
      .string()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Title of the assignment itself, as whoever created it wrote it — not the page title. `null` when the assignment has no title.'
      ),
    note: z
      .string()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Free-form note stored on the assignment. `null` when it has none. The stored note format is not returned, so treat the text as unformatted.'
      ),
    type: z
      .string()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'Assignment type as stored on the record. Neither the schema nor the handler constrains or enumerates it, so treat it as free-form text. `null` when unset.'
      ),
    status: z
      .enum(['open', 'completed'])
      .describe(
        '`open` while the assignment is still to be done (stored state 1) and `completed` for every other stored state. Unlike the list tools this returns the assignment whatever its state, so a state they never show is reported here as `completed`.'
      ),
    startDate: z.iso
      .datetime()
      .describe(
        'Start of the window the assignment is planned for, as an ISO 8601 date and time in UTC with a trailing `Z`.'
      ),
    dueDate: z.iso
      .datetime()
      .describe(
        'Deadline of the assignment, as an ISO 8601 date and time in UTC with a trailing `Z`. An open assignment whose due date has passed is what the totals tools count as past due.'
      ),
    created: z.iso
      .datetime()
      .describe(
        'When the assignment was created, as an ISO 8601 date and time in UTC with a trailing `Z`.'
      ),
    finished: z.iso
      .datetime()
      .optional()
      .nullish()
      .default(null)
      .describe(
        'When the assignment was completed, as an ISO 8601 date and time in UTC with a trailing `Z`. `null` until it has been completed.'
      ),
    metadata: z
      .record(z.string(), z.any())
      .describe(
        'Free-form object stored with the assignment — an untyped map of string keys to any JSON value. Keys and values are not validated, so read it defensively rather than assuming a shape. `{}` when the assignment carries no metadata.'
      ),
    users: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'Id of the assigned user, the same id other tools accept as `filterByUserId`.'
            ),
          name: z
            .string()
            .describe(
              'Display name of the assigned user, as stored on their user record.'
            ),
          color: z
            .string()
            .describe(
              'Colour recorded in the assigned user’s preferences, as the application stores it. Free-form, so treat it as an opaque value rather than a fixed palette.'
            ),
        })
      )
      .describe(
        'Users the assignment is assigned to. Empty when nobody is assigned; the list tools do not return this array at all.'
      ),
  }),
  method: 'get',
  path: '/v1/assignments/assignment/{id}',
};
