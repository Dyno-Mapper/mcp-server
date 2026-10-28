import { readFileSync } from 'node:fs';

/**
 * The version reported in MCP server metadata and by `/health`.
 *
 * Read from the package manifest so the published tarball and a checkout
 * report the same number.
 */
export function packageVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    );
    return packageJson.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
