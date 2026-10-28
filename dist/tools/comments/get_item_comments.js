import { z } from 'zod';
export const get_item_comments = {
    name: 'get_item_comments',
    description: 'Return every comment on one sitemap item of a project, in a single unpaginated list: there is no `limit` or `page` argument here, so a heavily commented item answers a long array. Start with `get_commented_items` to learn which items have comments worth reading. `itemId` is a sitemap item id reported by `get_project_sitemap_items`. An item with no comments, an id belonging to another project and an id that does not exist all answer an empty `items` array rather than an error, so an empty array does not tell you whether the item exists. Only comments stored in state `1` are returned. Ordering applies only when `orderBy` and `orderDir` are sent together.',
    inputSchema: z.object({
        projectId: z
            .number()
            .describe('The ID of the project, as returned by `get_projects`'),
        itemId: z
            .number()
            .describe('The ID of the sitemap item, as `get_project_sitemap_items` reports it. A non-numeric or zero id answers 500 rather than 400'),
        orderBy: z
            .enum(['date'])
            .optional()
            .describe('Field to sort on. `date`, the time the comment was written, is the only accepted value, and it takes effect only together with `orderDir`'),
        orderDir: z
            .enum(['asc', 'desc'])
            .optional()
            .describe('Direction to sort in: `asc` for oldest first, `desc` for newest first. Ignored unless `orderBy` is also sent'),
    }),
    outputSchema: z.object({
        items: z
            .array(z.object({
            id: z
                .number()
                .describe('Id of the comment itself, not the sitemap item id, which stays in `itemId`'),
            comment: z
                .string()
                .describe('Text of the comment exactly as it was stored, passed through untouched: the value is neither rendered nor altered'),
            name: z
                .string()
                .describe('Name the commenter gave. An empty string when none was stored, never null'),
            email: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Email address the commenter gave. An empty string when none was stored, never null. This is personal data, and it is the value `picture` is computed from'),
            picture: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Avatar URL on gravatar.com, built from the MD5 hash of the lowercased, trimmed email address of the commenter. An empty string when there is no email to hash, never null. The image is served by gravatar.com rather than by DYNO Mapper'),
            created: z.iso
                .datetime()
                .describe('ISO 8601 date and time, in UTC, when the comment was written. What the `date` order sorts on'),
            modified: z.iso
                .datetime()
                .optional()
                .nullish()
                .default(null)
                .describe('ISO 8601 date and time, in UTC, when the comment was last edited, or null when it never was'),
        }))
            .describe('One entry per comment on the item. Every comment is returned; the array is not paged'),
    }),
    method: 'get',
    path: '/v1/comments/{projectId}/{itemId}',
};
