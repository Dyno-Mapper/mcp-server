import { z } from 'zod';

export const get_visibility_project_groups = {
  name: 'get_visibility_project_groups',
  description:
    'Returns the keyword groups defined for the project, each with the id that `update_visibility_keywords_group` assigns keywords to and that the `group` filter of `get_visibility_project_ranking` accepts. Groups split a project’s keywords into topics so a report can be read one topic at a time: create one with `create_visibility_keyword_group`, add keywords with `create_visibility_keywords`, then file them with `update_visibility_keywords_group`. A group deleted with `delete_visibility_keyword_group` disappears from this list, but its keywords keep the assignment and still report the old group name in `get_visibility_project_ranking`.',
  inputSchema: z.object({
    projectId: z.number().describe('Numeric project id, from `get_projects`.'),
  }),
  outputSchema: z.object({
    groups: z
      .array(
        z.object({
          id: z
            .number()
            .describe(
              'ID of the group. Send it as `groupId` to `update_visibility_keywords_group`, as `group` when adding keywords, and as the `group` filter of `get_visibility_project_ranking`.'
            ),
          name: z
            .string()
            .describe(
              'Name the group was created with, unique within the project and shown against each of its keywords.'
            ),
        })
      )
      .describe(
        'Groups that are live for this project. Deleted groups are not returned, even while keywords still point at them.'
      ),
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}/group',
};
