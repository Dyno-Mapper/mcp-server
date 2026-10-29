import type { EntrypointSpec } from '@dynomapper/mcp-core';

export const SPEC: EntrypointSpec = {
  transport: 'stdio',
  otherArtifact:
    'The Streamable HTTP server ships as a container image: build it with ' +
    '`docker build -t dynomapper-mcp .`, or read HOSTING.md.',
};

export const USAGE = `Usage: dynomapper-mcp

  Serve MCP over stdio, the transport an MCP client launches. This binary
  answers stdin and stdout only.

Environment:
  DYNOMAPPER_API_KEY   Personal access token used by every tool call.
  DYNOMAPPER_API_URL   API base URL. Defaults to https://api.dynomapper.com.

  --stdio is accepted for compatibility. --http belongs to the hosted server,
  which is a container image; this binary refuses it rather than pretending.
  See HOSTING.md for the hosted settings.`;
