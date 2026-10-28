import { z } from 'zod';
export const delete_accessibility_report = {
    name: 'delete_accessibility_report',
    description: 'Delete one accessibility run of a project: it deletes the run you name, not every result for the project. ' +
        'The run drops out of `get_accessibility_results`, while the project’s other runs stay and keep feeding `get_accessibility_score`. ' +
        'A check that is still running for it is cancelled first, and the run is marked deleted even if that cancellation fails, so the call does not report the failure. ' +
        'Returns the id of the run it deleted. A `reportId` that is not a run of this project, a run that belongs to another account, and a run that is already deleted all answer `500` rather than `404`, so check the id before deleting.',
    inputSchema: z.object({
        projectId: z.number().describe('Id of the project the run belongs to.'),
        reportId: z
            .number()
            .describe('Id of the accessibility run to delete — the `id` from `get_accessibility_results`, or the `id` that `run_accessibility_checker` returned.'),
    }),
    outputSchema: z.object({
        id: z
            .number()
            .describe('Id of the run that was deleted — the `reportId` you sent, which `get_accessibility_results` no longer lists.'),
    }),
    method: 'delete',
    path: '/v1/accessibility/{projectId}/{reportId}',
};
