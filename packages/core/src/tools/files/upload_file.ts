import { z } from 'zod';

export const upload_file = {
  name: 'upload_file',
  description:
    'Upload a local file and get the key that an import accepts in its place. ' +
    'Use `project_text` for a plain-text URL list, or `project_xml` for a sitemap: the purpose decides the media types and the size limit the file must satisfy, and the one import that can spend the returned key. ' +
    'Send the key as `fileKey` to `create_project_from_file` with the matching `type` — `text` for `project_text`, `xml` for `project_xml` — instead of sending the file again. ' +
    'Keys are account-scoped, not consumed, and the upload stays in staging until an import resolves the key, so one upload can back several imports.',
  inputSchema: z.object({
    purpose: z
      .enum(['project_text', 'project_xml'])
      .describe(
        'What the file will be imported as. `project_text` accepts any `text/*` file, plus `application/json`, `application/xml` and `application/yaml`, up to 64 MB, and its key is used by `create_project_from_file` with type text. `project_xml` accepts `text/plain`, `text/xml` and `application/xml`, up to 64 MB, and its key is used with type xml.'
      ),
    file: z
      .string()
      .min(1)
      .describe(
        'Absolute path to the file to store, on the machine running this server. Its declared media type must be one the purpose accepts, and it may not be empty or larger than 64 MB.'
      ),
  }),
  outputSchema: z.object({
    key: z
      .string()
      .describe(
        'Identifier of the stored file. Send it as `fileKey` to `create_project_from_file` with the type that matches its purpose instead of sending the file again. It is bound to the uploading account and is not consumed by use, so one upload can back several imports.'
      )
      .meta({
        example:
          'uploads/api/project_text/b2/d0c1f9a7-1f3b-4a4e-9f0d-6b7c2f0a1e33/sitemap.txt',
      }),
    name: z
      .string()
      .describe(
        'Original filename, as the client sent it, with any directory removed. The import that spends the key uses it as the new project’s title.'
      ),
    size: z
      .number()
      .describe(
        'Length of the stored file in bytes, counted from the bytes received rather than taken from a request header.'
      ),
    mimeType: z
      .string()
      .describe(
        'Media type the client declared for the file, lower-cased and with parameters such as `; charset=utf-8` removed. This is the value the purpose’s allowlist was checked against; the bytes themselves are not sniffed.'
      ),
  }),
  method: 'post',
  path: '/v1/files',
  multipart: 'fields' as const,
};
