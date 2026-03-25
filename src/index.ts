#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Basic DYNO Mapper MCP Server implementation.
 */
class DynoMapperServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "@dynomapper/mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    /**
     * List available tools.
     * Includes a sample tool for verification.
     */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "sample_tool",
            description: "A sample tool to verify the DYNO Mapper MCP server is working",
            inputSchema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "A message to echo back",
                },
              },
              required: ["message"],
            },
          },
        ],
      };
    });

    /**
     * Handle tool calls.
     */
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === "sample_tool") {
        const args = z
          .object({
            message: z.string(),
          })
          .parse(request.params.arguments);

        return {
          content: [
            {
              type: "text",
              text: `DYNO Mapper MCP Server received: ${args.message}`,
            },
          ],
        };
      }

      throw new Error(`Tool not found: ${request.params.name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("DYNO Mapper MCP server running on stdio");
  }
}

const server = new DynoMapperServer();
server.run().catch(console.error);
