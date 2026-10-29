import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

import {
  DynoMapperServer,
  packageVersion,
  parseEntrypoint,
  UsageError,
} from '@dynomapper/mcp-core';
import { readHttpConfig } from './config.js';
import { startHostedServer } from './app.js';
import { SPEC, USAGE } from './cli.js';

/**
 * The hosted entrypoint: Streamable HTTP, and nothing else.
 *
 * `parseEntrypoint` is here for the same reason as in the stdio binary — a
 * deployment still passing `--stdio` is told which artifact speaks it — but
 * `--http` is accepted, because it names what this process already does.
 */
async function main(): Promise<void> {
  let action;
  try {
    action = parseEntrypoint(process.argv.slice(2), process.env, SPEC);
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(error.message);
      console.error(`\n${USAGE}`);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  if (action === 'help') {
    console.log(USAGE);
    return;
  }

  let config;
  try {
    config = readHttpConfig();
  } catch (error) {
    console.error(`Invalid configuration: ${(error as Error).message}`);
    process.exitCode = 1;
    return;
  }

  if (
    process.env.DYNOMAPPER_API_KEY ||
    process.env.MCP_API_KEY ||
    process.env.API_KEY
  ) {
    console.error(
      '[http] warning: DYNOMAPPER_API_KEY is set but ignored in hosted mode; ' +
        'every request must carry its own Authorization header'
    );
  }

  const server = new DynoMapperServer({
    requestTimeoutMs: config.requestTimeoutMs,
  });

  await startHostedServer({
    config,
    createServer: () => server.createServer({ hosted: true }),
    version: packageVersion(),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
