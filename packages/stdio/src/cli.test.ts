import { describe, expect, test } from 'vite-plus/test';
import { parseEntrypoint } from '@dynomapper/mcp-core';
import { SPEC, USAGE } from './cli.js';

/**
 * The binary is stdio-only, so the only interesting behaviour is what it does
 * with a command line that asks for the other transport: it must refuse, and
 * it must say where the hosted server lives.
 */
describe('stdio entrypoint', () => {
  test('serves stdio when asked for stdio or nothing', () => {
    expect(parseEntrypoint([], {}, SPEC)).toBe('serve');
    expect(parseEntrypoint(['--stdio'], {}, SPEC)).toBe('serve');
  });

  test('refuses --http and points at the container image', () => {
    expect(() => parseEntrypoint(['--http'], {}, SPEC)).toThrow(
      /container image/
    );
    expect(() => parseEntrypoint([], { MCP_TRANSPORT: 'http' }, SPEC)).toThrow(
      /container image/
    );
  });

  test('usage names only the settings this binary reads', () => {
    expect(USAGE).toContain('DYNOMAPPER_API_KEY');
    expect(USAGE).not.toContain('MCP_RATE_LIMIT');
  });
});
