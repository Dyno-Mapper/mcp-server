import { z } from 'zod';

export const create_project_from_file = {
  name: 'create_project_from_file',
  description:
    "Create a project from a text file or an XML sitemap, imported rather than crawled: `type: 'text'` imports a plain-text list of URLs, `type: 'xml'` an XML sitemap. Send exactly one source — `file`, `fileKey` or `url`. None, or more than one, answers 400 `invalid_file_source`; a `url` sent alongside a `file` takes precedence, so the file is unused. `fileKey` comes from `upload_file`. A project created from a `file` or a `fileKey` cannot be refreshed with `refresh_project_file`, because no source URL is kept — send a `url` when a refresh may be needed later. The import is queued: poll `get_project_file_job_status` with the same `type` until `finished` is true, then read the project with `get_project_details`. Cancel it with `cancel_project_file_job`.",
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
        'URL the import service fetches the file from. It must start with http:// or https://, and it is the source a refresh re-reads later — the only source `refresh_project_file` can use.'
      ),
    file: z
      .string()
      .optional()
      .describe(
        'Absolute path to the file to import, on the machine running this server (max 64 MB), of a type the import accepts. Send it instead of `fileKey` and `url`; a project created from it keeps no source URL and cannot be refreshed.'
      ),
    fileKey: z
      .string()
      .optional()
      .describe(
        "Key returned by `upload_file` for a file uploaded with the matching purpose — `project_text` for `type: 'text'`, `project_xml` for `type: 'xml'`. Send it instead of `file` and `url`; it is not a public link, it only works for the account that uploaded it, and a project created from it cannot be refreshed."
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
  multipart: true,
};
