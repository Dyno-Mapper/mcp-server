import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  inputSchemaFor,
  tools,
  type ExtraTool,
  type ToolContext,
  type TransportMode,
} from './tools/tools.js';
import { ApiHelper } from './api.js';
import { packageVersion } from './version.js';

export interface DynoMapperServerOptions {
  /** API base URL. Defaults to `DYNOMAPPER_API_URL`, then the public API. */
  baseUrl?: string;
  /** Token used when a tool call arrives without one. stdio only. */
  apiKey?: string;
  /** Deadline for one API call, used by the hosted transport. */
  requestTimeoutMs?: number;
  /** Where operational lines go. Defaults to silence. */
  log?: (line: string) => void;
}

export interface CreateServerOptions {
  /**
   * Build the server for a hosted deployment rather than a local one.
   *
   * It changes which tools exist and what they accept: a hosted server cannot
   * read the caller's filesystem, so it does not offer `upload_file` at all and
   * offers `create_upload_ticket` instead.
   */
  hosted?: boolean;
  /**
   * Tools this package does not know about, registered alongside its own.
   *
   * The hosted package uses it for `create_upload_ticket`, which can only work
   * where a public origin and an upload secret exist. Keeping that tool out of
   * core is also what keeps it out of the npm tarball, which is a stdio-only
   * artifact.
   */
  extraTools?: readonly ExtraTool[];
  /** The origin this request arrived at, when the transport knows it. */
  requestOrigin?: string;
}

/**
 * Descriptions that would otherwise say something untrue of this deployment.
 *
 * An entry is a rewrite of the tool's own text, not a replacement for it: the
 * description says how the upload reaches the server and leaves every other
 * sentence alone. Restating the whole description here would work today and
 * drift tomorrow — this repository has already lost an error name to a
 * hand-kept override — so each entry only swaps the clause that names a tool
 * this server does not register.
 *
 * Kept next to the transport switch so the two cannot drift apart.
 */
const HOSTED_DESCRIPTIONS: Record<string, (description: string) => string> = {
  store_content_image: (text) =>
    text.replace(
      'Upload the picture once with `upload_file` and the `sitemap_content_image` purpose, then send the key it returned here.',
      'Upload the picture once with `create_upload_ticket` and the `sitemap_content_image` purpose, PUT the bytes to the URL it returns, and send the `key` from that response here.'
    ),
  store_content_file: (text) =>
    text.replace(
      'Upload the file once with `upload_file` and the `sitemap_content_file` purpose, then send the key it returned here.',
      'Upload the file once with `create_upload_ticket` and the `sitemap_content_file` purpose, PUT the bytes to the URL it returns, and send the `key` from that response here.'
    ),
  run_accessibility_pdf_upload_test: (text) =>
    text.replace(
      'Upload the PDF once with `upload_file` and the `pdf_accessibility` purpose, then send the key it returned here.',
      'Upload the PDF once with `create_upload_ticket` and the `pdf_accessibility` purpose, PUT the bytes to the URL it returns, and send the `key` from that response here.'
    ),
  create_project_from_file: (text) =>
    text.replace(
      'a `fileKey` from `upload_file`, or a `url` the import service fetches',
      'a `fileKey` from `create_upload_ticket`, whose URL you PUT the file to, or a `url` the import service fetches'
    ),
};

/**
 * Tools a hosted server must not offer.
 *
 * `upload_file` takes an absolute path on the machine running the server. On
 * stdio that is the caller's machine and the tool is exactly right; hosted, it
 * is the pod's, so the tool would fail every call and its schema would invite a
 * caller to try. The tool is not merely discouraged there — it is absent, and
 * `create_upload_ticket` is what exists instead.
 */
const HOSTED_SKIPPED_TOOLS = new Set(['upload_file']);

export class DynoMapperServer {
  private readonly apiHelper: ApiHelper;
  private readonly requestTimeoutMs?: number;
  private readonly log?: (line: string) => void;

