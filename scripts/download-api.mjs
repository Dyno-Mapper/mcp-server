#!/usr/bin/env node
/**
 * Downloads the published OpenAPI reference into `resource/api.json`.
 *
 * The reference is the contract `tools.test.ts` checks the tool registry
 * against, and the copy in `resource/api.json` is a committed fixture so the
 * tests need no network. This command is the supported way to refresh it:
 * fetch, validate, pretty-print and replace atomically, so an interrupted run
 * cannot leave a truncated spec behind.
 */
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const DEFAULT_URL = 'https://api.dynomapper.com/documentation/json';
const DEFAULT_OUT = fileURLToPath(
  new URL('../resource/api.json', import.meta.url)
);
const TIMEOUT_MS = 30_000;
const HTTP_METHODS = new Set([
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
]);

const USAGE = `Usage: node scripts/download-api.mjs [options]
       npm run api:download [-- options]

Download the DYNO Mapper OpenAPI reference and write it to resource/api.json.

Options:
  --url <url>   Reference endpoint.
                Default: ${DEFAULT_URL}
  --out <file>  Destination file. Default: resource/api.json
  -h, --help    Print this message.`;

class UsageError extends Error {}

try {
  await main();
} catch (error) {
  if (error instanceof UsageError) {
    console.error(`api:download: ${error.message}`);
    console.error('Run `node scripts/download-api.mjs --help` for usage.');
    process.exitCode = 2;
  } else {
    console.error(`api:download: ${describe(error)}`);
    process.exitCode = 1;
  }
}

async function main() {
  const { values } = readOptions();

  if (values.help) {
    console.log(USAGE);
    return;
  }

  const url = parseUrl(values.url);
  if (!values.out) {
    throw new UsageError('--out requires a non-empty value');
  }
  const outPath = resolve(values.out);
  const display = displayPath(outPath);

  const spec = await fetchSpec(url);
  const { paths, operations } = summarize(spec);
  // Match the committed fixture: two-space indentation and no trailing
  // newline keep a refresh's diff to the lines that actually changed.
  const serialized = JSON.stringify(spec, null, 2);

  let previous = null;
  try {
    previous = await readFile(outPath, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw new Error(`could not read ${display}: ${describe(error)}`);
    }
  }

  if (previous === serialized) {
    console.log(`Downloaded ${url.href}`);
    console.log(
      `${display} is already current: ${paths} paths, ${operations} operations.`
    );
    return;
  }

  const before = previous === null ? null : count(previous);
  await writeAtomically(outPath, serialized);

  console.log(`Downloaded ${url.href}`);
  const change = before
    ? `${before.paths} → ${paths} paths, ` +
      `${before.operations} → ${operations} operations`
    : `${paths} paths, ${operations} operations`;
  console.log(
    `Wrote ${display}: ${change} (${Buffer.byteLength(serialized)} bytes).`
  );
}

function readOptions() {
  try {
    return parseArgs({
      options: {
        url: { type: 'string', default: DEFAULT_URL },
        out: { type: 'string', default: DEFAULT_OUT },
        help: { type: 'boolean', short: 'h', default: false },
      },
      strict: true,
      allowPositionals: false,
    });
  } catch (error) {
    throw new UsageError(error.message);
  }
}

function parseUrl(value) {
  if (!value) {
    throw new UsageError('--url requires a non-empty value');
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new UsageError(`invalid URL: ${value}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UsageError(`unsupported URL scheme: ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new UsageError('--url must not include credentials');
  }

  return url;
}

async function fetchSpec(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      throw new Error(
        `timed out after ${TIMEOUT_MS / 1000} seconds reading ${url.href}`
      );
    }
    throw new Error(`could not reach ${url.href}: ${describe(error)}`);
  }

  if (!response.ok) {
    const status =
      `${response.status}` +
      (response.statusText ? ` ${response.statusText}` : '');
    throw new Error(`${url.href} answered ${status}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.toLowerCase().includes('json')) {
    throw new Error(`${url.href} answered ${contentType}, not JSON`);
  }

  const body = await response.text();
  let spec;
  try {
    spec = JSON.parse(body);
  } catch (error) {
    throw new Error(
      `${url.href} did not return valid JSON: ${describe(error)}`
    );
  }

  validateSpec(spec, url);
  return spec;
}

function validateSpec(spec, url) {
  if (spec === null || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new Error(`${url.href} did not return an OpenAPI document`);
  }

  if (typeof spec.openapi !== 'string' || !spec.openapi.startsWith('3.')) {
    throw new Error(
      `${url.href} is not an OpenAPI 3 document ` +
        `(openapi is ${JSON.stringify(spec.openapi)})`
    );
  }

  if (
    spec.paths === null ||
    typeof spec.paths !== 'object' ||
    Array.isArray(spec.paths) ||
    Object.keys(spec.paths).length === 0
  ) {
    throw new Error(`${url.href} documents no paths`);
  }

  if (summarize(spec).operations === 0) {
    throw new Error(`${url.href} documents no operations`);
  }
}

function summarize(spec) {
  const pathItems = Object.values(spec.paths ?? {});
  let operations = 0;

  for (const item of pathItems) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }
    operations += Object.keys(item).filter((key) =>
      HTTP_METHODS.has(key.toLowerCase())
    ).length;
  }

  return { paths: pathItems.length, operations };
}

function count(text) {
  try {
    return summarize(JSON.parse(text));
  } catch {
    return null;
  }
}

async function writeAtomically(outPath, contents) {
  const temp = `${outPath}.${process.pid}.tmp`;

  try {
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(temp, contents, 'utf8');
    await rename(temp, outPath);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => undefined);
    throw new Error(
      `could not write ${displayPath(outPath)}: ${describe(error)}`
    );
  }
}

function displayPath(outPath) {
  const shown = relative(process.cwd(), outPath);
  return shown === '' || shown.startsWith('..') ? outPath : shown;
}

function describe(error) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause = error.cause;
  if (
    cause !== null &&
    typeof cause === 'object' &&
    'code' in cause &&
    typeof cause.code === 'string'
  ) {
    return `${error.message} (${cause.code})`;
  }

  return error.message;
}
