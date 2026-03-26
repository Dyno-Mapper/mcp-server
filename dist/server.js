import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { tools } from './tools/tools.js';
import { ApiHelper } from './api.js';
export class DynoMapperServer {
    server;
    apiHelper;
    API_BASE_URL = process.env.DYNOMAPPER_API_URL || 'https://api.dynomapper.com';
    constructor() {
        const apiKey = process.env.DYNOMAPPER_API_KEY;
        if (!apiKey) {
            console.error('DYNOMAPPER_API_KEY environment variable is required');
        }
        this.server = new McpServer({
            name: '@dynomapper/mcp-server',
            version: '0.1.0',
            description: 'DYNO Mapper MCP Server',
        });
        this.apiHelper = new ApiHelper(process.env.DYNOMAPPER_API_URL || 'https://api.dynomapper.com', String(apiKey));
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
                return this.apiHelper.handleToolRequest(tool.name, tool.path, args);
            });
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('DYNO Mapper MCP server running on stdio');
    }
}
