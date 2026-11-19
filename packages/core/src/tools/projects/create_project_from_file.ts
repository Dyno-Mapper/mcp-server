import { z } from 'zod';

export const create_project_from_file = {
  name: 'create_project_from_file',
  description:
    "Create a project from a text file or an XML sitemap, imported rather than crawled: `type: 'text'` imports a plain-text list of URLs, `type: 'xml'` an XML sitemap. The request names one source — a `fileKey` from `upload_file`, or a `url` the import service fetches — and a file is never sent with this call. Send neither, or both, and it answers 400 `invalid_file_source`; the key also has to have been uploaded for the matching purpose, or it answers `purpose_mismatch`. A project created from a `fileKey` cannot be refreshed with `refresh_project_file`, because no source URL is kept, so send a `url` when a refresh may be needed later. The import is queued: poll `get_project_file_job_status` with the same `type` until `finished` is true, then read the project with `get_project_details`. Cancel it with `cancel_project_file_job`. The project counts against the plan's project allowance, and at the allowance the call answers 500.",
  inputSchema: z.object({
    type: z
      .enum(['text', 'xml'])
      .describe(
        'Which import to run: `text` for a plain-text list of URLs, `xml` for an XML sitemap.'
      ),
    speed: z
      .enum(['slower', 'slowest'])
      .optional()
      .describe(
        'Pace of the import. `slower` throttles it, `slowest` throttles it further; omit it to run as fast as the import service allows.'
      ),
    url: z
      .url({ protocol: /^https?$/ })
      .optional()
      .describe(
        'URL the import service fetches the file from. It must start with http:// or https://, and it is the source a refresh re-reads later — the only source `refresh_project_file` can use. Send it instead of `fileKey`.'
      ),
    fileKey: z
      .string()
      .optional()
      .describe(
        "Key returned by `upload_file` for a file uploaded with the matching purpose — `project_text` for `type: 'text'`, `project_xml` for `type: 'xml'`. This is the only way a file reaches this call, so upload it first and send the key. It is not a public link, it only works for the account that uploaded it, and a project created from it cannot be refreshed."
      ),
  }),
  outputSchema: z.object({
    id: z
      .number()
      .describe(
        'ID of the project the import is creating. Poll `get_project_file_job_status` with the same `type` for its progress.'
      ),
  }),
  method: 'post',
  path: '/v1/project/{type}',
};
