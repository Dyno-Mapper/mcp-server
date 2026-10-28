import { z } from 'zod';
export const refresh_project_file = {
    name: 'refresh_project_file',
    description: "Re-import a project created by `create_project_from_file` with `type: 'text'` or `type: 'xml'`, instead of creating a second project. Only applies to projects created from a `url`: one created from an uploaded `file` or a `fileKey` keeps no source URL and answers 500, and `get_project_details` reports the same fact as `allowTextRefresh` or `allowXmlRefresh` for the matching `type`. The project must be published, and only one refresh may run at a time — a second answers 500 asking you to wait, so cancel the outstanding one with `cancel_project_file_refresh` first if you need different options. The re-import is queued and progress is reported by `get_project_file_job_status` with the same `type`.",
    inputSchema: z.object({
        type: z
            .enum(['text', 'xml'])
            .describe('Which import to refresh: `text` or `xml`. It must match the project’s import type, or the call answers 500.'),
        id: z.coerce.number().describe('Id of the project to re-import.'),
        speed: z
            .enum(['slower', 'slowest'])
            .optional()
            .describe('Pace of the re-import. `slower` throttles it, `slowest` throttles it further; omit it to run as fast as the import service allows.'),
        addNewPages: z
            .boolean()
            .optional()
            .describe('Add URLs the re-import finds that the project does not have yet. Defaults to false, so omitting it only re-reads the pages already there.'),
        updateTitles: z
            .boolean()
            .optional()
            .describe('Replace existing item titles with the titles the re-import finds. Defaults to false.'),
    }),
    outputSchema: z.object({
        id: z
            .number()
            .describe('Id of the project the import is creating. Poll `get_project_file_job_status` with the same `type` for its progress.'),
    }),
    method: 'post',
    path: '/v1/project/{type}/{id}/refresh',
};
