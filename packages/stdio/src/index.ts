#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

import { parseEntrypoint, UsageError } from '@dynomapper/mcp-core';
import { runStdioServer } from './run.js';
import { SPEC, USAGE } from './cli.js';

/**
 * The stdio entrypoint: the only transport this artifact can serve.
 *
 * There is no dispatch to perform. `parseEntrypoint` exists so a command line
 * or environment still carrying `--http` or `MCP_TRANSPORT=http` fails with a
 * pointer to the container image instead of silently speaking the wrong
 * protocol at a client that expects HTTP.
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

  await runStdioServer();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
