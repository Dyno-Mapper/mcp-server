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
    'Everything the twelve kinds of edit can change is restored: an added item is deleted, a deleted subtree is republished, a rename is put back, a move returns to its previous parent and position, and a sort to its previous order. An undo does not undo the undo: it steps back through the history, so a following redo replays what was just reversed. That is also why it is worth calling deliberately, since you may be reversing someone else’s work. ' +
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
