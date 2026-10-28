import { z } from 'zod';
export const get_project_groups = {
    name: 'get_project_groups',
    description: 'List project groups. ' +
        'Returns the groups projects can be filed under, in the order the application shows them. ' +
        'An `id` here is what a project reports as `groupId` and what `get_projects` accepts as its `group` filter — pass -1 there to list the projects that are in no group. ' +
        'The listing is scoped to the caller: a user who has neither account-wide sitemap access nor group management rights sees only the groups they created and the groups holding a project they own or have been given access to, so two members of one account can get different lists. ' +
        'Groups that are no longer published are not returned.',
    inputSchema: z.object({}).describe('No input required'),
    outputSchema: z.object({
        groups: z
            .array(z.object({
            id: z
                .number()
                .describe('Project group id. Pass it as the `group` filter of `get_projects` to list the projects in this group.'),
            name: z.string().describe('Name the account gave the group.'),
            color: z
                .string()
                .describe('Colour the application paints the group with.'),
        }))
            .describe('The groups visible to the caller, in the order the application shows them.'),
    }),
    method: 'get',
    path: '/v1/project/group',
};
