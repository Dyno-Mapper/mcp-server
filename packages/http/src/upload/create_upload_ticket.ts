import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ExtraTool, ToolContext } from '@dynomapper/mcp-core';
import type { HttpConfig } from '../config.js';
import {
  normaliseMediaType,
  safeName,
  sealTicket,
  ticketKey,
  type UploadPurpose,
} from './ticket.js';

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

/** A refusal the agent can act on, in the vocabulary the API already uses. */
function refusal(error: string, message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error, message }) }],
    isError: true,
  };
}

/** A filename as a shell word, so the advice can be pasted unedited. */
function shellQuoted(name: string): string {
  return `'${name.replace(/'/g, `'\\''`)}'`;
}

/**
 * `create_upload_ticket` — the one workable way for a hosted agent to send a
 * file.
 *
 * It returns a capability rather than a result: the bytes are PUT to a URL by
 * the caller's own HTTP client, so they never become tool arguments and never
 * pass through a model. The ticket is sealed rather than merely signed because
 * it carries the caller's token — the route has to authenticate to the API as
 * that caller, and an agent sandbox has no credential to present on a bare PUT.
 *
 * This tool lives in the hosted package, not in core: it can only work where a
 * public origin and an upload secret exist, and keeping it out of core is what
 * keeps it out of the npm tarball.
 */
export function uploadTicketTool(config: HttpConfig): ExtraTool {
  return {
    name: 'create_upload_ticket',
    description:
      'Get a short-lived URL to upload a file to, then PUT the bytes there. ' +
      'This is the one workable way for a hosted agent to send a file: tool arguments are JSON, and a file’s bytes as base64 cost more tokens than the file has bytes. ' +
      '`purpose` is a contract rather than a label: it fixes the media types the file may have, its size limit, and the one call allowed to spend the returned key. ' +
      'The two import purposes feed `create_project_from_file` with the matching `type` — `project_text` for `text`, `project_xml` for `xml`. `pdf_accessibility` feeds `run_accessibility_pdf_upload_test`, `sitemap_content_image` feeds `store_content_image` and `sitemap_content_file` feeds `store_content_file`. ' +
      'PUT the file with any HTTP client — `curl -T ./file.png "<uploadUrl>"` is the shortest form, and the `curl` field spells it out. The PUT’s response body is the upload result: it carries `key`, `name`, `size` and `mimeType`, and `key` is what the spending call takes as `fileKey`. ' +
      'The URL is a capability: it works once for one purpose for about ten minutes, and anyone who has it can spend that upload, so do not paste it into a ticket tracker or a shared log. ' +
      'Keys are account-scoped and not consumed. The upload itself stays in staging, and each call that resolves the key copies the bytes into the storage the project is served from, or hands them to the accessibility checker; an upload nothing resolves expires on its own schedule. ' +
      'One upload can therefore back several calls, which is why the file is sent once and referred to by key from then on.',
    inputSchema: z.object({
      purpose: purpose.describe(PURPOSE_DESCRIPTION),
      name: z
        .string()
        .min(1)
        .describe(
          'Filename for the stored file, with any directory removed. An import uses it as the new project’s title, and a stored content file keeps it as its label. Send just the name: quotes, backslashes and line breaks are replaced, because the name is written into the upload’s own headers.'
        ),
      mimeType: z
        .string()
        .min(1)
        .describe(
          'Media type of the file, such as `text/plain` or `image/png`, checked against the purpose’s allowlist. Required here because the bytes are never sniffed and the upload itself carries no arguments: the declared type is part of the ticket.'
        ),
    }),
    outputSchema: z.object({
      uploadUrl: z
        .string()
        .describe(
          'Absolute URL to PUT the file’s bytes to. Single use, single purpose, expires at `expiresAt`. Send the bytes as the whole request body; do not send a multipart form and do not resend a different file to it.'
        ),
      method: z
        .string()
        .describe('HTTP method for `uploadUrl`. It is always `PUT`.'),
      expiresAt: z
        .string()
        .describe(
          'When `uploadUrl` stops working, as an ISO 8601 timestamp. After that the PUT answers `403 upload_ticket_expired` and the repair is to call this tool again.'
        ),
      curl: z
        .string()
        .describe(
          'A ready-to-run command that uploads a local file, with the URL already filled in. Replace the path with the file you mean; the rest works as it is.'
        ),
    }),
    async execute(args: any, context: ToolContext) {
      const uploadPurpose = args.purpose as UploadPurpose;
      const name = safeName(String(args.name ?? ''));
      const mimeType = normaliseMediaType(String(args.mimeType ?? ''));

      if (mimeType.length === 0) {
        return refusal(
          'invalid_file_type',
          'Send `mimeType`, such as `image/png`: the bytes are never sniffed, so the declared media type is what the purpose’s allowlist is checked against.'
        );
      }

      const origin = context.requestOrigin ?? config.publicUrl;

      if (!origin) {
        return refusal(
          'upload_ticket_unavailable',
          'This deployment cannot mint an upload URL because it does not know its own public origin: set `MCP_PUBLIC_URL`, or reach it at a host it accepts. Nothing else is affected.'
        );
      }

      if (config.uploadSecret.length === 0) {
        return refusal(
          'upload_ticket_unavailable',
          'Uploads are not configured on this deployment: `MCP_UPLOAD_SECRET` is unset, so no ticket can be sealed. Every other tool works. An operator sets the secret to a passphrase of at least 32 characters and restarts the server.'
        );
      }

      if (!context.token) {
        // authGuard makes this unreachable in practice; refusing rather than
        // sealing an empty token keeps a misconfiguration from becoming a
        // ticket that fails at the API with someone else's error.
        return refusal(
          'upload_ticket_unavailable',
          'This request carried no bearer token, so the upload could not be authenticated as you. Send your DYNO Mapper token in the `Authorization` header.'
        );
      }

      const expiresAt = Date.now() + config.uploadTicketTtlMs;
      const sealed = sealTicket(
        {
          token: context.token,
          purpose: uploadPurpose,
          name,
          mimeType,
          expiresAt,
        },
        ticketKey(config.uploadSecret)
      );

      const uploadUrl = `${origin.replace(/\/+$/, '')}/upload/${sealed}`;
      const curl = `curl -T ${shellQuoted(`./${name}`)} "${uploadUrl}"`;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              uploadUrl,
              method: 'PUT',
              expiresAt: new Date(expiresAt).toISOString(),
              curl,
            }),
          },
        ],
        structuredContent: {
          uploadUrl,
          method: 'PUT',
          expiresAt: new Date(expiresAt).toISOString(),
          curl,
        },
      };
    },
  };
}
