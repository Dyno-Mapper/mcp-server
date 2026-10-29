import { describe, expect, test } from 'vite-plus/test';
import { parseEntrypoint } from '@dynomapper/mcp-core';
import { SPEC, USAGE } from './cli.js';

/**
 * The image serves HTTP only. A deployment still passing the old stdio flag
 * has to be told where that server lives rather than started in a mode this
 * artifact cannot provide.
 */
describe('hosted entrypoint', () => {
  test('serves HTTP when asked for HTTP or nothing', () => {
    expect(parseEntrypoint([], {}, SPEC)).toBe('serve');
    expect(parseEntrypoint(['--http'], {}, SPEC)).toBe('serve');
  });

  test('refuses --stdio and points at the npm package', () => {
    expect(() => parseEntrypoint(['--stdio'], {}, SPEC)).toThrow(
      /@dynomapper\/mcp-server/
    );
    expect(() => parseEntrypoint([], { MCP_TRANSPORT: 'stdio' }, SPEC)).toThrow(
      /@dynomapper\/mcp-server/
    );
  });

  test('usage documents the hosted settings only', () => {
    expect(USAGE).toContain('MCP_RATE_LIMIT');
    expect(USAGE).not.toContain('DYNOMAPPER_API_KEY');
  });
});
