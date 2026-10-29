import { z } from 'zod';

export const get_project_vacq_score = {
  name: 'get_project_vacq_score',
  description:
    'Get the VACQ score of a project. ' +
    'Returns the VACQ score of a project that is publicly reachable: content quality, accessibility and search visibility, plus their average. ' +
    'A private SharePoint project has no search visibility to measure and is scored with DACQ instead — read `get_project_dacq_score` for those. ' +
    'The pillars are measured by other tools, so each can be missing on its own: accessibility needs a completed run of `run_accessibility_checker`, and visibility needs keywords tracked for the domain of the project, added with `create_visibility_keywords`. ' +
    'A pillar that has not been measured is null, and `average` stays null until all three are available, so a project that has only been crawled answers nulls rather than zeros.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('Id of the project, as returned by `get_projects`.'),
  }),
  outputSchema: z.object({
    average: z
      .number()
      .nullable()
      .describe(
        'VACQ total: the mean of the three pillars, rounded to two decimals. Null unless content quality, accessibility and visibility are all measured, the accessibility score is above zero, and the account tracks at least one active keyword for the domain of the project.'
      ),
    accessibility: z
      .number()
      .nullable()
      .describe(
        'Accessibility pillar: the percentage score of the most recent accessibility run of the project, started with `run_accessibility_checker`. Null when no run has produced a score.'
      ),
    contentQuality: z
      .number()
      .nullable()
      .describe(
        'Content quality pillar: a percentage computed from the total and unique link counts of the crawl as `(total − unique) / total × 100`, with the orphaned-page share contributing up to nine percent. Null when the project has no crawl statistics. `get_project_dacq_score` reports the same base figure without the orphan adjustment.'
      ),
    visibility: z
      .number()
      .nullable()
      .describe(
        'Visibility pillar: the Google visibility score of the domain of the project over the last 30 days, from the ranking data the account tracks for its keywords. Null when the account tracks no keyword for this domain.'
      ),
  }),
  method: 'get',
  path: '/v1/project/{projectId}/vacq',
};
