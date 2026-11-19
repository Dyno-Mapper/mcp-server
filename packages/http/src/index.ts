import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

import {
  DynoMapperServer,
  MAX_UPLOAD_BYTES,
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

  // Base64 spends four bytes to carry three, so the body a full-size upload
  // needs is larger than the file itself. A limit below that does not stop the
  // endpoint working — it refuses the largest uploads with a 413 mid-call —
  // which is why this is said now rather than discovered by an agent.
  const neededForLargestUpload = Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 4096;
  if (config.maxBodyBytes < neededForLargestUpload) {
    console.error(
      `[http] warning: MCP_MAX_BODY_BYTES is ${config.maxBodyBytes} bytes, below the ` +
        `${neededForLargestUpload} that a ${MAX_UPLOAD_BYTES}-byte upload needs as base64; ` +
        `a \`content\` upload above ${Math.floor((config.maxBodyBytes * 3) / 4)} bytes ` +
        'will be refused with 413. An upload by `url` is unaffected.'
    );
  }

  const server = new DynoMapperServer({
    requestTimeoutMs: config.requestTimeoutMs,
    log: (line) => console.error(line),
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
