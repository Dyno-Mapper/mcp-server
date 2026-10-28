import { z } from 'zod';
export const update_visibility_keywords_group = {
    name: 'update_visibility_keywords_group',
    description: 'Files each keyword under a group, replacing whichever group it was in — the third step of the usual chain, after `create_visibility_keyword_group` and `create_visibility_keywords`. Ids that do not belong to this project are dropped without an error, so compare the returned `ids` with the ones sent: they list only what was actually reassigned, and an empty array means nothing matched. Passing `null` as `groupId` is how a keyword is returned to no group, the set `get_visibility_project_ranking` lists with `group: -1`. Assignment is the only thing this changes: ranks, history and the keyword’s locale and device are untouched, and for those use `update_visibility_keyword_setting`. A group that does not exist or belongs to another project fails the whole call with 500.',
    inputSchema: z.object({
        projectId: z.number().describe('Numeric project id, from `get_projects`.'),
        ids: z
            .array(z.number())
            .min(1)
            .describe('Ids of the keywords to reassign, at least one, as returned by `create_visibility_keywords` or read from `id` in `get_visibility_project_ranking`. Ids belonging to another project are silently ignored.'),
        groupId: z
            .number()
            .nullable()
            .optional()
            .describe('Id of the group to assign, from `get_visibility_project_groups`, or `null` to take the keywords out of any group. Defaults to `null`; a group that does not exist or belongs to another project fails the whole call with 500.'),
    }),
    outputSchema: z.object({
        ids: z
            .array(z.number())
            .describe('Ids of the keywords that were actually reassigned. Shorter than the ids sent when some belong to another project, and an empty array when none matched.'),
    }),
    method: 'patch',
    path: '/v1/visibility/{projectId}/keyword-group',
};
