import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  historyStepSchema,
} from '../schemas/sitemap.js';

export const get_project_sitemap_redo = {
  name: 'get_project_sitemap_redo',
  description:
    'Inspect the next redo. ' +
    'Reports the edit that `redo_project_sitemap_edit` would replay, without replaying it. ' +
    'A redo is only available after an undo: any new edit clears the undone steps, so every field is null in the ordinary case where the history sits at its newest edit. ' +
    'When the cursor is at the newest edit, the step is the same one the next undo would reverse; otherwise it is the one most recently undone.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
  }),
  outputSchema: historyStepSchema,
  method: 'get',
  path: '/v1/project/{projectId}/item/history/redo',
};
