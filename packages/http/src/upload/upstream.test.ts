import { afterEach, describe, expect, test } from 'vite-plus/test';
import { createServer as createHttpServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { openAsBlob } from 'node:fs';
import { tmpdir } from 'node:os';
import * as pathMod from 'node:path';
import {
  UpstreamError,
  buildFraming,
  postUpload,
  uploadUrl,
  type UploadRequest,
} from './upstream.js';

const openServers: Server[] = [];
const openDirs: string[] = [];

afterEach(async () => {
  while (openServers.length > 0) {
    const server = openServers.pop()!;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  while (openDirs.length > 0) {
    await rm(openDirs.pop()!, { recursive: true, force: true });
  }
});

/** A server that records what it received and answers with `answer`. */
async function stub(
  answer: (res: import('node:http').ServerResponse) => void = (res) => {
    res.writeHead(201, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ key: 'uploads/api/x.png', size: 9 }));
  }
): Promise<{
  url: string;
  received: {
    headers: import('node:http').IncomingHttpHeaders;
    body: Buffer;
  }[];
}> {
  const received: {
    headers: import('node:http').IncomingHttpHeaders;
    body: Buffer;
  }[] = [];

  const server = createHttpServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      received.push({
        headers: req.headers,
        body: Buffer.concat(chunks),
      });
      answer(res);
    });
  });

  openServers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return { url: `http://127.0.0.1:${port}`, received };
}

/** A real disk-backed blob, which is what the route hands this function. */
async function blob(
  bytes: Buffer,
  type = 'image/png'
): Promise<{ blob: Blob; dir: string }> {
  const dir = await mkdtemp(pathMod.join(tmpdir(), 'dynomapper-upstream-'));
  openDirs.push(dir);
  const file = pathMod.join(dir, 'spool');
  await writeFile(file, bytes);
  return { blob: await openAsBlob(file, { type }), dir };
}

function request(
  baseUrl: string,
  file: Blob,
  overrides: Partial<UploadRequest> = {}
): UploadRequest {
  return {
    baseUrl,
    token: 'caller-token',
    purpose: 'sitemap_content_image',
    name: 'shot.png',
    mimeType: 'image/png',
    blob: file,
    signal: new AbortController().signal,
    timeoutMs: 5_000,
    idleTimeoutMs: 2_000,
    ...overrides,
  };
}

describe('buildFraming', () => {
  test('computes the overhead the Content-Length is built from', () => {
    const framing = buildFraming('project_text', 'a.txt', 'text/plain', 3, 'B');

    expect(framing.boundary).toBe('B');
    const total =
      framing.preamble.length +
      framing.fileHead.length +
      framing.epilogue.length +
      3;
    expect(total).toBe(framing.overhead + 3);
  });
});

describe('postUpload', () => {
  test('sends an exact Content-Length and byte-exact multipart', async () => {
    const api = await stub();
    const { blob: file } = await blob(Buffer.from('png bytes'));
    const answer = await postUpload(request(api.url, file));

    expect(answer.status).toBe(201);
    expect(JSON.parse(answer.body.toString('utf8')).key).toBe(
      'uploads/api/x.png'
    );

    const sent = api.received[0];
    const boundary = /boundary=(.+)$/.exec(
      String(sent.headers['content-type'])
    )![1];
    const framing = buildFraming(
      'sitemap_content_image',
      'shot.png',
      'image/png',
      Buffer.byteLength('png bytes'),
      boundary!
    );

    // No chunking: the API can apply its own size limit before reading.
    expect(sent.headers['transfer-encoding']).toBeUndefined();
    expect(Number(sent.headers['content-length'])).toBe(
      framing.overhead + Buffer.byteLength('png bytes')
    );
    expect(sent.body.length).toBe(Number(sent.headers['content-length']));

    // Byte-exact, in order, including the filename and media type.
    const expected = Buffer.concat([
      framing.preamble,
      framing.fileHead,
      Buffer.from('png bytes'),
      framing.epilogue,
    ]);
    expect(sent.body.equals(expected)).toBe(true);
    expect(sent.body.toString('utf8')).toContain(
      'Content-Disposition: form-data; name="file"; filename="shot.png"'
    );
    expect(sent.headers.authorization).toBe('Bearer caller-token');
  });

  test('accepts a token that already names its scheme', async () => {
    const api = await stub();
    const { blob: file } = await blob(Buffer.from('x'));

    await postUpload(request(api.url, file, { token: 'Bearer caller-token' }));

    expect(api.received[0].headers.authorization).toBe('Bearer caller-token');
  });

  test('refuses to follow a redirect', async () => {
    const api = await stub((res) => {
      res.writeHead(307, { location: 'https://elsewhere.example/upload' });
      res.end();
    });
    const { blob: file } = await blob(Buffer.from('x'));

    await expect(postUpload(request(api.url, file))).rejects.toMatchObject({
      code: 'upstream_redirect',
    });
  });

  test('bounds the answer it reads', async () => {
    const api = await stub((res) => {
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(Buffer.alloc(1024 * 1024 + 1, 0x20));
    });
    const { blob: file } = await blob(Buffer.from('x'));

    await expect(postUpload(request(api.url, file))).rejects.toMatchObject({
      code: 'upstream_response_too_large',
    });
  });

  test('reports an unreachable API by name', async () => {
    // A port nothing listens on: the failure must be a code, not a raw socket
    // error the route would have to interpret.
    const { blob: file } = await blob(Buffer.from('x'));

    await expect(
      postUpload(request('http://127.0.0.1:1', file))
    ).rejects.toMatchObject({ code: 'upstream_unreachable' });
  });

  test('stops the moment the caller disconnects', async () => {
    const api = await stub();
    const { blob: file } = await blob(Buffer.from('png bytes'));
    const controller = new AbortController();
    const pending = postUpload(
      request(api.url, file, { signal: controller.signal })
    );

    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(UpstreamError);
    await expect(pending).rejects.toMatchObject({ code: 'aborted' });
  });

  test('joins the upload path onto a base URL with a path', () => {
    expect(uploadUrl('https://api.example.com').href).toBe(
      'https://api.example.com/v1/files'
    );
    expect(uploadUrl('https://api.example.com/gateway/').href).toBe(
      'https://api.example.com/gateway/v1/files'
    );
  });
});
