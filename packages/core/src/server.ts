import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { inputSchemaFor, tools, type TransportMode } from './tools/tools.js';
import { ApiHelper } from './api.js';
import { packageVersion } from './version.js';

export interface DynoMapperServerOptions {
  /** API base URL. Defaults to `DYNOMAPPER_API_URL`, then the public API. */
  baseUrl?: string;
  /** Token used when a tool call arrives without one. stdio only. */
  apiKey?: string;
  /** Deadline for one API call, used by the hosted transport. */
  requestTimeoutMs?: number;
  /** Where the one-line upload record goes. Defaults to silence. */
  log?: (line: string) => void;
}

export interface CreateServerOptions {
  /**
   * Build the server for a hosted deployment rather than a local one.
   *
   * It changes what a tool accepts, not whether it exists: both transports
   * register every tool, and `upload_file` reads a path on one and bytes on the
   * other.
   */
  hosted?: boolean;
}

/**
 * Descriptions that would otherwise say something untrue of this deployment.
 *
 * Kept next to the transport switch so the two cannot drift apart: a tool whose
 * arguments or capabilities differ also needs the sentences that describe them
 * to differ.
 */
const HOSTED_DESCRIPTIONS: Record<string, string> = {
  upload_file:
    'Upload a file and get the key another call accepts in its place. ' +
    '`purpose` is a contract rather than a label: it fixes the media types the file may have, its size limit, and the one call allowed to spend the returned key. ' +
    'The two import purposes feed `create_project_from_file` with the matching `type` — `project_text` for `text`, `project_xml` for `xml`. `pdf_accessibility` feeds `run_accessibility_pdf_upload_test`, `sitemap_content_image` feeds `store_content_image` and `sitemap_content_file` feeds `store_content_file`. ' +
    'This server is hosted, so its filesystem is not yours: the file comes from `content`, its bytes as base64 with `name` and `mimeType` alongside, or from `url`, which this server fetches. Send exactly one. ' +
    'Keys are account-scoped and not consumed. The upload itself stays in staging, and each call that resolves the key copies the bytes into the storage the project is served from, or hands them to the accessibility checker; an upload nothing resolves expires on its own schedule. ' +
    'One upload can therefore back several calls, which is why the file is sent once and referred to by key from then on.',
};

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
      server.registerTool(
        tool.name,
        {
          description:
            (options.hosted && HOSTED_DESCRIPTIONS[tool.name]) ||
            tool.description,
          inputSchema: inputSchemaFor(tool, mode) as any,
          outputSchema: tool.outputSchema,
          annotations: {
            readOnlyHint: tool.method.toLowerCase() === 'get',
            destructiveHint: tool.method.toLowerCase() === 'delete',
            openWorldHint: true,
          },
        },
        async (args: any, extra: any) => {
          const authHeader = extra.requestInfo?.headers?.authorization;
          const apiKey = Array.isArray(authHeader) ? authHeader[0] : authHeader;
          const startedAt = Date.now();

          const prepared = tool.prepare
            ? await tool.prepare(args, {
                mode,
                ...(this.requestTimeoutMs
                  ? { timeoutMs: this.requestTimeoutMs }
                  : {}),
              })
            : { args };

          const refused = 'error' in prepared;

          // The budget covers the whole call, not one of its legs: a URL that
          // took fifteen seconds leaves ten for the API, which is what makes
          // the documented deadline true for the caller waiting on both.
          const remaining = this.requestTimeoutMs
            ? Math.max(1, this.requestTimeoutMs - (Date.now() - startedAt))
            : undefined;

          const result = refused
            ? prepared.error
            : await this.apiHelper.handleToolRequest(
                tool.method,
                tool.path,
                prepared.args,
                apiKey,
                {
                  ...(tool.multipart ? { multipart: tool.multipart } : {}),
                  ...(prepared.upload ? { upload: prepared.upload } : {}),
                  ...(remaining ? { timeoutMs: remaining } : {}),
                }
              );

          // One line an operator can act on when a pod is running out of
          // memory: what was uploaded, how big it was, and whether it worked.
          if (tool.prepare) {
            this.log?.(
              `[upload] purpose=${args?.purpose ?? '-'} source=${prepared.source ?? '-'} ` +
                `bytes=${refused ? '-' : (prepared.upload?.bytes.length ?? '-')} ` +
                `outcome=${refused ? 'refused' : result.isError ? 'error' : 'ok'}`
            );
          }

          return result;
        }
      );
    }
  }
}
