import { z } from 'zod';
export const get_accessibility_pdf_files = {
    name: 'get_accessibility_pdf_files',
    description: 'List the PDF files the checker has found on, or been given for, a project — one row per file with the file’s check state and its problem counts. ' +
        '`id` is the `itemId` that `get_accessibility_pdf_item_result` takes for the per-criterion results. ' +
        'Checking is asynchronous: a file sits at `queued` and moves through `running` to `completed`, and its counts fill in as it goes. ' +
        'Files that were deleted are excluded from the list, so `deleted` never appears in `state` here even though the field can hold it. Without `orderBy` the most recently modified file comes first, and `orderDir` defaults to `asc` when you pass an `orderBy` without a direction.',
    inputSchema: z.object({
        projectId: z.number().describe('Id of the project whose files to list.'),
        search: z
            .string()
            .trim()
            .optional()
            .describe('Substring matched against the file’s URL or its filename, so a search for `invoice` finds both a URL ending in `invoice.pdf` and a file named that way.'),
        location: z
            .enum(['internal', 'external'])
            .optional()
            .describe('Restrict to files found on the project’s own domain (`internal`) or to files linked from another domain (`external`). Omit to include both kinds, and uploaded files with them.'),
        orderBy: z
            .enum(['date', 'known_problems', 'likely_problems', 'potential_problems'])
            .optional()
            .describe('Field to order by: `date` orders by when the file was last modified and then when it was created, the other three by that problem count. Omit it to get the most recently modified files first.'),
        orderDir: z
            .enum(['asc', 'desc'])
            .optional()
            .describe('Direction applied to `orderBy`, defaulting to `asc` — pass `desc` to rank the largest counts first. Without an `orderBy` the ordering is newest-modified first whatever this is set to.'),
        page: z.coerce
            .number()
            .int()
            .positive()
            .optional()
            .describe('1-based page number to return. Defaults to 1.'),
        limit: z.coerce
            .number()
            .int()
            .positive()
            .transform((n) => Math.min(n, 100))
            .optional()
            .default(50)
            .describe('Maximum number of files to return. Defaults to 50; values above 100 are lowered to 100 rather than rejected.'),
    }),
    outputSchema: z.object({
        total: z
            .number()
            .describe('Number of files matching the filters, ignoring paging — `ceil(total / limit)` pages are available.'),
        limit: z
            .number()
            .describe('Page size that was applied: the `limit` you sent capped at 100, or 50 when you sent none.'),
        page: z.number().describe('1-based page number that was served.'),
        pageSize: z
            .number()
            .describe('Number of pages at this `limit`, `ceil(total / limit)`, not the number of rows in this response.'),
        items: z
            .array(z.object({
            id: z
                .number()
                .describe('Id of the PDF item — the `itemId` that `get_accessibility_pdf_item_result` takes for the file’s per-criterion results.'),
            url: z
                .string()
                .describe('URL the PDF was found at, or the address of the uploaded file. An empty string when none was recorded.'),
            filename: z
                .string()
                .describe('Name of the PDF file as stored, for example `report-2024.pdf`. An empty string when none was recorded.'),
            isExternal: z
                .boolean()
                .describe('Whether the file lives on another domain than the project’s, which is what the `external` `location` filter selects. `false` for files on the project’s own domain and for uploads.'),
            isUploaded: z
                .boolean()
                .describe('Whether the file was uploaded to the account rather than discovered by crawling. Uploads have no crawled URL of their own.'),
            state: z
                .enum(['completed', 'running', 'deleted', 'queued', 'unknown'])
                .describe('Check lifecycle of the file: `completed` when the checker has results for it, `running` while it is being checked, `queued` while it waits to be checked, `deleted` for a removed file, and `unknown` for a stored value the API does not recognise. `deleted` is never returned here, because this list filters deleted files out.'),
            status: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Status text the checker stores beside `state`, passed through as recorded. Prose rather than a fixed set, so read `state` for the lifecycle. `null` when none was recorded.'),
            error: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('Message the check ended with when it failed. `null` when the file has not failed, including while it is still queued or running.'),
            errorReason: z
                .string()
                .optional()
                .nullish()
                .default(null)
                .describe('The checker’s own reason for `error`, in its words rather than a fixed vocabulary. `null` when it recorded none.'),
            knownProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Known problems in the file: findings the checker is certain are violations. `0` when it found none or has not finished.'),
            likelyProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Likely problems in the file: findings the checker believes are violations but cannot confirm without a person looking. `0` when there are none.'),
            potentialProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Potential problems in the file: findings that may be violations. `0` when there are none.'),
            archivedKnownProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Known problems in the file that have since been archived, so they are kept for history but no longer counted in `knownProblems`. `0` when nothing is archived.'),
            archivedLikelyProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Likely problems in the file that have since been archived and are no longer counted in `likelyProblems`. `0` when nothing is archived.'),
            archivedPotentialProblems: z
                .number()
                .optional()
                .nullish()
                .default(null)
                .describe('Potential problems in the file that have since been archived and are no longer counted in `potentialProblems`. `0` when nothing is archived.'),
            created: z.iso
                .datetime()
                .describe('ISO 8601 date and time the file was added to the project.'),
        }))
            .describe('The page of files. Empty when no file of the project matches the filters.'),
    }),
    method: 'get',
    path: '/v1/accessibility/{projectId}/pdf',
};
