import { z } from 'zod';

export const get_assignment_details = {
  name: 'get_assignment_details',
  description: 'Get an assignment by id',
  inputSchema: z.object({
    id: z.number().describe('The ID of the assignment'),
  }),
  outputSchema: z.object({
    id: z.number().describe('The ID of the assignment'),
    projectId: z.number().describe('The ID of the project'),
    itemId: z
      .number()
      .optional()
      .nullish()
      .default(null)
      .describe('The ID of the item associated with the assignment'),
    title: z
      .string()
      .optional()
      .nullish()
      .default(null)
      .describe('The title of the assignment'),
    note: z
      .string()
      .optional()
      .nullish()
      .default(null)
      .describe('The note for the assignment'),
    type: z
      .string()
      .optional()
      .nullish()
      .default(null)
      .describe('The type of the assignment'),
    status: z
      .enum(['open', 'completed'])
      .describe('The status of the assignment'),
    startDate: z.iso
      .datetime()
      .describe('The date and time the assignment starts'),
    dueDate: z.iso
      .datetime()
      .describe('The date and time the assignment is due'),
    created: z.iso
      .datetime()
      .describe('The date and time the assignment was created'),
    finished: z.iso
      .datetime()
      .optional()
      .nullish()
      .default(null)
      .describe('The date and time the assignment was finished'),
    metadata: z
      .record(z.string(), z.any())
      .describe('Additional metadata for the assignment'),
    users: z
      .array(
        z.object({
          id: z.number().describe('The ID of the user'),
          name: z.string().describe('The name of the user'),
          color: z.string().describe('The color code assigned to the user'),
        })
      )
      .describe('An array of users assigned to the assignment'),
  }),
  method: 'get',
  path: '/v1/assignments/assignment/{id}',
};
