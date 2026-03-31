import { z } from 'zod';

const scoreSchema = z
  .object({
    visibilityScore: z.number().describe('The visibility score'),
    visibilityScore0: z
      .number()
      .describe('The visibility score at the start date'),
    visibilityScoreInc: z.number().describe('The increase in visibility score'),
    visibilityRawScore: z.number().describe('The raw visibility score'),
    visibilityRawScore0: z
      .number()
      .describe('The raw visibility score at the start date'),
    visibilityTotal: z.number().describe('Total visibility'),
    visibilityTotal0: z.number().describe('Total visibility at the start date'),
    volumeTotal: z.number().describe('Total volume'),
    incPosition: z.number().describe('Number of increased positions'),
    decPosition: z.number().describe('Number of decreased positions'),
    totalPosition: z.number().describe('Total position'),
    totalPosition0: z.number().describe('Total position at the start date'),
    totalPositionCount: z.number().describe('Total number of position counts'),
    totalPositionCount0: z
      .number()
      .describe('Total number of position counts at the start date'),
    avgPosition: z.number().describe('Average position'),
    avgPosition0: z.number().describe('Average position at the start date'),
    avgPositionInc: z.number().describe('The increase in average position'),
    r1tor3position: z.number().describe('Positions in rank 1 to 3'),
    r1tor3position0: z
      .number()
      .describe('Positions in rank 1 to 3 at the start date'),
    r1tor3positionInc: z
      .number()
      .describe('Increase in positions in rank 1 to 3'),
    r4tor10position: z.number().describe('Positions in rank 4 to 10'),
    r4tor10position0: z
      .number()
      .describe('Positions in rank 4 to 10 at the start date'),
    r4tor10positionInc: z
      .number()
      .describe('Increase in positions in rank 4 to 10'),
    r11tor50position: z.number().describe('Positions in rank 11 to 50'),
    r11tor50position0: z
      .number()
      .describe('Positions in rank 11 to 50 at the start date'),
    r11tor50positionInc: z
      .number()
      .describe('Increase in positions in rank 11 to 50'),
    r51tor100position: z.number().describe('Positions in rank 51 to 100'),
    r51tor100position0: z
      .number()
      .describe('Positions in rank 51 to 100 at the start date'),
    r51tor100positionInc: z
      .number()
      .describe('Increase in positions in rank 51 to 100'),
  })
  .optional()
  .nullish();

export const get_visibility_project_score = {
  name: 'get_visibility_project_score',
  description: 'Get keywords score of a project',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project'),
    startDate: z.iso.date().describe('The start date (YYYY-MM-DD)'),
    endDate: z.iso.date().describe('The end date (YYYY-MM-DD)'),
  }),
  outputSchema: z.object({
    google: scoreSchema.describe('Visibility score for Google'),
    bing: scoreSchema.describe('Visibility score for Bing'),
    yahoo: scoreSchema.describe('Visibility score for Yahoo'),
  }),
  method: 'get',
  path: '/v1/visibility/{projectId}/score',
};
