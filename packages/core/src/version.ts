import { readFileSync } from 'node:fs';

/**
 * The version reported in MCP server metadata and by `/health`.
 *
 * A shipped bundle has only the compiled-in constant: `dist/index.js` is a
 * single file, so nothing on disk sits at a predictable distance from it, and
 * the tarball's own manifest is never consulted. Each app's `vite.config.ts`
 * defines the constant from the version authored in the repository root.
 *
 * A run from source (`npm run dev`, `npm test`) has no bundler to inject
 * anything, so it falls back to that root manifest. The path is written for
 * `packages/core/src/version.ts`; the bundle never reaches it, because the
 * bundler has already replaced the constant with a string literal.
 */
declare const __DYNOMAPPER_VERSION__: string | undefined;

export function packageVersion(): string {
  if (typeof __DYNOMAPPER_VERSION__ === 'string') {
    return __DYNOMAPPER_VERSION__;
  }

  try {
    const rootManifest = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
    );
    return rootManifest.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
