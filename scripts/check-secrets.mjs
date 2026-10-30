#!/usr/bin/env node
/**
 * Fails the build when a credential reaches the working tree.
 *
 * The repository is public, so the expensive mistake is not a leaked token in
 * code we chose to publish: it is a token that arrives later, in a file nobody
 * thought about. The check therefore reads the files git would actually commit
 * — tracked files plus untracked ones that are not ignored — which catches a
 * stray `.env.local` before `git add -A` does.
 *
 * It does not read history. That was audited once and was clean, and scanning
 * every blob on every CI run buys nothing a tree scan does not.
 *
 * A hit is printed redacted. A scanner that echoes the secret into a CI log has
 * moved the problem rather than found it.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const cwd = fileURLToPath(root);

/** Generated or vendored files where a match is noise, not a leak. */
const skip = new Set(['package-lock.json', 'resource/api.json']);

/**
 * This file names the patterns it hunts, so it is the one file where a match
 * means the scanner is working, not that a secret is present.
 */
const self = 'scripts/check-secrets.mjs';

/**
 * Values that are obviously not live credentials. They exempt every rule, so a
 * documented example key (`AKIA…EXAMPLE`) does not fail the build.
 */
const placeholders = /your_|example|placeholder|dummy|fake|sample|xxx|<|\$\{/i;

const rules = [
  {
    name: 'an AWS access key id',
    re: /\b(?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}\b/g,
  },
  {
    name: 'a GitHub token',
    re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/g,
  },
  {
    name: 'a GitHub fine-grained token',
    re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g,
  },
  {
    name: 'a Slack token',
    re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    name: 'a Google API key',
    re: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    name: 'a private key',
    re: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g,
  },
  {
    name: 'a JSON Web Token',
    re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  },
  {
    // A secret assigned to a quoted string: `apiKey: '…'`, `SECRET="…"`.
    name: 'a hard-coded credential',
    re: /(?:password|passwd|secret|api[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key)\s*[:=]\s*['"`]([^'"`\n]{16,})['"`]/gi,
    value: 1,
  },
  {
    // The same, unquoted, which is how a .env file is written.
    name: 'a hard-coded credential',
    re: /^\s*[A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_?KEY)[A-Z0-9_]*\s*=\s*(\S{16,})\s*$/gim,
    value: 1,
  },
];

const problems = [];

for (const file of filesToScan()) {
  if (skip.has(file) || file === self) continue;

  let source;
  try {
    source = readFileSync(new URL(file, root), 'utf8');
  } catch {
    continue;
  }
  // A binary file has no lines worth reporting and no secret we can read.
  if (source.includes('\u0000')) continue;

  const lines = source.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const rule of rules) {
      rule.re.lastIndex = 0;
      const match = rule.re.exec(line);
      if (!match) continue;

      const value = rule.value ? match[rule.value] : match[0];
      if (placeholders.test(value)) continue;

      problems.push(
        `${file}:${index + 1} contains ${rule.name} (${redact(value)})`
      );
      // One report per line: a quoted credential matches both assignment rules,
      // and the line is the unit a human edits either way.
      break;
    }
  }
}

// --- Report ---------------------------------------------------------------

if (problems.length > 0) {
  console.error('Secret check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    '\nRemove the value, or rotate it if it was ever committed. To accept a ' +
      'documented example, make it read as one (`your_`, `example`, `xxx`).'
  );
  process.exit(1);
}

console.log('Secret check passed: no credential-shaped value in the tree.');

/**
 * Files git would commit: tracked, plus untracked and not ignored.
 */
function filesToScan() {
  const list = (args) =>
    execFileSync('git', [...args, '--exclude-standard', '-z'], {
      cwd,
      encoding: 'utf8',
    })
      .split('\u0000')
      .filter(Boolean);

  // `--exclude-standard` is only meaningful for --others, but git accepts it
  // for --cached too, where it is a no-op. Listing tracked files with it keeps
  // one code path and makes the intent of the pair obvious.
  return [
    ...new Set([
      ...list(['ls-files', '--cached']),
      ...list(['ls-files', '--others']),
    ]),
  ];
}

/** Enough to find the value, not enough to use it. */
function redact(value) {
  return `${value.slice(0, 4)}…, ${value.length} chars`;
}
