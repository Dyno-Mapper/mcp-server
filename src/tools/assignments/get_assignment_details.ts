import { z } from 'zod';

export const get_assignment_details = {
  name: 'get_assignment_details',
  description: 'Get an assignment by id',
  inputSchema: z.object({
    id: z.number(),
  }),
  outputSchema: z.object({
    id: z.number(),
    projectId: z.number(),
    itemId: z.number().nullable(),
    title: z.string().nullable(),
    note: z.string().nullable(),
    type: z.string().nullable(),
    status: z.enum(['open', 'completed']),
    startDate: z.string(),
    dueDate: z.string(),
    created: z.string(),
    finished: z.string().nullable(),
    metadata: z.record(z.any()),
    users: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        color: z.string(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/assignments/assignment/{id}',
};
