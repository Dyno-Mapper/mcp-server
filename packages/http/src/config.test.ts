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

describe('upload settings', () => {
  test('frames a 64 MB file, which base64 sends as 87.4 MB of JSON', () => {
    // The largest file any purpose accepts, plus the room the base64 envelope
    // needs on top of it. A limit below this refuses the biggest uploads with
    // a 413 rather than accepting them.
    const largestFile = 64 * 1024 * 1024;
    const needed = Math.ceil((largestFile * 4) / 3);

    expect(readHttpConfig({}).maxBodyBytes).toBeGreaterThan(needed);
  });

  test('allows two uploads per caller and charges one above 8 MiB', () => {
    const config = readHttpConfig({});

    expect(config.maxUploadConcurrency).toBe(2);
    expect(config.uploadGateBytes).toBe(8 * 1024 * 1024);
  });

  test('reads the overrides an operator is likely to set', () => {
    const config = readHttpConfig({
      MCP_MAX_BODY_BYTES: '1048576',
      MCP_MAX_UPLOAD_CONCURRENCY: '1',
      MCP_UPLOAD_GATE_BYTES: '1024',
    });

    expect(config.maxBodyBytes).toBe(1_048_576);
    expect(config.maxUploadConcurrency).toBe(1);
    expect(config.uploadGateBytes).toBe(1024);
  });

  test('refuses a value that cannot mean what it says', () => {
    expect(() => readHttpConfig({ MCP_MAX_UPLOAD_CONCURRENCY: '0' })).toThrow(
      /MCP_MAX_UPLOAD_CONCURRENCY/
    );
    expect(() => readHttpConfig({ MCP_UPLOAD_GATE_BYTES: 'lots' })).toThrow(
      /MCP_UPLOAD_GATE_BYTES/
    );
  });
});
