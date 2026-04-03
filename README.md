# DYNO Mapper MCP Server

An MCP (Model Context Protocol) server for the DYNO Mapper Public API.

## Features

- Exposes DYNO Mapper functionality as tools for AI agents.
- Follows the Model Context Protocol (MCP).
- Built with TypeScript and Node.js.

## Installation

```bash
npm install @dynomapper/mcp-server
```

## Configuration

To use this server with Claude or other MCP clients, you will need your DYNO Mapper API key.

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration file (e.g., `~/Library/Application\ Support/Claude/claude_desktop_config.json` or `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dynomapper": {
      "command": "npx",
      "args": ["-y", "@dynomapper/mcp-server"],
      "env": {
        "MCP_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Run locally:
   ```bash
   node dist/index.js
   ```

## License

MIT
