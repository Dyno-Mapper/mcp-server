import { z } from 'zod';
import {
  PROJECT_ID_DESCRIPTION,
  historyActionSchema,
} from '../schemas/sitemap.js';

export const redo_project_sitemap_edit = {
  name: 'redo_project_sitemap_edit',
  description:
    'Redo the last undone sitemap edit. ' +
    'Replays the edit the last undo reversed, restoring the same item at the same position with the same values. ' +
    'Like undo, it operates on the project’s shared history rather than the caller’s own edits. ' +
    'A redo is only available directly after an undo or a run of them; any new edit clears the undone steps. ' +
    'Nothing to redo answers 409 `nothing_to_redo`. ' +
    'The response names the step that was replayed. ' +
    'Inspect the next step with `get_project_sitemap_redo`.',
  inputSchema: z.object({
    projectId: z.number().describe(PROJECT_ID_DESCRIPTION),
  }),
  outputSchema: historyActionSchema,
  method: 'post',
  path: '/v1/project/{projectId}/item/history/redo',
};
