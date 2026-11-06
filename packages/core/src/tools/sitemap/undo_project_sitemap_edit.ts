import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  historyActionSchema,
} from '../schemas/sitemap.js';

export const undo_project_sitemap_edit = {
  name: 'undo_project_sitemap_edit',
  description:
    'Undo the last sitemap edit. ' +
    'Reverses the newest edit in the project’s history, whoever made it: the stack is shared with the application, so an edit made in the editor can be undone here and the other way round. ' +
    'Everything the recorded edits can change is restored, and an undo moves the history cursor back rather than undoing itself. ' +
    'Nothing to undo answers 409 `nothing_to_undo`. ' +
    'The response names the step that was reversed. ' +
    'Inspect the next step with `get_project_sitemap_undo`.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
  }),
  outputSchema: historyActionSchema,
  method: 'post',
  path: '/v1/project/{projectId}/item/history/undo',
};
