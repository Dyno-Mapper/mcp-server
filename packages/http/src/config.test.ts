import { describe, expect, test } from 'vite-plus/test';
import { DEFAULT_AUTHORIZATION_SERVER, readHttpConfig } from './config.js';

describe('MCP_PUBLIC_URL', () => {
  test('is unset by default, so the origin comes from each request', () => {
    expect(readHttpConfig({}).publicUrl).toBe('');
  });

  test('keeps an origin and drops the trailing slash', () => {
    const config = readHttpConfig({
      MCP_PUBLIC_URL: 'https://mcp.example.com/',
    });

    expect(config.publicUrl).toBe('https://mcp.example.com');
  });

  test('refuses an address that carries a path', () => {
    expect(() =>
      readHttpConfig({ MCP_PUBLIC_URL: 'https://mcp.example.com/mcp' })
    ).toThrow(/origin/);
  });

  test('refuses anything that is not an absolute http(s) URL', () => {
    for (const value of [
      'mcp.example.com',
      'ftp://mcp.example.com',
      'https://mcp.example.com/?x=1',
      'https://mcp.example.com/#fragment',
      'https://user:secret@mcp.example.com',
    ]) {
      expect(() => readHttpConfig({ MCP_PUBLIC_URL: value })).toThrow(
        /MCP_PUBLIC_URL/
      );
    }
  });
});

describe('MCP_AUTHORIZATION_SERVER', () => {
  test('defaults to production', () => {
    expect(readHttpConfig({}).authorizationServer).toBe(
      DEFAULT_AUTHORIZATION_SERVER
    );
  });

  test('normalises a trailing slash', () => {
    const config = readHttpConfig({
      MCP_AUTHORIZATION_SERVER: 'https://api.staging.example.com/',
    });

    expect(config.authorizationServer).toBe('https://api.staging.example.com');
  });

  test('refuses a value that is not an absolute http(s) URL', () => {
    expect(() =>
      readHttpConfig({ MCP_AUTHORIZATION_SERVER: 'api.example.com' })
    ).toThrow(/MCP_AUTHORIZATION_SERVER/);
  });
});
