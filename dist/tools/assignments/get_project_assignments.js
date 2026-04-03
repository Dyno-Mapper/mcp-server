import { z } from 'zod';
export const get_project_assignments = {
    name: 'get_project_assignments',
    description: 'Get a paginated list of assignments by project',
    inputSchema: z.object({
        projectId: z.coerce.number().describe('The ID of the project'),
        page: z.coerce
            .number()
            .min(1)
            .default(1)
            .optional()
            .describe('The page number'),
        limit: z.coerce
            .number()
            .min(1)
            .max(100)
            .default(20)
            .optional()
            .describe('The maximum number of items per page'),
        search: z.string().optional().describe('Search term to filter assignments'),
        status: z
            .enum(['open', 'completed'])
            .optional()
            .describe('The status of the assignments'),
        category: z.coerce.number().optional().describe('The category ID'),
        workflow: z.string().optional().describe('The workflow name'),
        tags: z
            .string()
            .transform((val) => val
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean))
            .optional()
            .describe('A comma-separated list of tags'),
        createdStart: z.iso
            .date()
            .optional()
            .describe('The start date for the creation date range (YYYY-MM-DD)'),
        createdEnd: z.iso
            .date()
            .optional()
            .describe('The end date for the creation date range (YYYY-MM-DD)'),
        startStart: z.iso
            .date()
            .optional()
            .describe('The start date for the start date range (YYYY-MM-DD)'),
        startEnd: z.iso
            .date()
            .optional()
            .describe('The end date for the start date range (YYYY-MM-DD)'),
        dueStart: z.iso
            .date()
            .optional()
            .describe('The start date for the due date range (YYYY-MM-DD)'),
        dueEnd: z.iso
            .date()
            .optional()
            .describe('The end date for the due date range (YYYY-MM-DD)'),
        orderBy: z
            .enum(['created', 'start', 'due'])
            .optional()
            .default('created')
            .describe('The field to order by'),
        orderDir: z
            .enum(['asc', 'desc'])
            .optional()
            .default('desc')
            .describe('The direction to order by'),
        filterByUserId: z
            .string()
            .transform((val) => val
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => !isNaN(id)))
            .optional()
            .describe('A comma-separated list of user IDs to filter by'),
    }),
    outputSchema: z.object({
        total: z.number().describe('The total number of assignments'),
        limit: z.number().describe('The maximum number of items per page'),
        page: z.number().describe('The current page number'),
        pageSize: z.number().describe('The number of items in the current page'),
        items: z
            .array(z.object({
            id: z.number().describe('The ID of the assignment'),
            projectId: z.number().describe('The ID of the project'),
            itemId: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('The ID of the item'),
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
            itemTitle: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('The title of the item associated with the assignment'),
            url: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('The URL of the item'),
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
        }))
            .describe('An array of assignments'),
    }),
    method: 'get',
    path: '/v1/assignments/{projectId}',
};
