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
  test('sizes the JSON body for a tool call, not for a base64 file', () => {
    // Files no longer travel in a request body: they are PUT to an upload
    // ticket. What is left at this size is a verbose bulk call, so the default
    // is kilobytes of headroom rather than the 87.4 MB a 64 MB file needed as
    // base64.
    expect(readHttpConfig({}).maxBodyBytes).toBe(4 * 1024 * 1024);
  });

  test('no longer treats a large body as an upload', () => {
    // `MCP_UPLOAD_GATE_BYTES` gated a body by its declared size, which only
    // made sense while an upload was a JSON body. It is gone, and a deployment
    // still setting it is not failed for it — an old env file is not a bug.
    const config = readHttpConfig({ MCP_UPLOAD_GATE_BYTES: '1024' });

    expect(config).not.toHaveProperty('uploadGateBytes');
  });

  test('allows two uploads in flight, per caller and in total', () => {
    expect(readHttpConfig({}).maxUploadConcurrency).toBe(2);
  });

  test('has no secret until an operator sets one, and a ten-minute ticket', () => {
    const config = readHttpConfig({});

    // Refusing at the tool rather than failing to start is what makes the
    // rollout order safe: the secret ships before the image that needs it.
    expect(config.uploadSecret).toBe('');
    expect(config.uploadTicketTtlMs).toBe(600_000);
    expect(config.uploadTimeoutMs).toBe(300_000);
    expect(config.uploadIdleTimeoutMs).toBe(60_000);
  });

  test('trims the secret, because a trailing newline is not part of it', () => {
    expect(
      readHttpConfig({
        MCP_UPLOAD_SECRET: '  example_passphrase_of_32_chars_ok  ',
      }).uploadSecret
    ).toBe('example_passphrase_of_32_chars_ok');
  });

  test('reads the overrides an operator is likely to set', () => {
    const config = readHttpConfig({
      MCP_MAX_BODY_BYTES: '1048576',
      MCP_MAX_UPLOAD_CONCURRENCY: '1',
      MCP_UPLOAD_TICKET_TTL_MS: '60000',
      MCP_UPLOAD_TIMEOUT_MS: '120000',
      MCP_UPLOAD_IDLE_TIMEOUT_MS: '15000',
      DYNOMAPPER_API_URL: 'https://api.example.com/',
    });

    expect(config.maxBodyBytes).toBe(1_048_576);
    expect(config.maxUploadConcurrency).toBe(1);
    expect(config.uploadTicketTtlMs).toBe(60_000);
    expect(config.uploadTimeoutMs).toBe(120_000);
    expect(config.uploadIdleTimeoutMs).toBe(15_000);
    // Trimmed to an origin, so the route's own path join is unambiguous.
    expect(config.apiBaseUrl).toBe('https://api.example.com');
  });

  test('refuses a value that cannot mean what it says', () => {
    expect(() => readHttpConfig({ MCP_MAX_UPLOAD_CONCURRENCY: '0' })).toThrow(
      /MCP_MAX_UPLOAD_CONCURRENCY/
    );
    expect(() => readHttpConfig({ MCP_UPLOAD_TICKET_TTL_MS: 'soon' })).toThrow(
      /MCP_UPLOAD_TICKET_TTL_MS/
    );
    expect(() =>
      readHttpConfig({ DYNOMAPPER_API_URL: 'api.example.com' })
    ).toThrow(/DYNOMAPPER_API_URL/);
  });
});
