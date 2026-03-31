import { z } from 'zod';

export const get_item_comments = {
  name: 'get_item_comments',
  description: 'Get item comments',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    itemId: z.number().describe('The ID of the item'),
    orderBy: z.enum(['date']).optional().describe('The field to order by'),
    orderDir: z
      .enum(['asc', 'desc'])
      .optional()
      .describe('The direction to order by'),
  }),
  outputSchema: z.object({
    items: z
      .array(
        z.object({
          id: z.number().describe('The ID of the comment'),
          comment: z.string().describe('The comment text'),
          name: z
            .string()
            .describe('The name of the user who made the comment'),
          email: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('The email of the user who made the comment'),
          picture: z
            .string()
            .optional()
            .nullish()
            .default(null)
            .describe('The picture URL of the user who made the comment'),
          created: z.iso
            .datetime()
            .describe('The date and time the comment was created'),
          modified: z.iso
            .datetime()
            .optional()
            .nullish()
            .default(null)
            .describe('The date and time the comment was last modified'),
        })
      )
      .describe('An array of item comments'),
  }),
  method: 'get',
  path: '/v1/comments/{projectId}/{itemId}',
};
