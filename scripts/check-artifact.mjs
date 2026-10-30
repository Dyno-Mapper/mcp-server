#!/usr/bin/env node
/**
 * Proves the split actually happened, at the level that ships.
 *
 * Unit tests cover behaviour, but the property this repository was split for is
 * about artifacts: the npm tarball must be the stdio server, with no hosted
 * code and no dependency on the unpublished core package, while the container
 * bundle must still be the complete hosted server. Those can only be checked
 * by looking at what `vp pack` and `npm pack` produce.
 *
 * Run after `npm run build`; `npm run verify` does that for you.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const problems = [];
const check = (condition, message) => {
  if (!condition) problems.push(message);
};

const readJson = (relative) =>
  JSON.parse(readFileSync(new URL(relative, root), 'utf8'));

const rootManifest = readJson('package.json');
const stdioManifest = readJson('packages/stdio/package.json');

// --- The bundle -----------------------------------------------------------

const bundleUrl = new URL('packages/stdio/dist/index.js', root);
let bundle = '';
try {
  bundle = readFileSync(bundleUrl, 'utf8');
} catch {
  problems.push(
    'packages/stdio/dist/index.js is missing — run `npm run build` first'
  );
}

if (bundle) {
  check(
    bundle.startsWith('#!/usr/bin/env node\n'),
    'the stdio bundle lost its shebang, so `bin` would not run'
  );

  check(
    !bundle.includes('__DYNOMAPPER_VERSION__'),
    'the version constant was not replaced by the build'
  );
  check(
    bundle.includes(rootManifest.version),
    `the bundle does not carry the root version ${rootManifest.version}`
  );

  // Markers of the hosted server, which has no business in the npm artifact.
  // "express" alone is not one: tool descriptions talk about regular
  // expressions, so the check is the hosted transport and its headers.
  for (const marker of [
    'StreamableHTTPServerTransport',
    'cloudfront-viewer-address',
    'createHostedApp',
  ]) {
    check(
      !bundle.includes(marker),
      `the stdio bundle contains hosted-only code: "${marker}"`
    );
  }

  // Core is inlined, but its third-party imports stay external, so every bare
  // specifier the bundle still reads must be installed by the consumer.
  const declared = Object.keys(stdioManifest.dependencies ?? {});
  for (const specifier of bareImports(bundle)) {
    if (specifier.startsWith('node:') || builtinModules.includes(specifier)) {
      continue;
    }
    check(
      declared.includes(packageName(specifier)),
      `the stdio bundle imports "${specifier}", which package.json does not list in dependencies`
    );
  }

  check(
    !declared.includes('@dynomapper/mcp-core'),
    'core must be a devDependency: a published package cannot depend on the unpublished one'
  );
}

// --- The hosted bundle is still complete ---------------------------------

try {
  const hosted = readFileSync(
    new URL('packages/http/dist/index.js', root),
    'utf8'
  );
  check(
    bareImports(hosted).includes('express'),
    'the hosted bundle no longer imports express — did it lose the HTTP server?'
  );
} catch {
  problems.push(
    'packages/http/dist/index.js is missing — run `npm run build` first'
  );
}

// --- The tarball ----------------------------------------------------------

const packed = JSON.parse(
  execFileSync(
    'npm',
    [
      'pack',
      '--dry-run',
      '--json',
      '--ignore-scripts',
      '--workspace',
      '@dynomapper/mcp-server',
    ],
    {
      cwd: root,
      encoding: 'utf8',
      // Packing writes to npm's cache even in dry-run mode, and CI images (and
      // sandboxes) do not always have a writable home directory.
      env: {
        ...process.env,
        npm_config_cache: fileURLToPath(
          new URL('node_modules/.cache/npm-pack', root)
        ),
      },
    }
  )
)[0];

const paths = packed.files.map((file) => file.path);
const allowed = /^(dist\/|package\.json$|README\.md$|LICENSE$)/;

for (const path of paths) {
  check(
    allowed.test(path),
    `the npm tarball ships a file the split should have excluded: "${path}"`
  );
}

check(
  paths.includes('dist/index.js'),
  'the npm tarball does not contain dist/index.js'
);
check(
  paths.some((path) => path.startsWith('dist/')),
  'the npm tarball ships no dist/ output'
);
check(
  !paths.some((path) => path.endsWith('.test.js') || path.includes('.test.')),
  'the npm tarball ships test files'
);
check(
  paths.includes('LICENSE'),
  'the npm tarball ships no LICENSE: a published package must carry its license text'
);

// --- Report ---------------------------------------------------------------

if (problems.length > 0) {
  console.error('Artifact check failed:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `Artifact check passed: ${paths.length} files in the tarball, ` +
    `version ${rootManifest.version} compiled into both bundles.`
);

/** Bare import specifiers in an ES module, including dynamic ones. */
function bareImports(source) {
  const specifiers = new Set();
  const patterns = [
    /(?:^|[\s;])import\s*(?:[^'"]*?\sfrom\s*)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /(?:^|[\s;])export\s+[^'"]*?\sfrom\s*['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
  }

  return [...specifiers];
}

/** `@scope/name/deep/path` -> `@scope/name`; `name/deep/path` -> `name`. */
function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@')
    ? `${parts[0]}/${parts[1]}`
    : (parts[0] ?? specifier);
}
