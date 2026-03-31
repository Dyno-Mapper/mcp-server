import { z } from 'zod';

const scoreSchema = z
  .object({
    visibilityScore: z.number(),
    visibilityScore0: z.number(),
    visibilityScoreInc: z.number(),
    visibilityRawScore: z.number(),
    visibilityRawScore0: z.number(),
    visibilityTotal: z.number(),
    visibilityTotal0: z.number(),
    volumeTotal: z.number(),
    incPosition: z.number(),
    decPosition: z.number(),
    totalPosition: z.number(),
    totalPosition0: z.number(),
    totalPositionCount: z.number(),
    totalPositionCount0: z.number(),
    avgPosition: z.number(),
    avgPosition0: z.number(),
    avgPositionInc: z.number(),
    r1tor3position: z.number(),
    r1tor3position0: z.number(),
    r1tor3positionInc: z.number(),
    r4tor10position: z.number(),
    r4tor10position0: z.number(),
    r4tor10positionInc: z.number(),
    r11tor50position: z.number(),
    r11tor50position0: z.number(),
    r11tor50positionInc: z.number(),
    r51tor100position: z.number(),
    r51tor100position0: z.number(),
    r51tor100positionInc: z.number(),
  })
  .nullable();

export const get_visibility_project_score = {
  name: 'get_visibility_project_score',
  description: 'Get keywords score of a project',
  inputSchema: z.object({
    projectId: z.number(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  outputSchema: z.object({
    google: scoreSchema,
    bing: scoreSchema,
    yahoo: scoreSchema,
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}/score',
};
