import { afterEach, describe, expect, test } from 'vite-plus/test';
import { createServer as createHttpServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { DynoMapperServer } from '@dynomapper/mcp-core';
import { readHttpConfig, type HttpConfig } from './config.js';
import { createHostedApp } from './app.js';

const USER = {
  id: 7,
  accountId: 11,
  email: 'user@example.com',
  name: 'Test User',
  company: '',
  thirdPartyProviders: [],
};

const JSON_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
};

const AUTH = { authorization: 'Bearer caller-token' };

const INITIALIZE = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'http-test', version: '0' },
  },
};

/** A call that actually reaches the API, so a forwarded token is visible. */
const CURRENT_USER = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: { name: 'get_current_user', arguments: {} },
};

/**
 * A JWT-shaped token. The signature is never checked by the endpoint — the API
 * is the authority — so a literal stands in for one.
 */
function jwt(claims: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
}

function expiresIn(seconds: number): string {
  return jwt({ exp: Math.floor(Date.now() / 1000) + seconds });
}

function config(overrides: Partial<HttpConfig> = {}): HttpConfig {
  return {
    port: 0,
    host: '127.0.0.1',
    allowedHosts: [],
    allowedOrigins: [],
    trustProxy: false,
    rateLimitPerMinute: 60,
    rateLimitBurst: 20,
    maxBodyBytes: 256 * 1024,
    maxConcurrency: 100,
    requestTimeoutMs: 5_000,
    jsonResponses: true,
    publicUrl: '',
    authorizationServer: 'https://api.dynomapper.com',
    ...overrides,
  };
}

/** Stands in for the DYNO Mapper API, so a tool call has something to answer. */
async function startStub(options: { delayMs?: number } = {}) {
  const authorizations: (string | undefined)[] = [];

  const server: Server = createHttpServer((req, res) => {
    authorizations.push(req.headers.authorization);
    const answer = () => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(USER));
    };
    if (options.delayMs) {
      setTimeout(answer, options.delayMs);
      return;
    }
    answer();
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    authorizations,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

interface Harness {
  url: string;
  stub: Awaited<ReturnType<typeof startStub>>;
  rpc: (body: unknown, headers?: Record<string, string>) => Promise<Response>;
  close: () => Promise<void>;
}

/** One hosted listener per test, on an ephemeral port, with its own stub. */
async function startHarness(
  overrides: Partial<HttpConfig> = {},
  stubOptions: { delayMs?: number } = {}
): Promise<Harness> {
  const settings = config(overrides);
  const stub = await startStub(stubOptions);
  const server = new DynoMapperServer({
    baseUrl: stub.url,
    apiKey: 'env-token',
    requestTimeoutMs: settings.requestTimeoutMs,
  });

  const hosted = createHostedApp({
    config: settings,
    createServer: () => server.createServer({ hosted: true }),
    version: 'test',
    log: () => {},
  });

  const httpServer = createHttpServer(hosted.app);
  await new Promise<void>((resolve) =>
    httpServer.listen(0, '127.0.0.1', resolve)
  );
  const { port } = httpServer.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    stub,
    rpc: (body, headers = {}) =>
      fetch(`http://127.0.0.1:${port}/mcp`, {
        method: 'POST',
        headers: { ...JSON_HEADERS, ...AUTH, ...headers },
        body: JSON.stringify(body),
      }),
    async close() {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await hosted.close();
      await stub.close();
    },
  };
}

const openHarnesses: Harness[] = [];

async function harness(
  overrides: Partial<HttpConfig> = {},
  stubOptions: { delayMs?: number } = {}
): Promise<Harness> {
  const started = await startHarness(overrides, stubOptions);
  openHarnesses.push(started);
  return started;
}

afterEach(async () => {
  while (openHarnesses.length > 0) {
    await openHarnesses.pop()!.close();
  }
});

describe('hosted MCP endpoint', () => {
  test('answers initialize and tools/list without a session', async () => {
    const app = await harness();

    const initialized = await app.rpc(INITIALIZE);
    expect(initialized.status).toBe(200);
    expect(initialized.headers.get('mcp-session-id')).toBeNull();
    const handshake = await initialized.json();
    expect(handshake.result.serverInfo.name).toBe('@dynomapper/mcp-server');

    const listed = await app.rpc({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });
    expect(listed.status).toBe(200);
    const tools = (await listed.json()).result.tools as any[];
    expect(tools.length).toBeGreaterThan(50);
    expect(tools.map((tool) => tool.name)).toContain('get_current_user');
  });

  test('runs a tool call with the caller’s token', async () => {
    const app = await harness();

    const response = await app.rpc({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'get_current_user', arguments: {} },
    });

    expect(response.status).toBe(200);
    const result = (await response.json()).result;
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(result.content[0].text)).toEqual(USER);
    // The environment token is not used: the caller's own header is forwarded.
    expect(app.stub.authorizations).toEqual(['Bearer caller-token']);
  });

  test('rejects a request with no bearer token before reaching the API', async () => {
    const app = await harness();

    const response = await fetch(`${app.url}/mcp`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(INITIALIZE),
    });

    expect(response.status).toBe(401);
    const challenge = response.headers.get('www-authenticate') ?? '';
    expect(challenge).toContain('Bearer');
    expect(challenge).toContain(
      `resource_metadata="${app.url}/.well-known/oauth-protected-resource"`
    );
    const body = await response.json();
    expect(body.error.code).toBe(-32001);
    expect(app.stub.authorizations).toEqual([]);
  });

  test('refuses a token that is not in bearer form', async () => {
    const app = await harness();

    const response = await app.rpc(INITIALIZE, {
      authorization: 'caller-token',
    });

    expect(response.status).toBe(401);
  });

  test('answers GET and DELETE with 405 because no session is kept', async () => {
    const app = await harness();

    for (const method of ['GET', 'DELETE']) {
      const response = await fetch(`${app.url}/mcp`, {
        method,
        headers: AUTH,
      });
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('POST');
      expect((await response.json()).error.code).toBe(-32000);
    }
  });

  test('serves /health without a token', async () => {
    const app = await harness();

    const response = await fetch(`${app.url}/health`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('test');
  });
});

