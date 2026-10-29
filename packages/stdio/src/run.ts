import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DynoMapperServer } from '@dynomapper/mcp-core';

/**
 * Serves MCP on stdin/stdout for the life of the process.
 *
 * The server itself comes from core; this function only supplies the transport
 * and the signal handling that a launched process needs.
 */
export async function runStdioServer(
  server = new DynoMapperServer()
): Promise<void> {
  const mcp = server.createServer();
  const transport = new StdioServerTransport();
  await mcp.connect(transport);

  process.on('SIGINT', async () => {
    await mcp.close();
    process.exit(0);
  });

  console.error('DYNO Mapper MCP server running on stdio');
}
