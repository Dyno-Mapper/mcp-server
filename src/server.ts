import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { tools } from './tools/tools.js';
import { ApiHelper } from './api.js';

export class DynoMapperServer {
  private readonly server: McpServer;
  private apiHelper: ApiHelper;

  constructor() {
    const apiKey =
      process.env.DYNOMAPPER_API_KEY ||
      process.env.MCP_API_KEY ||
      process.env.API_KEY;

    this.apiHelper = new ApiHelper(
      process.env.DYNOMAPPER_API_URL || 'https://api.dynomapper.com',
      String(apiKey)
    );

    this.server = this.createServer();
    this.setupHandlers(this.server);

    this.server.server.onerror = (error) => console.error('[MCP Error]', error);

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DYNO Mapper MCP server running on stdio');
  }

  async runSSE(port: number = 3000) {
    const app = createMcpExpressApp();
    const servers = new Map<string, McpServer>();
    const transports = new Map<string, StreamableHTTPServerTransport>();

    app.all('/mcp', async (req, res) => {
      const sessionId =
        (Array.isArray(req.headers['mcp-session-id'])
          ? req.headers['mcp-session-id'][0]
          : req.headers['mcp-session-id']) || '';

      let server: McpServer | undefined;
      let transport: StreamableHTTPServerTransport | undefined;

      if (sessionId) {
        server = servers.get(sessionId);
        transport = transports.get(sessionId);
      }

      if (!server) {
        server = this.createServer();
        this.setupHandlers(server);
        server.server.onerror = (error) => console.error('[MCP Error]', error);

        const newTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID().toString(),
          onsessioninitialized: (newId) => {
            transports.set(newId, newTransport);
            servers.set(newId, server!);
            console.log(`Session ${newId} initialized`);
          },
          onsessionclosed: (id) => {
            transports.delete(id);
            servers.get(id)?.close();
            servers.delete(id);
            console.log(`Session ${id} closed`);
          },
        });

        await server.connect(newTransport);
        transport = newTransport;
      }

      if (!transport) {
        throw new Error('MCP transport not initialized');
      }

      try {
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('[MCP SSE Error]', error);
        if (!res.headersSent) {
          res.status(500).send('Internal Server Error');
        }
      }
    });

    app.listen(port, () => {
      console.error(
        `DYNO Mapper MCP server running on http://localhost:${port}/mcp`
      );
    });
  }

  private setupHandlers(server: McpServer) {
    for (const tool of Object.values(tools)) {
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
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
            apiKey
          );
        }
      );
    }
  }

  private createServer() {
    return new McpServer({
      name: '@dynomapper/mcp-server',
      version: '0.1.0',
      description: 'DYNO Mapper MCP Server',
    });
  }
}
