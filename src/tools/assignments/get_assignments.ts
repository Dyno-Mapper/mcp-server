import { z } from 'zod';

export const get_assignments = {
  name: 'get_assignments',
  description: 'Get a paginated list of assignments',
  inputSchema: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    status: z.enum(['open', 'completed']).optional(),
    category: z.number().optional(),
    workflow: z.string().optional(),
    tags: z.string().optional(),
    createdStart: z.string().optional(),
    createdEnd: z.string().optional(),
    startStart: z.string().optional(),
    startEnd: z.string().optional(),
    dueStart: z.string().optional(),
    dueEnd: z.string().optional(),
    orderBy: z.enum(['created', 'start', 'due']).optional(),
    orderDir: z.enum(['asc', 'desc']).optional(),
    filterByUserId: z.string().optional(),
  }),
  outputSchema: z.object({
    total: z.number(),
    limit: z.number(),
    page: z.number(),
    pageSize: z.number(),
    items: z.array(
      z.object({
        id: z.number(),
        projectId: z.number(),
        itemId: z.number().nullable(),
        title: z.string().nullable(),
        note: z.string().nullable(),
        type: z.string().nullable(),
        status: z.enum(['open', 'completed']),
        itemTitle: z.string().nullable(),
        url: z.string().nullable(),
        startDate: z.string(),
        dueDate: z.string(),
        created: z.string(),
        finished: z.string().nullable(),
      })
    ),
  }),
  method: 'get',
  path: '/v1/assignments',
};
