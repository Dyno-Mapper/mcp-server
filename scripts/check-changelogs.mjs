#!/usr/bin/env node
/**
 * Keeps the two changelogs, and the version they describe, in step.
 *
 * The repository records its own change in `CHANGELOG.md`; the npm package
 * records what a consumer sees in `packages/stdio/CHANGELOG.md`, which ships
 * inside the tarball. Two files written by hand drift: one gets a release and
 * the other does not, or the package file starts describing the hosted image
 * its reader cannot run. This check is the thing that notices.
 *
 * It covers text only. That the tarball actually carries its changelog is
 * `check:artifact`'s job, because it already packs the package.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const repositoryChangelog = 'CHANGELOG.md';
const packageChangelog = 'packages/stdio/CHANGELOG.md';

/**
 * Settings and filenames only the hosted artifact has. The package changelog
 * naming one means it is describing a file its reader cannot open or a setting
 * its binary does not read.
 *
 * Deliberately narrow: `MCP_TRANSPORT` is absent because the refusals are what
 * a consumer sees, and the image itself may be named as an artifact.
 */
const hostedOnly = [
  'HOSTING.md',
  'Dockerfile',
  'MCP_TRUST_PROXY',
  'MCP_REQUEST_TIMEOUT_MS',
  'MCP_JSON_RESPONSES',
  'MCP_PUBLIC_URL',
  'MCP_AUTHORIZATION_SERVER',
  'MCP_HOST',
  'MCP_PORT',
  'Mcp-Session-Id',
  'CloudFront',
  'X-Forwarded-For',
  'WWW-Authenticate',
  '/.well-known/',
  'SIGTERM',
];

/**
 * Words a package changelog has no use for. Whoever reads that file installs a
 * stdio binary: how the image is built, released or deployed is not their
 * change, and the repository's own changelog is not shipped with it.
 *
 * Matched on word boundaries, because "CI" is a substring of "ASCII".
 */
const repositoryOnly = [
  { what: 'CI', pattern: /\bCI\b/i },
  { what: 'hosting', pattern: /\bhost(?:ed|ing)\b/i },
  { what: 'the repository changelog', pattern: /\brepository changelog\b/i },
  { what: 'an image', pattern: /\b(?:docker|container) image\b/i },
  { what: 'Bitbucket', pattern: /\bBitbucket\b/i },
  { what: 'GitHub Actions', pattern: /\bGitHub Actions\b/i },
];

const problems = [];
const check = (condition, message) => {
  if (!condition) problems.push(message);
};

/** File contents with Windows newlines normalised away, or null if missing. */
const readText = (relative) => {
  try {
    return readFileSync(new URL(relative, root), 'utf8').replace(/\r\n/g, '\n');
  } catch {
    return null;
  }
};

const readJson = (relative) =>
  JSON.parse(readFileSync(new URL(relative, root), 'utf8'));

// --- One version across the repository ------------------------------------

const rootManifest = readJson('package.json');
const { version } = rootManifest;

check(
  typeof version === 'string' && version.length > 0,
  'the root package.json has no version'
);

/** Every workspace directory named by the root manifest's globs. */
const workspaceDirs = [];
for (const pattern of rootManifest.workspaces ?? []) {
  if (!pattern.endsWith('/*')) {
    workspaceDirs.push(pattern);
    continue;
  }
  const base = pattern.slice(0, -2);
  for (const entry of readdirSync(new URL(`${base}/`, root), {
    withFileTypes: true,
  })) {
    if (entry.isDirectory()) workspaceDirs.push(`${base}/${entry.name}`);
  }
}

const manifests = [{ path: 'package.json', version }];
for (const dir of workspaceDirs) {
  const path = `${dir}/package.json`;
  if (!existsSync(new URL(path, root))) continue;
  const manifest = readJson(path);
  manifests.push({ path, version: manifest.version });
  check(
    manifest.version === version,
    `${path} is version ${manifest.version}, but the root manifest is ${version}: bump them together`
  );
}

// --- The two changelogs ---------------------------------------------------

const dates = new Map();

for (const path of [repositoryChangelog, packageChangelog]) {
  const text = readText(path);
  if (text === null) {
    problems.push(`${path} is missing: this repository keeps two changelogs`);
    continue;
  }

  const lines = text.split('\n');
  check(lines[0] === '# Changelog', `${path} does not open with "# Changelog"`);

  const headings = [];
  for (const [index, line] of lines.entries()) {
    const match = /^## \[([^\]]+)\](.*)$/.exec(line);
    if (match) {
      headings.push({ version: match[1], rest: match[2], line: index + 1 });
    }
  }

  const first = headings[0];
  check(
    first?.version === version,
    `${path} opens with ${first ? `version ${first.version}` : 'no version heading'}, but the root manifest is ${version}`
  );

  const current = headings.find((heading) => heading.version === version);
  if (!current) {
    problems.push(`${path} has no entry for ${version}`);
    continue;
  }

  const count = headings.filter(
    (heading) => heading.version === version
  ).length;
  check(
    count === 1,
    `${path} has ${count} entries for ${version}: a version is written up once`
  );

  const dated = /^ - (\d{4}-\d{2}-\d{2})$/.exec(current.rest);
  check(
    Boolean(dated),
    `${path}:${current.line} must date ${version} as "## [${version}] - YYYY-MM-DD"`
  );
  if (dated) dates.set(path, dated[1]);
}

check(
  dates.get(repositoryChangelog) === undefined ||
    dates.get(packageChangelog) === undefined ||
    dates.get(repositoryChangelog) === dates.get(packageChangelog),
  `the two changelogs date ${version} differently: ` +
    `${dates.get(repositoryChangelog)} and ${dates.get(packageChangelog)}`
);

const repositoryText = readText(repositoryChangelog);
if (repositoryText !== null) {
  check(
    repositoryText.includes(packageChangelog),
    `${repositoryChangelog} no longer points at ${packageChangelog}`
  );
}

// --- The package changelog stays consumer-facing --------------------------

const packageText = readText(packageChangelog);
if (packageText !== null) {
  const lines = packageText.split('\n');
  for (const token of hostedOnly) {
    const index = lines.findIndex((line) => line.includes(token));
    if (index !== -1) {
      problems.push(
        `${packageChangelog}:${index + 1} names "${token}", which only the hosted image has; hosted detail belongs in ${repositoryChangelog}`
      );
    }
  }
  for (const rule of repositoryOnly) {
    const index = lines.findIndex((line) => rule.pattern.test(line));
    if (index !== -1) {
      problems.push(
        `${packageChangelog}:${index + 1} mentions ${rule.what}; this file ships on its own and covers the package only`
      );
    }
  }
  const escaping = lines.findIndex((line) => /\]\(\.\.\//.test(line));
  if (escaping !== -1) {
    problems.push(
      `${packageChangelog}:${escaping + 1} links outside the package: a shipped changelog has to stand alone`
    );
  }
}

// --- Report ---------------------------------------------------------------

if (problems.length > 0) {
  console.error('Changelog check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `Changelog check passed: version ${version} in both changelogs and ` +
    `${manifests.length} manifests.`
);
