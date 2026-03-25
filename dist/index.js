#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
class DynoMapperServer {
    server;
    constructor() {
        this.server = new McpServer({
            name: "@dynomapper/mcp-server",
            version: "0.1.0",
        });
        this.setupHandlers();
        this.server.server.onerror = (error) => console.error("[MCP Error]", error);
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupHandlers() {
        /**
         * Sample tool to verify the DYNO Mapper MCP server is working.
         */
        this.server.registerTool("sample_tool", {
            description: "A sample tool to verify the DYNO Mapper MCP server is working",
            inputSchema: {
                message: z.string().describe("A message to echo back"),
            },
        }, async (args) => {
            return {
                content: [
                    {
                        type: "text",
                        text: `DYNO Mapper MCP Server received: ${args.message}`,
                    },
                ],
            };
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
