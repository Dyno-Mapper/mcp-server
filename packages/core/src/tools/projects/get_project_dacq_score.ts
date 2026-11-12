import { z } from 'zod';

export const get_project_dacq_score = {
  name: 'get_project_dacq_score',
  description:
    'Get the DACQ (Discoverability, Accessibility, Content Quality) score of a private SharePoint project. ' +
    'DACQ replaces VACQ for projects that are not publicly reachable: with no search visibility to measure, the total is built from Discoverability, Accessibility and Content Quality instead. ' +
    'The average is null until all three pillars are measured; Discoverability comes from the crawl, and Accessibility needs a completed accessibility run, started with `run_accessibility_checker`. ' +
    'A project that is not a private SharePoint project, and a project that has not been crawled yet, answers every field as null rather than failing.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe(
        'ID of the project, as returned by `create_project_from_url` or `create_project_from_sharepoint`.'
      ),
  }),
  outputSchema: z.object({
    average: z
      .number()
      .nullable()
      .describe(
        'DACQ total: the mean of the three pillars. Null unless all three are available.'
      ),
    discoverability: z
      .number()
      .nullable()
      .describe('Discoverability pillar: 60% reach plus 40% signal'),
    reach: z
      .number()
      .nullable()
      .describe(
        'Reach: how well internal pages are linked, and how deep they sit'
      ),
    signal: z
      .number()
      .nullable()
      .describe('Signal: share of pages with a title and a meta description'),
    avgDepth: z
      .number()
      .nullable()
      .describe('Average click depth from the start URL'),
    accessibility: z
      .number()
      .nullable()
      .describe('Accessibility pillar, as a percentage'),
    contentQuality: z
      .number()
      .nullable()
      .describe(
        'Content quality pillar: a percentage computed from the crawl’s total and unique link counts as `(total − unique) / total × 100`. Deliberately different from the orphan-weighted figure `get_project_vacq_score` reports.'
      ),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/dacq',
};
