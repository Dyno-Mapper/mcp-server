#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';
import { tools } from './tools/tools.js';

dotenv.config();

class ApiHelper {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async handleToolRequest(method: string, path: string, args: any) {
    return null as any;
  }

  async handleError(error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      return {};
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

    return null as any;
  }
}

class DynoMapperServer {
  private server: McpServer;
  private apiHelper: ApiHelper;
  private axiosInstance: AxiosInstance;
  private readonly API_BASE_URL =
    process.env.DYNOMAPPER_API_URL || 'https://api.dynomapper.com';

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

    this.apiHelper = new ApiHelper(
      process.env.DYNOMAPPER_API_URL || 'https://api.dynomapper.com',
      String(apiKey)
    );

    this.axiosInstance = axios.create({
      baseURL: this.API_BASE_URL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.setupHandlers();

    this.server.server.onerror = (error) => console.error('[MCP Error]', error);

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    for (const tool of Object.values(tools)) {
      this.server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
        },
        async (args) => {
          return this.apiHelper.handleToolRequest(tool.name, tool.path, args);
        }
      );
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DYNO Mapper MCP server running on stdio');
  }
}

const server = new DynoMapperServer();
server.run().catch(console.error);