  constructor(options: DynoMapperServerOptions = {}) {
    const apiKey =
      options.apiKey ??
      process.env.DYNOMAPPER_API_KEY ??
      process.env.MCP_API_KEY ??
      process.env.API_KEY;

    this.requestTimeoutMs = options.requestTimeoutMs;
    this.log = options.log;
    this.apiHelper = new ApiHelper(
      options.baseUrl ??
        process.env.DYNOMAPPER_API_URL ??
        'https://api.dynomapper.com',
      String(apiKey),
      { timeoutMs: options.requestTimeoutMs }
    );
  }

  /**
   * Builds one MCP server with every tool registered.
   *
   * It knows nothing about a transport: `packages/stdio` connects it to a
   * StdioServerTransport and exits, while `packages/http` calls this once per
   * request — so it must not assume anything carries over between calls.
   */
  createServer(options: CreateServerOptions = {}): McpServer {
    const server = new McpServer({
      name: '@dynomapper/mcp-server',
      version: packageVersion(),
      description: 'DYNO Mapper MCP Server',
    });

    this.setupHandlers(server, options);
    server.server.onerror = (error) => console.error('[MCP Error]', error);

    return server;
  }

  private setupHandlers(server: McpServer, options: CreateServerOptions) {
    const mode: TransportMode = options.hosted ? 'hosted' : 'stdio';

    for (const tool of Object.values(tools)) {
      if (options.hosted && HOSTED_SKIPPED_TOOLS.has(tool.name)) {
        continue;
      }

      server.registerTool(
        tool.name,
        {
          description:
            (options.hosted &&
              HOSTED_DESCRIPTIONS[tool.name]?.(tool.description)) ||
            tool.description,
          inputSchema: inputSchemaFor(tool) as any,
          outputSchema: tool.outputSchema,
          annotations: {
            readOnlyHint: tool.method.toLowerCase() === 'get',
            destructiveHint: tool.method.toLowerCase() === 'delete',
            openWorldHint: true,
          },
        },
        async (args: any, extra: any) => {
          const result = await this.apiHelper.handleToolRequest(
            tool.method,
            tool.path,
            args,
            tokenFrom(extra),
            {
              ...(tool.multipart ? { multipart: tool.multipart } : {}),
              ...(this.requestTimeoutMs
                ? { timeoutMs: this.requestTimeoutMs }
                : {}),
            }
          );

          return result;
        }
      );
    }

    for (const tool of options.extraTools ?? []) {
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema as any,
          outputSchema: tool.outputSchema,
          // Nothing here is known to be a read or a delete: an `ExtraTool`
          // answers for itself, so it is described as an ordinary call.
          annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            openWorldHint: true,
          },
        },
        async (args: any, extra: any) =>
          tool.execute(args, {
            mode,
            ...(this.requestTimeoutMs
              ? { timeoutMs: this.requestTimeoutMs }
              : {}),
            ...(tokenFrom(extra) ? { token: tokenFrom(extra) } : {}),
            ...(options.requestOrigin
              ? { requestOrigin: options.requestOrigin }
              : {}),
          } satisfies ToolContext)
      );
    }
  }
}

const BEARER = /^Bearer\s+(\S+)$/i;

/**
 * The bare token from the transport's `Authorization` header.
 *
 * Bare, not the whole header, so that everything downstream of a call agrees on
 * one string per caller: the API client adds the scheme back, and the upload
 * route keys its slot accounting on a digest of the token the `/mcp` path used.
 * A value that is not in `Bearer …` form is returned unchanged, because the API
 * is the authority on what a token is.
 */
function tokenFrom(extra: any): string | undefined {
  const header = extra?.requestInfo?.headers?.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string') {
    return undefined;
  }
  return BEARER.exec(value.trim())?.[1] ?? (value.trim() || undefined);
}
