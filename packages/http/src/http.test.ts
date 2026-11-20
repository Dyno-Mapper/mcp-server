import { afterEach, describe, expect, test } from 'vite-plus/test';
import { createServer as createHttpServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as pathMod from 'node:path';
import { DynoMapperServer } from '@dynomapper/mcp-core';
import { readHttpConfig, type HttpConfig } from './config.js';
import { createHostedApp } from './app.js';
import { publicOrigin } from './protected-resource.js';
import { uploadTicketTool } from './upload/create_upload_ticket.js';

const SECRET = 'your_upload_secret_of_at_least_32_characters';

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
    maxUploadConcurrency: 2,
    maxConcurrency: 100,
    apiBaseUrl: '',
    requestTimeoutMs: 5_000,
    uploadSecret: SECRET,
    uploadTicketTtlMs: 600_000,
    uploadTimeoutMs: 5_000,
    uploadIdleTimeoutMs: 2_000,
    jsonResponses: true,
    publicUrl: '',
    authorizationServer: 'https://api.dynomapper.com',
    ...overrides,
  };
}

/** Stands in for the DYNO Mapper API, so a tool call has something to answer. */
async function startStub(options: { delayMs?: number } = {}) {
  const authorizations: (string | undefined)[] = [];
  /** Every upload body that reached the API, so the bytes can be checked. */
  const uploads: { contentType: string | undefined; body: string }[] = [];

  const server: Server = createHttpServer((req, res) => {
    authorizations.push(req.headers.authorization);

    if (req.url === '/v1/files') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        uploads.push({
          contentType: req.headers['content-type'],
          body: Buffer.concat(chunks).toString('utf8'),
        });
        setTimeout(() => {
          res.writeHead(201, { 'content-type': 'application/json' });
          res.end(
            JSON.stringify({
              key: 'uploads/api/project_text/b2/list.txt',
              name: 'list.txt',
              size: 19,
              mimeType: 'text/plain',
            })
          );
        }, options.delayMs ?? 0);
      });
      return;
    }

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
    uploads,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

interface Harness {
  url: string;
  stub: Awaited<ReturnType<typeof startStub>>;
  rpc: (body: unknown, headers?: Record<string, string>) => Promise<Response>;
  /** Where uploads are spooled, so a test can assert the file is gone. */
  spoolDir: string;
  /** Every line the app logged. */
  logs: string[];
  /** A ticket, as an agent would obtain one: through the tool. */
  ticket: (
    purpose: string,
    name?: string,
    mimeType?: string,
    auth?: Record<string, string>
  ) => Promise<{ uploadUrl: string; curl: string; expiresAt: string }>;
  put: (
    url: string,
    body: BodyInit,
    headers?: Record<string, string>,
    init?: RequestInit
  ) => Promise<Response>;
  close: () => Promise<void>;
}

