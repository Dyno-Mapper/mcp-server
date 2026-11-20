import { z } from 'zod';

const PURPOSE_DESCRIPTION =
  'What the file is for, which decides the media types it may have, its size limit, and the one call that can spend the key. ' +
  '`project_text` takes any `text/*` file plus `application/json`, `application/xml` and `application/yaml`, up to 64 MB, and its key is spent by `create_project_from_file` with type text. ' +
  '`project_xml` takes `text/plain`, `text/xml` and `application/xml`, up to 64 MB, and is spent with type xml. ' +
  '`pdf_accessibility` takes `application/pdf` and `application/x-pdf`, up to 30 MB, and is spent by `run_accessibility_pdf_upload_test`. ' +
  '`sitemap_content_image` takes any `image/*` file up to 10 MB, and is spent by `store_content_image`. ' +
  '`sitemap_content_file` takes any `image/*` or `text/*` file plus PDFs, Office documents, archives and RDF files, up to 64 MB, and is spent by `store_content_file`; it also takes a file that declares `application/octet-stream` when the extension is `.psd`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.zip`, `.rar`, `.txt`, `.md`, `.csv` or `.rdf`. ' +
  'A type no purpose accepts answers `400 invalid_file_type`, and a file over its purpose’s limit answers `413 file_too_large`.';

const purpose = z.enum([
  'project_text',
  'project_xml',
  'pdf_accessibility',
  'sitemap_content_image',
  'sitemap_content_file',
]);

/**
 * Uploads, for a server that runs on the caller's own machine.
 *
 * A path is the whole interface here: the process can reach any file its caller
 * can, and no bytes have to travel through a tool call. A hosted server cannot
 * offer this — its filesystem is the pod's — so it registers
 * `create_upload_ticket` instead and does not offer this tool at all. That split
 * is the reason there is no source argument: with one transport left, there is
 * nothing for it to choose between.
 */
export const upload_file = {
  name: 'upload_file',
  description:
    'Upload a file and get the key another call accepts in its place. ' +
    '`purpose` is a contract rather than a label: it fixes the media types the file may have, its size limit, and the one call allowed to spend the returned key. ' +
    'The two import purposes feed `create_project_from_file` with the matching `type` — `project_text` for `text`, `project_xml` for `xml`. `pdf_accessibility` feeds `run_accessibility_pdf_upload_test`, `sitemap_content_image` feeds `store_content_image` and `sitemap_content_file` feeds `store_content_file`. ' +
    'The file is `file`, an absolute path on the machine running this server. A hosted server cannot read your disk and does not offer this tool: it offers `create_upload_ticket` instead, which hands you a URL to PUT the bytes to. ' +
    'Keys are account-scoped and not consumed. The upload itself stays in staging, and each call that resolves the key copies the bytes into the storage the project is served from, or hands them to the accessibility checker; an upload nothing resolves expires on its own schedule. ' +
    'One upload can therefore back several calls, which is why the file is sent once and referred to by key from then on.',
  inputSchema: z.object({
    purpose: purpose.describe(PURPOSE_DESCRIPTION),
    file: z
      .string()
      .min(1)
      .describe(
        'Absolute path to the file to store, on the machine running this server. Its declared media type must be one the purpose accepts, and it may not be empty or larger than that purpose’s limit: 64 MB for the two import purposes and for `sitemap_content_file`, 30 MB for `pdf_accessibility` and 10 MB for `sitemap_content_image`.'
      ),
  }),
  outputSchema: z.object({
    key: z
      .string()
      .describe(
        'Identifier of the stored file. Send it as `fileKey` to the call that matches its purpose — `create_project_from_file`, `run_accessibility_pdf_upload_test`, `store_content_image` or `store_content_file` — instead of sending the file again. It is bound to the uploading account and is not consumed by use, so one upload can back several calls.'
      )
      .meta({
        example:
          'uploads/api/project_text/b2/d0c1f9a7-1f3b-4a4e-9f0d-6b7c2f0a1e33/sitemap.txt',
      }),
    name: z
      .string()
      .describe(
        'Original filename, as the client sent it, with any directory removed. The import that spends the key uses it as the new project’s title, and a stored content file keeps it as its label.'
      ),
    size: z
      .number()
      .describe(
        'Length of the stored file in bytes, counted from the bytes received rather than taken from a request header.'
      ),
    mimeType: z
      .string()
      .describe(
        'Media type the client declared for the file, lower-cased and with parameters such as `; charset=utf-8` removed. This is the value the purpose’s allowlist was checked against, and it is checked again when a key is spent; the bytes themselves are not sniffed.'
      ),
  }),
  method: 'post',
  path: '/v1/files',
  multipart: 'fields' as const,
};
