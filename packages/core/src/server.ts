import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { tools } from './tools/tools.js';
import { ApiHelper } from './api.js';
import { packageVersion } from './version.js';

export interface DynoMapperServerOptions {
  /** API base URL. Defaults to `DYNOMAPPER_API_URL`, then the public API. */
  baseUrl?: string;
  /** Token used when a tool call arrives without one. stdio only. */
  apiKey?: string;
  /** Deadline for one API call, used by the hosted transport. */
  requestTimeoutMs?: number;
}

export interface CreateServerOptions {
  /** Omit tools that only work against the local filesystem. */
  hosted?: boolean;
}

/**
 * Tools that cannot work without the caller's filesystem.
 *
 * A hosted server's paths are the pod's, not the caller's, so `upload_file`
 * is not registered and `create_project_from_file` drops its `file` argument.
 * Its `url` and `fileKey` sources still work.
 */
const HOSTED_SKIPPED_TOOLS = new Set(['upload_file']);

const HOSTED_OMITTED_ARGS: Record<string, string[]> = {
  create_project_from_file: ['file'],
};

/**
 * Descriptions that would otherwise mention an argument hosted mode removes.
 *
 * Kept next to the omissions so the two cannot drift apart: a tool that loses
 * an argument also loses the sentences telling an agent to send it.
 */
const HOSTED_DESCRIPTIONS: Record<string, string> = {
  create_project_from_file:
    'Create a project from a text file or an XML sitemap, imported rather than crawled: ' +
    "`type: 'text'` imports a plain-text list of URLs, `type: 'xml'` an XML sitemap. " +
    'Send exactly one source — `fileKey` or `url`. This server is hosted, so it cannot read a local file, ' +
    'and `upload_file` is not available; a `fileKey` must have been minted on a stdio install of this server, ' +
    'against the same account. A project created from a `fileKey` cannot be refreshed with `refresh_project_file`, ' +
    'because no source URL is kept — send a `url` when a refresh may be needed later. ' +
    'The import is queued: poll `get_project_file_job_status` with the same `type` until `finished` is true, ' +
    'then read the project with `get_project_details`. Cancel it with `cancel_project_file_job`.',
};

export class DynoMapperServer {
  private readonly apiHelper: ApiHelper;

  constructor(options: DynoMapperServerOptions = {}) {
    const apiKey =
      options.apiKey ??
      process.env.DYNOMAPPER_API_KEY ??
      process.env.MCP_API_KEY ??
      process.env.API_KEY;

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
    for (const tool of Object.values(tools)) {
      if (options.hosted && HOSTED_SKIPPED_TOOLS.has(tool.name)) {
        continue;
      }

      const omitted = options.hosted
        ? (HOSTED_OMITTED_ARGS[tool.name] ?? [])
        : [];
      const inputSchema = omitted.length
        ? tool.inputSchema.omit(
            Object.fromEntries(omitted.map((name) => [name, true])) as any
          )
        : tool.inputSchema;

      server.registerTool(
        tool.name,
        {
          description:
            (options.hosted && HOSTED_DESCRIPTIONS[tool.name]) ||
            tool.description,
          inputSchema,
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

          return this.apiHelper.handleToolRequest(
            tool.method,
            tool.path,
            args,
            apiKey,
            tool.multipart
          );
        }
      );
    }
  }
}
