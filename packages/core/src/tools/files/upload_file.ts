import { z } from 'zod';
import {
  resolveInline,
  resolveUrl,
  uploadError,
  type UploadPurpose,
} from '../../upload/source.js';
import type { PrepareResult, ToolContext } from '../tools.js';

const PURPOSE_DESCRIPTION =
  'What the file is for, which decides the media types it may have, its size limit, and the one call that can spend the key. ' +
  '`project_text` takes any `text/*` file plus `application/json`, `application/xml` and `application/yaml`, up to 64 MB, and its key is spent by `create_project_from_file` with type text. ' +
  '`project_xml` takes `text/plain`, `text/xml` and `application/xml`, up to 64 MB, and is spent with type xml. ' +
  '`pdf_accessibility` takes `application/pdf` and `application/x-pdf`, up to 30 MB, and is spent by `run_accessibility_pdf_upload_test`. ' +
  '`sitemap_content_image` takes any `image/*` file up to 10 MB, and is spent by `store_content_image`. ' +
  '`sitemap_content_file` takes any `image/*` or `text/*` file plus PDFs, Office documents, archives and RDF files, up to 64 MB, and is spent by `store_content_file`; it also takes a file that declares `application/octet-stream` when the extension is `.psd`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, `.xlsx`, `.zip`, `.rar`, `.txt`, `.md`, `.csv` or `.rdf`. ' +
  'A type no purpose accepts answers `400 invalid_file_type`, and a file over its purpose’s limit answers `413 file_too_large`.';

/**
 * An optional argument as a client actually leaves it.
 *
 * A caller that fills every property of a schema — which is what a model
 * emitting a tool call tends to do — sends `""`, and occasionally `null`, for
 * the ones it has nothing for. Neither is a value this tool asked for, but both
 * are common enough that rejecting them turns "send `content`" into a
 * validation error about an argument the caller never meant to send.
 *
 * Treated as absent, they let `prepare` decide which source was really given.
 * The emitted schema is unchanged: this alters what is accepted, not what is
 * advertised, and it still says the argument is a URL or a non-empty string.
 */
function optionalArgument<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    schema.optional()
  );
}

const purpose = z.enum([
  'project_text',
  'project_xml',
  'pdf_accessibility',
  'sitemap_content_image',
  'sitemap_content_file',
]);

const url = z
  .url({ protocol: /^https?$/ })
  .describe(
    'URL this server fetches the file from, instead of taking its bytes. It must start with http:// or https://. ' +
      'A hosted server fetches only public addresses, so a link to a private or loopback host is refused with `blocked_address`. ' +
      'The response’s `Content-Type` is the declared media type unless `mimeType` overrides it, and its `Content-Disposition` filename is the name unless `name` overrides it.'
  );

const name = z
  .string()
  .min(1)
  .describe(
    'Filename for the stored file, with any directory removed. An import uses it as the new project’s title, and a stored content file keeps it as its label. Required with `content`; optional with `url`, where the response’s `Content-Disposition` or the URL’s last segment names the file.'
  );

const mimeType = z
  .string()
  .min(1)
  .describe(
    'Media type of the file, such as `text/plain` or `image/png`, checked against the purpose’s allowlist. Required with `content`, because the bytes are never sniffed. Optional with `url`, where the response’s `Content-Type` is used.'
  );

const content = z
  .string()
  .min(1)
  .describe(
    'The file’s bytes as standard base64. Send `name` and `mimeType` with it, and send either this or `url`, never both. ' +
      'The decoded size must fit the purpose: 64 MB for the two import purposes and for `sitemap_content_file`, 30 MB for `pdf_accessibility` and 10 MB for `sitemap_content_image`. ' +
      'A body over the deployment’s request limit is refused before this is read, and base64 that will not decode answers `invalid_content`.'
  );

/**
 * The stdio server reads the caller's own filesystem, so a path is the whole
 * interface: there is no file it cannot reach and no reason to fetch one.
 */
const stdioInputSchema = z.object({
  purpose: purpose.describe(PURPOSE_DESCRIPTION),
  file: z
    .string()
    .min(1)
    .describe(
      'Absolute path to the file to store, on the machine running this server. Its declared media type must be one the purpose accepts, and it may not be empty or larger than that purpose’s limit: 64 MB for the two import purposes and for `sitemap_content_file`, 30 MB for `pdf_accessibility` and 10 MB for `sitemap_content_image`.'
    ),
});

/**
 * A hosted server's filesystem is the pod's, not the caller's: there is no path
 * to send, so the bytes travel in the request and the name and media type
 * travel with them.
 *
 * Every argument here is optional at the schema level, because which ones are
 * required depends on the source: `content` needs `name` and `mimeType`, `url`
 * needs neither. `prepare` decides, so that a caller gets one clear refusal
 * instead of a validation error about an argument it did not mean to send.
 */
