import type { EntrypointSpec } from '@dynomapper/mcp-core';

export const SPEC: EntrypointSpec = {
  transport: 'http',
  otherArtifact:
    'The stdio server is published on npm as `@dynomapper/mcp-server`; ' +
    'run it with `npx -y @dynomapper/mcp-server`.',
};

export const USAGE = `Usage: dynomapper-mcp-http

  Serve MCP over Streamable HTTP at POST /mcp, statelessly. Every request must
  carry its own Authorization: Bearer <personal access token>.

Environment:
  MCP_PORT, MCP_HOST, MCP_ALLOWED_HOSTS, MCP_ALLOWED_ORIGINS, MCP_TRUST_PROXY,
  MCP_RATE_LIMIT, MCP_RATE_BURST, MCP_MAX_BODY_BYTES, MCP_MAX_CONCURRENCY,
  MCP_REQUEST_TIMEOUT_MS, MCP_JSON_RESPONSES.
  See HOSTING.md for what each one does.

  --http is accepted for compatibility. --stdio belongs to the npm package,
  which speaks stdio; this server refuses it rather than pretending.`;
