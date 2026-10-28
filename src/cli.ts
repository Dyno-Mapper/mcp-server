/**
 * Command-line and environment transport selection.
 *
 * Kept apart from the entrypoint so the rules that decide stdio versus hosted
 * mode can be tested without starting a listener.
 */

export type Transport = 'stdio' | 'http';

export const USAGE = `Usage: dynomapper-mcp [--http | --stdio]

  --stdio   Serve MCP over stdio, the transport an MCP client launches (default).
  --http    Serve MCP over Streamable HTTP at POST /mcp.

Environment:
  MCP_TRANSPORT=stdio|http   Select the transport without a flag.
  See HOSTING.md for the hosted settings and the endpoint's requirements.`;

/** A command line this program refuses to run. */
export class UsageError extends Error {}

const KNOWN_FLAGS = new Set(['--http', '--stdio', '--sse', '--help', '-h']);

export function resolveTransport(
  argv: string[],
  env: NodeJS.ProcessEnv
): Transport {
  const unknown = argv.filter(
    (argument) => argument.startsWith('-') && !KNOWN_FLAGS.has(argument)
  );
  if (unknown.length > 0) {
    throw new UsageError(`Unknown option: ${unknown.join(', ')}`);
  }

  const requested = (env.MCP_TRANSPORT ?? '').trim().toLowerCase();

  // SSE is gone, and an operator upgrading still passing the old spelling has
  // to be told what replaced it rather than served stdio, which a client
  // launched this binary to speak.
  if (argv.includes('--sse') || requested === 'sse') {
    throw new UsageError(
      'The SSE transport was removed in 0.2.0.\n' +
        'Streamable HTTP is served over --http (or MCP_TRANSPORT=http) at POST /mcp.'
    );
  }

  if (requested !== '' && requested !== 'stdio' && requested !== 'http') {
    throw new UsageError(
      `MCP_TRANSPORT must be "stdio" or "http", got "${env.MCP_TRANSPORT}"`
    );
  }

  const flag: Transport | undefined = argv.includes('--http')
    ? 'http'
    : argv.includes('--stdio')
      ? 'stdio'
      : undefined;

  if (flag && requested !== '' && flag !== requested) {
    throw new UsageError(`--${flag} conflicts with MCP_TRANSPORT=${requested}`);
  }

  if (flag) {
    return flag;
  }

  return requested === 'http' ? 'http' : 'stdio';
}