describe('protected-resource metadata', () => {
  const PATHS = [
    '/.well-known/oauth-protected-resource',
    '/.well-known/oauth-protected-resource/mcp',
  ];

  test('describes the endpoint and where its tokens are issued', async () => {
    const app = await harness();

    for (const path of PATHS) {
      const response = await fetch(`${app.url}${path}`);

      expect(response.status).toBe(200);
      // Public by nature: the document is read before a client holds a token.
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('cache-control')).toContain('max-age');
      expect(await response.json()).toEqual({
        resource: app.url,
        authorization_servers: ['https://api.dynomapper.com'],
        bearer_methods_supported: ['header'],
      });
    }
  });

  test('states MCP_PUBLIC_URL instead of the request Host', async () => {
    const app = await harness({ publicUrl: 'https://mcp.example.com' });

    const body = await (await fetch(`${app.url}${PATHS[0]}`)).json();

    expect(body.resource).toBe('https://mcp.example.com');
  });

  test('follows MCP_AUTHORIZATION_SERVER where a deployment points elsewhere', async () => {
    const app = await harness({
      authorizationServer: 'https://api.staging.example.com',
    });

    const body = await (await fetch(`${app.url}${PATHS[0]}`)).json();

    expect(body.authorization_servers).toEqual([
      'https://api.staging.example.com',
    ]);
  });

  test('answers 405 to anything but GET', async () => {
    const app = await harness();

    const response = await fetch(`${app.url}${PATHS[0]}`, { method: 'POST' });

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET');
    expect((await response.json()).error).toBe('invalid_request');
  });

  test('stays behind the Host guard, and is still readable by a browser', async () => {
    const app = await harness({ allowedHosts: ['mcp.example.com'] });

    const response = await fetch(`${app.url}${PATHS[0]}`);

    expect(response.status).toBe(403);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
});

describe('expired tokens', () => {
  test('refuses a JWT whose exp has passed before reaching the API', async () => {
    const app = await harness();

    const response = await app.rpc(INITIALIZE, {
      authorization: `Bearer ${expiresIn(-60)}`,
    });

    expect(response.status).toBe(401);
    const challenge = response.headers.get('www-authenticate') ?? '';
    expect(challenge).toContain('error="invalid_token"');
    expect(challenge).toContain('resource_metadata=');
    expect((await response.json()).error.code).toBe(-32001);
    expect(app.stub.authorizations).toEqual([]);
  });

  test('forwards a JWT that has not expired', async () => {
    const app = await harness();
    const token = expiresIn(600);

    const response = await app.rpc(CURRENT_USER, {
      authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(200);
    expect((await response.json()).result.isError).toBeFalsy();
    expect(app.stub.authorizations).toEqual([`Bearer ${token}`]);
  });

  test('forwards a token it cannot read, leaving judgement to the API', async () => {
    const app = await harness();

    for (const token of ['a.b.c', 'a.b', 'not.a.jwt.token']) {
      const response = await app.rpc(CURRENT_USER, {
        authorization: `Bearer ${token}`,
      });

      expect(response.status).toBe(200);
    }

    expect(app.stub.authorizations).toHaveLength(3);
  });
});

describe('hosted tool surface', () => {
  test('omits the tools that need a local filesystem', async () => {
    const app = await harness();

    const listed = await app.rpc({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/list',
    });
    const tools = (await listed.json()).result.tools as any[];
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    expect(byName.has('upload_file')).toBe(false);

    const fromFile = byName.get('create_project_from_file') as any;
    expect(Object.keys(fromFile.inputSchema.properties)).not.toContain('file');
    expect(Object.keys(fromFile.inputSchema.properties)).toEqual(
      expect.arrayContaining(['url', 'fileKey', 'type'])
    );
    expect(fromFile.description).not.toContain('Absolute path');
  });
});

describe('hosted request guards', () => {
  test('rejects an oversized body with 413', async () => {
    const app = await harness({ maxBodyBytes: 512 });

    const response = await app.rpc({
      jsonrpc: '2.0',
      id: 5,
      method: 'initialize',
      padding: 'x'.repeat(2_000),
    });

    expect(response.status).toBe(413);
    expect((await response.json()).error.code).toBe(-32000);
  });

  test('rejects malformed JSON with a JSON-RPC parse error', async () => {
    const app = await harness();

    const response = await fetch(`${app.url}/mcp`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...AUTH },
      body: '{"jsonrpc":',
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe(-32700);
  });

  test('throttles a caller that exceeds the rate limit', async () => {
    const app = await harness({ rateLimitPerMinute: 1, rateLimitBurst: 1 });

    expect((await app.rpc(INITIALIZE)).status).toBe(200);
    const throttled = await app.rpc(INITIALIZE);

    expect(throttled.status).toBe(429);
    expect(Number(throttled.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  test('keys the limit on the CloudFront viewer address when trusting the proxy', async () => {
    const app = await harness({
      rateLimitPerMinute: 1,
      rateLimitBurst: 1,
      trustProxy: true,
    });

    const from = (address: string) => ({
      'cloudfront-viewer-address': address,
    });

    expect((await app.rpc(INITIALIZE, from('203.0.113.7:443'))).status).toBe(
      200
    );
    expect((await app.rpc(INITIALIZE, from('203.0.113.7:443'))).status).toBe(
      429
    );
    // A different viewer is a different bucket, so the shared edge IP cannot
    // throttle unrelated callers.
    expect((await app.rpc(INITIALIZE, from('198.51.100.4:443'))).status).toBe(
      200
    );
  });

  test('rejects a foreign browser origin but allows a request without one', async () => {
    const app = await harness({
      allowedOrigins: ['https://app.example.com'],
    });

    const rejected = await app.rpc(INITIALIZE, {
      origin: 'https://evil.example.com',
    });
    expect(rejected.status).toBe(403);

    const allowed = await app.rpc(INITIALIZE, {
      origin: 'https://app.example.com',
    });
    expect(allowed.status).toBe(200);

    expect((await app.rpc(INITIALIZE)).status).toBe(200);
  });

  test('rejects a Host that is not on the allowlist', async () => {
    const app = await harness({ allowedHosts: ['mcp.example.com'] });

    const rejected = await fetch(`${app.url}/mcp`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, ...AUTH, host: 'other.example.com' },
      body: JSON.stringify(INITIALIZE),
    });

    expect(rejected.status).toBe(403);
  });

  test('answers a health probe whose Host is the pod address', async () => {
    // A load balancer or orchestrator probe addresses the container directly,
    // so the public allowlist must not apply to /health. The address is
    // TEST-NET-1, reserved for documentation, so it cannot be mistaken for a
    // real one.
    const app = await harness({ allowedHosts: ['mcp.example.com'] });

    const response = await fetch(`${app.url}/health`, {
      headers: { host: '192.0.2.17:3000' },
    });

    expect(response.status).toBe(200);
  });
});

describe('hosted failure handling', () => {
  test('turns a slow upstream call into a tool error before the proxy times out', async () => {
    const app = await harness({ requestTimeoutMs: 50 }, { delayMs: 500 });

    const response = await app.rpc({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'get_current_user', arguments: {} },
    });

    expect(response.status).toBe(200);
    const result = (await response.json()).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Request Timeout');
  });
});

describe('response mode', () => {
  test('streams SSE when JSON responses are disabled', async () => {
    const app = await harness({ jsonResponses: false });

    const response = await app.rpc(INITIALIZE);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const body = await response.text();
    const data = body
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => JSON.parse(line.slice('data:'.length)))
      .at(-1);
    expect(data.result.serverInfo.name).toBe('@dynomapper/mcp-server');
  });
});

describe('readHttpConfig', () => {
  test('defaults to a loopback listener with JSON responses', () => {
    const settings = readHttpConfig({});

    expect(settings).toMatchObject({
      port: 3000,
      host: '127.0.0.1',
      allowedHosts: [],
      allowedOrigins: [],
      trustProxy: false,
      rateLimitPerMinute: 60,
      rateLimitBurst: 20,
      maxConcurrency: 100,
      requestTimeoutMs: 25_000,
      jsonResponses: true,
    });
  });

  test('prefers the MCP_ prefixed names over the generic ones', () => {
    const settings = readHttpConfig({
      PORT: '8080',
      MCP_PORT: '9100',
      HOST: '0.0.0.0',
      MCP_ALLOWED_HOSTS: 'mcp.example.com, localhost',
      MCP_JSON_RESPONSES: 'false',
    });

    expect(settings.port).toBe(9100);
    expect(settings.host).toBe('0.0.0.0');
    expect(settings.allowedHosts).toEqual(['mcp.example.com', 'localhost']);
    expect(settings.jsonResponses).toBe(false);
  });

  test('rejects a value that cannot mean what it says', () => {
    expect(() => readHttpConfig({ MCP_PORT: 'eighty' })).toThrow('MCP_PORT');
    expect(() => readHttpConfig({ MCP_JSON_RESPONSES: 'maybe' })).toThrow(
      'MCP_JSON_RESPONSES'
    );
  });
});