const hostedInputSchema = z
  .object({
    purpose: purpose.describe(PURPOSE_DESCRIPTION),
    content: optionalArgument(content),
    name: optionalArgument(name),
    mimeType: optionalArgument(mimeType),
    url: optionalArgument(url),
  })
  .refine(
    (value) =>
      value.content === undefined ||
      (value.name !== undefined && value.mimeType !== undefined),
    {
      message:
        'Send `name` and `mimeType` with `content`: the name is what an import uses as the project title, and the declared media type is what the purpose’s allowlist is checked against.',
    }
  );

/**
 * The sources each transport accepts, which is what its schema offers.
 *
 * A path is the stdio server's alone — it is the machine the process runs on.
 * A hosted server has no path to read, so it takes the bytes or fetches them.
 */
const SOURCES: Record<'stdio' | 'hosted', readonly string[]> = {
  stdio: ['file'],
  hosted: ['content', 'url'],
};

export const upload_file = {
  name: 'upload_file',
  description:
    'Upload a file and get the key another call accepts in its place. ' +
    '`purpose` is a contract rather than a label: it fixes the media types the file may have, its size limit, and the one call allowed to spend the returned key. ' +
    'The two import purposes feed `create_project_from_file` with the matching `type` — `project_text` for `text`, `project_xml` for `xml`. `pdf_accessibility` feeds `run_accessibility_pdf_upload_test`, `sitemap_content_image` feeds `store_content_image` and `sitemap_content_file` feeds `store_content_file`. ' +
    'The file is `file`, an absolute path on the machine running this server. ' +
    'Keys are account-scoped and not consumed. The upload itself stays in staging, and each call that resolves the key copies the bytes into the storage the project is served from, or hands them to the accessibility checker; an upload nothing resolves expires on its own schedule. ' +
    'One upload can therefore back several calls, which is why the file is sent once and referred to by key from then on.',
  inputSchema: (mode: 'stdio' | 'hosted') =>
    mode === 'hosted' ? hostedInputSchema : stdioInputSchema,
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

  /**
   * Turns whichever source the caller used into the bytes the upload sends.
   *
   * A path is left to the API client, which reads it where the caller and the
   * server share a filesystem. Bytes and URLs are resolved here, because a
   * hosted server has no path to read and the caller is waiting on the result
   * rather than on a stack trace.
   */
  async prepare(args: any, context: ToolContext): Promise<PrepareResult> {
    const uploadPurpose = args.purpose as UploadPurpose;
    const legal = SOURCES[context.mode];
    const named = legal.map((name) => `\`${name}\``).join(' or ');
    const sent = legal.filter(
      (name) => typeof args[name] === 'string' && args[name].length > 0
    );

    if (sent.length !== 1) {
      return {
        error: uploadError(
          'invalid_file_source',
          sent.length === 0
            ? `Send ${named}.`
            : `Send exactly one source, not ${sent.map((name) => `\`${name}\``).join(' and ')}.`
        ),
      };
    }

    const source = sent[0] as 'file' | 'content' | 'url';

    if (source === 'file') {
      return {
        args: { purpose: uploadPurpose, file: args.file },
        source: 'file',
      };
    }

    if (source === 'content' && typeof args.name !== 'string') {
      return {
        error: uploadError(
          'invalid_content',
          'Send `name` and `mimeType` with `content`: the name is what an import uses as the project title, and the declared media type is what the purpose’s allowlist is checked against.'
        ),
        source: 'content',
      };
    }

    if (
      source === 'content' &&
      (typeof args.mimeType !== 'string' || args.mimeType.length === 0)
    ) {
      return {
        error: uploadError(
          'invalid_content',
          'Send `mimeType` with `content`: the bytes are never sniffed, so the declared media type is what the purpose’s allowlist is checked against.'
        ),
        source: 'content',
      };
    }

    const resolved =
      source === 'content'
        ? resolveInline(args.content, args.name, args.mimeType, uploadPurpose)
        : await resolveUrl(args.url, uploadPurpose, {
            ...(context.timeoutMs
              ? { deadline: Date.now() + context.timeoutMs }
              : {}),
            ...(args.name ? { name: args.name } : {}),
            ...(args.mimeType ? { mimeType: args.mimeType } : {}),
          });

    if (!resolved.ok) {
      return { error: resolved.result, source };
    }

    return {
      args: { purpose: uploadPurpose },
      upload: resolved.file,
      source,
    };
  },
};
