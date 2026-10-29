/**
 * What each binary does with the flags and variables that used to select a
 * transport.
 *
 * There is no dispatch left to perform: `packages/stdio` speaks stdio and
 * `packages/http` serves HTTP, full stop. What remains is the compatibility
 * rule both entrypoints share, kept here so the two cannot drift apart:
 *
 *   - the flag or value naming *your own* transport is accepted as a no-op,
 *     because it describes what the binary already does;
 *   - the other transport's flag or value is refused, and the error names the
 *     artifact that serves it;
 *   - `--sse` keeps its 0.2.0 removal message;
 *   - an unknown flag is always an error, never silently ignored.
 */

export type Transport = 'stdio' | 'http';

/** A command line or environment this program refuses to run. */
export class UsageError extends Error {}

export interface EntrypointSpec {
  /** The transport this binary serves. */
  transport: Transport;
  /**
   * What to do instead, as a sentence. Typed by the app because only it knows
   * how the other transport is distributed — npm or a container image.
   */
  otherArtifact: string;
}

/** `help` means "print usage and exit 0"; `serve` means "start the server". */
export type EntrypointAction = 'help' | 'serve';

const SSE_REMOVED =
  'The SSE transport was removed in 0.2.0.\n' +
  'Streamable HTTP is served over POST /mcp by the hosted artifact.';

export function parseEntrypoint(
  argv: string[],
  env: NodeJS.ProcessEnv,
  spec: EntrypointSpec
): EntrypointAction {
  const other: Transport = spec.transport === 'stdio' ? 'http' : 'stdio';
  const ownFlag = `--${spec.transport}`;
  const otherFlag = `--${other}`;
  const knownFlags = new Set([ownFlag, otherFlag, '--sse', '--help', '-h']);

  if (argv.includes('--help') || argv.includes('-h')) {
    return 'help';
  }

  const unknown = argv.filter(
    (argument) => argument.startsWith('-') && !knownFlags.has(argument)
  );
  if (unknown.length > 0) {
    throw new UsageError(`Unknown option: ${unknown.join(', ')}`);
  }

  const requested = (env.MCP_TRANSPORT ?? '').trim().toLowerCase();

  // An operator upgrading from 0.1.x still has the old spelling somewhere, and
  // the message has to explain what replaced it rather than serve something
  // the client did not ask for.
  if (argv.includes('--sse') || requested === 'sse') {
    throw new UsageError(SSE_REMOVED);
  }

  if (requested !== '' && requested !== 'stdio' && requested !== 'http') {
    throw new UsageError(
      `MCP_TRANSPORT must be "stdio" or "http", got "${env.MCP_TRANSPORT}"`
    );
  }

  if (argv.includes(otherFlag)) {
    throw new UsageError(notServed(otherFlag, other, spec));
  }

  if (requested !== '' && requested !== spec.transport) {
    throw new UsageError(notServed(`MCP_TRANSPORT=${requested}`, other, spec));
  }

  return 'serve';
}

function notServed(
  source: string,
  other: Transport,
  spec: EntrypointSpec
): string {
  return (
    `${source} asks for the ${other} transport, and this binary does not serve it: ` +
    `it is the ${spec.transport} entrypoint. ${spec.otherArtifact}`
  );
}
