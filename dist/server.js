import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { tools } from './tools/tools.js';
import { ApiHelper } from './api.js';
export class DynoMapperServer {
    server;
    apiHelper;
    constructor() {
        const apiKey = process.env.DYNOMAPPER_API_KEY ||
            process.env.MCP_API_KEY ||
            process.env.API_KEY;
        this.apiHelper = new ApiHelper(process.env.DYNOMAPPER_API_URL || 'https://api.dynomapper.com', String(apiKey));
        this.server = new McpServer({
            name: '@dynomapper/mcp-server',
            version: '0.1.0',
            description: 'DYNO Mapper MCP Server',
        });
        this.setupHandlers();
        this.server.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupHandlers() {
        for (const tool of Object.values(tools)) {
            this.server.registerTool(tool.name, {
                description: tool.description,
                inputSchema: tool.inputSchema,
                outputSchema: tool.outputSchema,
            }, async (args) => {
                return this.apiHelper.handleToolRequest(tool.method, tool.path, args);
            });
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('DYNO Mapper MCP server running on stdio');
    }
    async runSSE(port = 3000) {
        const app = createMcpExpressApp();
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => Math.random().toString(36).substring(2),
        });
        await this.server.connect(transport);
        app.all('/mcp', async (req, res) => {
            console.error(`[SSE Request] ${req.method} ${req.url}`);
            try {
                await transport.handleRequest(req, res, req.body);
            }
            catch (error) {
                console.error('[SSE Error]', error);
                if (!res.headersSent) {
                    res.status(500).send('Internal Server Error');
                }
            }
        });
        app.listen(port, () => {
            console.error(`DYNO Mapper MCP server running on http://localhost:${port}/mcp`);
        });
    }
}
