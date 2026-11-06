import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  historyStepSchema,
} from '../schemas/sitemap.js';

export const get_project_sitemap_undo = {
  name: 'get_project_sitemap_undo',
  description:
    'Inspect the next undo. ' +
    'Reports the edit that `undo_project_sitemap_edit` would reverse, without reversing it. ' +
    'The project’s history is shared with the application, so an edit made in the editor appears here too, and an edit made here appears there. ' +
    'When there is nothing left to undo, every field is null rather than an error. ' +
    'The history keeps the 30 most recent edits, so undoing further back is not possible.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
  }),
  outputSchema: historyStepSchema,
  method: 'get',
  path: '/v1/project/{projectId}/item/history/undo',
};
