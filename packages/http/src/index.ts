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
import { publicOrigin } from './protected-resource.js';
import { uploadTicketTool } from './upload/create_upload_ticket.js';
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

  // Uploads are refused rather than broken when the secret is missing: `/mcp`
  // keeps working, which is what makes the rollout order safe — the secret is
  // shipped before the image that needs it.
  if (config.uploadSecret.length === 0) {
    console.error(
      '[http] warning: MCP_UPLOAD_SECRET is unset, so `create_upload_ticket` ' +
        'refuses and no file can be uploaded; every other tool works.'
    );
  } else if (config.uploadSecret.length < 32) {
    console.error(
      `[http] warning: MCP_UPLOAD_SECRET is ${config.uploadSecret.length} characters; ` +
        'use at least 32 so the sealed upload URL is not worth attacking.'
    );
  }

  const server = new DynoMapperServer({
    baseUrl: config.apiBaseUrl,
    requestTimeoutMs: config.requestTimeoutMs,
    log: (line) => console.error(line),
  });

  const extraTools = [uploadTicketTool(config)];

  await startHostedServer({
    config,
    createServer: (request) =>
      server.createServer({
        hosted: true,
        extraTools,
        ...(publicOrigin(request, config)
          ? { requestOrigin: publicOrigin(request, config) }
          : {}),
      }),
    version: packageVersion(),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
