import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite-plus';

// The version is authored once, in the repository root manifest, and compiled
// into the bundle: a single-file artifact has no reliable path back to a
// package.json, and a stale copy would make the tarball lie about itself.
const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
) as { version: string };

const define = { __DYNOMAPPER_VERSION__: JSON.stringify(version) };

export default defineConfig({
  // Also used by the tests, which run without a bundle.
  define,
  pack: {
    entry: ['src/index.ts'],
    format: 'esm',
    platform: 'node',
    outDir: 'dist',
    clean: true,
    // tsdown would otherwise emit `dist/index.mjs` for a node platform, and
    // the bin path, the Dockerfile and every document say `dist/index.js`.
    fixedExtension: false,
    deps: {
      // Core is source-only and never published, so it is inlined instead of
      // externalized like a real dependency. Everything else stays a bare
      // import and is therefore listed in package.json dependencies, because
      // the bundle needs it installed at runtime.
      alwaysBundle: ['@dynomapper/mcp-core'],
    },
    define,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
