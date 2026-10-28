#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

import { DynoMapperServer } from './server.js';
import { readHttpConfig } from './config.js';
import { startHostedServer } from './http.js';
import { packageVersion } from './version.js';
import { resolveTransport, USAGE, UsageError } from './cli.js';

async function main() {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return;
  }

  let transport;
  try {
    transport = resolveTransport(argv, process.env);
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

  if (transport === 'stdio') {
    await new DynoMapperServer().run();
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
