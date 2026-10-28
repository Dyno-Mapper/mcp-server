import { z } from 'zod';

export const create_visibility_keyword_group = {
  name: 'create_visibility_keyword_group',
  description:
    'Creates a group for splitting the project’s keywords into topics and returns it with its `id` — the id `update_visibility_keywords_group` takes as `groupId`, `create_visibility_keywords` takes as `group`, and the `group` filter of `get_visibility_project_ranking` accepts. Names are trimmed before they are stored and are unique within a project, and the call is safe to repeat: a name that already exists does not fail and does not add a second group, and a name that belonged to a group deleted earlier revives that group under its old id. Keywords keep their group across a revive, because deleting a group never unassigned them. A group is not a precondition for tracking keywords.',
  inputSchema: z.object({
    projectId: z.number().describe('Numeric project id, from `get_projects`.'),
    name: z
      .string()
      .min(1)
      .max(255)
      .describe(
        'Name of the group, trimmed before it is stored, 1 to 255 characters. Unique within the project: an existing name returns that group instead of creating a duplicate, and a name that belonged to a deleted group brings that group back.'
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'Id of the group, whether it was just created, already existed, or was revived after deletion.'
      ),
    name: z
      .string()
      .describe(
        'Name of the group as it was stored, trimmed of surrounding whitespace.'
      ),
  }),
  method: 'post',
  path: '/v1/visibility/{projectId}/group',
};