/** One hosted listener per test, on an ephemeral port, with its own stub. */
async function startHarness(
  overrides: Partial<HttpConfig> = {},
  stubOptions: { delayMs?: number } = {}
): Promise<Harness> {
  const stub = await startStub(stubOptions);
  const settings = config({ apiBaseUrl: stub.url, ...overrides });
  const spoolDir = await mkdtemp(pathMod.join(tmpdir(), 'dynomapper-upload-'));
  const logs: string[] = [];
  const server = new DynoMapperServer({
    baseUrl: settings.apiBaseUrl,
    apiKey: 'env-token',
    requestTimeoutMs: settings.requestTimeoutMs,
  });

  const hosted = createHostedApp({
    config: settings,
    createServer: (request) =>
      server.createServer({
        hosted: true,
        extraTools: [uploadTicketTool(settings)],
        ...(publicOrigin(request, settings)
          ? { requestOrigin: publicOrigin(request, settings) }
          : {}),
      }),
    version: 'test',
    log: (line) => logs.push(line),
    spoolDir,
  });

  const httpServer = createHttpServer(hosted.app);
  await new Promise<void>((resolve) =>
    httpServer.listen(0, '127.0.0.1', resolve)
  );
  const { port } = httpServer.address() as AddressInfo;

  const origin = `http://127.0.0.1:${port}`;

  return {
    url: origin,
    stub,
    spoolDir,
    logs,
    rpc: (body, headers = {}) =>
      fetch(`${origin}/mcp`, {
        method: 'POST',
        headers: { ...JSON_HEADERS, ...AUTH, ...headers },
        body: JSON.stringify(body),
      }),
    async ticket(
      purpose,
      name = 'shot.png',
      mimeType = 'image/png',
      auth = AUTH
    ) {
      const response = await fetch(`${origin}/mcp`, {
        method: 'POST',
        headers: { ...JSON_HEADERS, ...auth },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 20,
          method: 'tools/call',
          params: {
            name: 'create_upload_ticket',
            arguments: { purpose, name, mimeType },
          },
        }),
      });
      const body = await response.json();
      if (body.result?.isError) {
        throw new Error(JSON.stringify(body.result.content[0].text));
      }
      return body.result.structuredContent;
    },
    put: (url, body, headers = {}, init = {}) =>
      fetch(url, { method: 'PUT', body, headers, ...init }),
    async close() {
      // A test that abandons a request mid-body leaves its socket open, and
      // `close()` then waits out the keep-alive window. The production shutdown
      // does the same thing for the same reason.
      httpServer.closeAllConnections();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      await hosted.close();
      await stub.close();
      await rm(spoolDir, { recursive: true, force: true });
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

  test('answers the CORS preflight a browser discovery makes', async () => {
    // The SDK sends `MCP-Protocol-Version` when it reads the document, so a
    // browser preflights before the GET ever leaves the page. A 405 here is a
    // blocked request, and the client falls back to guessing `<origin>/register`.
    const app = await harness();

    for (const path of PATHS) {
      const response = await fetch(`${app.url}${path}`, {
        method: 'OPTIONS',
        headers: {
          origin: 'http://127.0.0.1:6274',
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'mcp-protocol-version',
        },
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain(
        'GET'
      );
      // Echoed, so a client that sends another discovery header is not refused.
      expect(
        response.headers.get('access-control-allow-headers')?.toLowerCase()
      ).toContain('mcp-protocol-version');
    }
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
  test('does not offer the path upload, and offers the ticket instead', async () => {
    const app = await harness();

    const listed = await app.rpc({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/list',
    });
    const tools = (await listed.json()).result.tools as any[];
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    // A pod cannot read the caller's disk, so the tool that takes a path is
    // absent rather than present-and-failing.
    expect(byName.has('upload_file')).toBe(false);

    const ticketTool = byName.get('create_upload_ticket') as any;
    expect(ticketTool).toBeDefined();
    expect(Object.keys(ticketTool.inputSchema.properties)).toEqual(
      expect.arrayContaining(['purpose', 'name', 'mimeType'])
    );
  });

  test('names the ticket in the four tools that used to say upload_file', async () => {
    const app = await harness();

    const listed = await app.rpc({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/list',
    });
    const tools = (await listed.json()).result.tools as any[];
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    // A description that tells a hosted agent to call a tool this server does
    // not register is worse than no description at all. What must not happen is
    // the rest of the text disappearing with the clause: each of these says
    // something about the call that no other sentence does.
    const retained: Record<string, string> = {
      store_content_image: 'SHA-1',
      store_content_file: 'the name it was uploaded with',
      run_accessibility_pdf_upload_test: '429 too_many_runs',
      create_project_from_file: 'purpose_mismatch',
    };

    for (const [name, phrase] of Object.entries(retained)) {
      const tool = byName.get(name) as any;
      expect(tool).toBeDefined();
      expect(tool.description).toContain('create_upload_ticket');
      expect(tool.description).not.toContain('`upload_file`');
      expect(tool.description).toContain(phrase);
    }
  });

  test('still lists an import as taking a key rather than a file', async () => {
    const app = await harness();

    const listed = await app.rpc({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/list',
    });
    const tools = (await listed.json()).result.tools as any[];
    const fromFile = tools.find(
      (tool) => tool.name === 'create_project_from_file'
    ) as any;

    expect(Object.keys(fromFile.inputSchema.properties)).not.toContain('file');
    expect(Object.keys(fromFile.inputSchema.properties)).toEqual(
      expect.arrayContaining(['url', 'fileKey', 'type'])
    );
  });
});

describe('upload route', () => {
  test('spools the bytes, re-sends them as multipart, and relays the API answer', async () => {
    const app = await harness();
    const ticket = await app.ticket(
      'sitemap_content_image',
      'shot.png',
      'image/png'
    );

    expect(ticket.uploadUrl).toContain('/upload/');
    expect(ticket.curl).toContain(ticket.uploadUrl);

    const response = await app.put(ticket.uploadUrl, Buffer.from('png bytes'));

    expect(response.status).toBe(201);
    expect((await response.json()).key).toBe(
      'uploads/api/project_text/b2/list.txt'
    );

    // The API's own answer, relayed: same status, same body, same content type.
    expect(response.headers.get('content-type')).toContain('application/json');

    expect(app.stub.uploads).toHaveLength(1);
    const sent = app.stub.uploads[0];
    expect(sent.contentType).toContain('multipart/form-data');
    expect(sent.body).toContain('name="purpose"');
    expect(sent.body).toContain('sitemap_content_image');
    expect(sent.body).toContain('filename="shot.png"');
    expect(sent.body).toContain('Content-Type: image/png');
    expect(sent.body).toContain('png bytes');
    // The route calls the API as the caller: the ticket's token, not the
    // server's own missing credential.
    expect(app.stub.authorizations).toContain('Bearer caller-token');
  });

  test('leaves no spool file behind on success', async () => {
    const app = await harness();
    const ticket = await app.ticket('sitemap_content_image');

    await app.put(ticket.uploadUrl, Buffer.from('png bytes'));

    expect(await readdir(app.spoolDir)).toEqual([]);
  });

  test('refuses a ticket that was edited, and spools nothing', async () => {
    const app = await harness();
    const ticket = await app.ticket('sitemap_content_image');
    const tampered = `${ticket.uploadUrl.slice(0, -2)}xy`;

    const response = await app.put(tampered, Buffer.from('png bytes'));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe('upload_ticket_invalid');
    expect(app.stub.uploads).toHaveLength(0);
    expect(await readdir(app.spoolDir)).toEqual([]);
  });

  test('says to mint a new ticket when the old one has expired', async () => {
    const app = await harness({ uploadTicketTtlMs: -1_000 });
    const ticket = await app.ticket('sitemap_content_image');

    const response = await app.put(ticket.uploadUrl, Buffer.from('png bytes'));

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('upload_ticket_expired');
    expect(body.message).toContain('create_upload_ticket');
  });

  test('refuses a declared body over the purpose ceiling without reading it', async () => {
    const app = await harness();
    const ticket = await app.ticket('sitemap_content_image');

    const response = await app.put(
      ticket.uploadUrl,
      Buffer.alloc(10 * 1024 * 1024 + 1)
    );

    expect(response.status).toBe(413);
    expect((await response.json()).error).toBe('file_too_large');
    expect(app.stub.uploads).toHaveLength(0);
    expect(await readdir(app.spoolDir)).toEqual([]);
  });

  test('stops a streamed body that runs over the ceiling, and cleans up', async () => {
    const app = await harness();
    const ticket = await app.ticket('sitemap_content_image');

    // No Content-Length, so only the running count can stop it.
    const chunk = Buffer.alloc(1024 * 1024);
    let sent = 0;
    const body = new ReadableStream({
      pull(controller) {
        if (sent >= 12) {
          controller.close();
          return;
        }
        sent += 1;
        controller.enqueue(chunk);
      },
    });

    const response = await app.put(
      ticket.uploadUrl,
      body,
      { 'content-type': 'application/octet-stream' },
      // A streamed body has no length, which is the case this covers.
      { duplex: 'half' } as RequestInit
    );

    expect(response.status).toBe(413);
    expect(app.stub.uploads).toHaveLength(0);
    expect(await readdir(app.spoolDir)).toEqual([]);
  });

  test('cleans up when the caller disconnects mid-upload', async () => {
    const app = await harness();
    const ticket = await app.ticket('sitemap_content_image');
    const controller = new AbortController();

    // A body that keeps producing: the upload is under way when it is cut off.
    const body = new ReadableStream({
      pull(stream) {
        stream.enqueue(Buffer.alloc(64 * 1024));
      },
    });

    // Not awaited: undici takes its time to settle a streamed request it
    // aborted, and what this test is about is the server's spool, not the
    // client's teardown.
    void app
      .put(
        ticket.uploadUrl,
        body,
        { 'content-type': 'application/octet-stream' },
        { duplex: 'half', signal: controller.signal } as RequestInit
      )
      .catch(() => undefined);

    await new Promise((resolve) => setTimeout(resolve, 150));
    controller.abort();

    // The spool is unlinked in a `finally`, which runs on the aborted path too.
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if ((await readdir(app.spoolDir)).length === 0) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    expect(await readdir(app.spoolDir)).toEqual([]);
    expect(app.stub.uploads).toHaveLength(0);
    // A client that hung up is not an error worth a log line.
    expect(app.logs.some((line) => line.includes('outcome=error'))).toBe(false);
  });

  test('answers a method other than PUT with 405 and Allow', async () => {
    const app = await harness();
    const ticket = await app.ticket('sitemap_content_image');

    const response = await fetch(ticket.uploadUrl, { method: 'GET' });

    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('PUT');
    expect((await response.json()).error).toBe('invalid_request');
  });

  test('does not write the ticket into the log', async () => {
    const app = await harness();
    const ticket = await app.ticket('sitemap_content_image');

    await app.put(ticket.uploadUrl, Buffer.from('png bytes'));

    expect(app.logs.some((line) => line.includes('/upload/:ticket'))).toBe(
      true
    );
    // The sealed ticket carries the caller's token; a log line is durable.
    expect(
      app.logs.some((line) => /\/upload\/[A-Za-z0-9_-]{20,}/.test(line))
    ).toBe(false);
    expect(app.logs.some((line) => line.includes('outcome=ok'))).toBe(true);
  });

  test('refuses to follow a redirect from the API', async () => {
    const redirector: Server = createHttpServer((req, res) => {
      req.resume();
      res.writeHead(302, { location: 'https://elsewhere.example/upload' });
      res.end();
    });
    await new Promise<void>((resolve) =>
      redirector.listen(0, '127.0.0.1', resolve)
    );
    const { port } = redirector.address() as AddressInfo;

    try {
      const app = await harness({ apiBaseUrl: `http://127.0.0.1:${port}` });
      const ticket = await app.ticket('sitemap_content_image');
      const response = await app.put(ticket.uploadUrl, Buffer.from('png'));

      expect(response.status).toBe(502);
      const body = await response.json();
      expect(body.error).toBe('upstream_redirect');
      expect(body.message).toContain('DYNOMAPPER_API_URL');
      // Following it would have re-sent the whole file somewhere else.
      expect(await readdir(app.spoolDir)).toEqual([]);
    } finally {
      await new Promise<void>((resolve) => redirector.close(() => resolve()));
    }
  });

  test('charges a slot before spooling, and releases it after', async () => {
    const app = await harness({ maxUploadConcurrency: 1 }, { delayMs: 300 });
    const first = await app.ticket('sitemap_content_image');
    const second = await app.ticket('sitemap_content_image');

    const inFlight = app.put(first.uploadUrl, Buffer.from('png bytes'));
    await new Promise((resolve) => setTimeout(resolve, 100));

    const refused = await app.put(second.uploadUrl, Buffer.from('png bytes'));
    expect(refused.status).toBe(503);
    expect(refused.headers.get('retry-after')).toBe('1');

    expect((await inFlight).status).toBe(201);

    // The slot is released when the response ends, so the next upload is served
    // rather than punished for the one before it.
    const third = await app.ticket('sitemap_content_image');
    expect(
      (await app.put(third.uploadUrl, Buffer.from('png bytes'))).status
    ).toBe(201);
  });

  test('bounds uploads per caller rather than across the server', async () => {
    const app = await harness({ maxUploadConcurrency: 1 }, { delayMs: 300 });
    const mine = await app.ticket('sitemap_content_image');
    const theirs = await app.ticket(
      'sitemap_content_image',
      'shot.png',
      'image/png',
      {
        authorization: `Bearer ${expiresIn(3600)}`,
      }
    );

    const first = app.put(mine.uploadUrl, Buffer.from('png bytes'));
    await new Promise((resolve) => setTimeout(resolve, 100));

    // The caller that holds its one slot is refused...
    const refused = await app.put(mine.uploadUrl, Buffer.from('png bytes'));
    expect(refused.status).toBe(503);
    expect(refused.headers.get('retry-after')).toBe('1');
    expect((await refused.json()).message).toContain('per caller');

    // ...while a second caller still has a slot of its own.
    expect(
      (await app.put(theirs.uploadUrl, Buffer.from('png bytes'))).status
    ).toBe(201);

    expect((await first).status).toBe(201);
  });

  test('refuses uploads when the deployment has no secret', async () => {
    const app = await harness({ uploadSecret: '' });

    await expect(app.ticket('sitemap_content_image')).rejects.toThrow(
      /MCP_UPLOAD_SECRET/
    );

    const response = await app.put(
      `${app.url}/upload/anything`,
      Buffer.from('x')
    );
    expect(response.status).toBe(503);
    expect((await response.json()).error).toBe('upload_ticket_unavailable');
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
