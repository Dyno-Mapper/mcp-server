import { describe, expect, test } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { packageVersion } from './version.js';

/**
 * The version is authored once, in the repository root, and every consumer
 * repeats it: `serverInfo`, `/health`, both bundles and the tarball. A mismatch
 * is the kind of thing nobody notices until a client reports the wrong number.
 */
describe('packageVersion', () => {
  test('matches the version authored at the repository root', () => {
    const root = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
    );

    expect(packageVersion()).toBe(root.version);
  });

  test('is a plain semver string', () => {
    expect(packageVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
