import { z } from 'zod';

export const delete_visibility_keyword_group = {
  name: 'delete_visibility_keyword_group',
  description:
    'Takes a group out of service: it stops appearing in `get_visibility_project_groups` and so from any list a client builds from it. The keywords filed under it are not unassigned — they keep their assignment, still report the deleted group’s name in `get_visibility_project_ranking`, and are still returned by that tool’s `group` filter, with no ranking history touched. Move them with `update_visibility_keywords_group`, or send them to `null` for no group at all. Recreating a group with the same name revives this one under the same id, which brings its keywords back into view with it. A group id that does not exist, belongs to another project or was already deleted is answered with 500, not 404.',
  inputSchema: z.object({
    projectId: z.number().describe('Numeric project id, from `get_projects`.'),
    groupId: z
      .number()
      .describe(
        'ID of the keyword group to delete, from `get_visibility_project_groups`. It has to exist and still be live: an id that does not exist, belongs to another project or was already deleted fails with 500 rather than 404.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'ID of the group that was taken out of service, echoed back so the caller can confirm which one it deleted.'
      ),
  }),
  method: 'delete',
  path: '/v1/visibility/{projectId}/group/{groupId}',
};
