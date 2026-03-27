import { z } from 'zod';
export const get_project_vacq_score = {
    name: 'get_project_vacq_score',
    description: 'Get the VACQ (Accessibility, Content Quality, Visibility) score for a project',
    inputSchema: z.object({
        projectId: z.number().describe('Project ID'),
    }),
    outputSchema: z.object({
        average: z.number().nullable().describe('Average VACQ score'),
        accessibility: z.number().nullable().describe('Accessibility score'),
        contentQuality: z.number().nullable().describe('Content quality score'),
        visibility: z.number().nullable().describe('Visibility score'),
    }),
    method: 'get',
    path: '/v1/project/{projectId}/vacq',
};
