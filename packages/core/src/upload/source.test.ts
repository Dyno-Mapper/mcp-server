import { afterEach, describe, expect, test } from 'vite-plus/test';
import { createServer as createHttpServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  isBlockedAddress,
  resolveInline,
  resolveUrl,
  PURPOSE_MAX_BYTES,
} from './source.js';

/** The bytes a `content` argument carries, encoded the way a client would. */
function base64(text: string): string {
  return Buffer.from(text).toString('base64');
}

/** A local origin standing in for wherever a caller's file really lives. */
async function serve(
  handler: (
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse
  ) => void
): Promise<{ url: string; close: () => Promise<void> }> {
  const server: Server = createHttpServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/**
 * A guard that refuses nothing, for the tests whose fixture listens on loopback.
 *
 * The real guard is what refuses loopback, so a test that serves a file locally
 * has to say so explicitly rather than by turning the rule off globally.
 */
const allowLoopback = async () => undefined;

const openServers: { close: () => Promise<void> }[] = [];

afterEach(async () => {
  while (openServers.length > 0) {
    await openServers.pop()!.close();
  }
});

async function fixture(
  handler: Parameters<typeof serve>[0]
): Promise<{ url: string }> {
  const started = await serve(handler);
  openServers.push(started);
  return started;
}

describe('resolveInline', () => {
  test('decodes base64 into the bytes an upload sends', () => {
    const resolved = resolveInline(
      base64('url,title\nhttps://example.com,A'),
      'sitemap.txt',
      'text/plain; charset=utf-8',
      'project_text'
    );

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(resolved.file.bytes.toString()).toBe(
      'url,title\nhttps://example.com,A'
    );
    // The name loses any directory, and the type loses its parameters, because
    // both are what the API records and reports.
    expect(resolved.file.name).toBe('sitemap.txt');
    expect(resolved.file.mimeType).toBe('text/plain');
  });

  test('accepts base64 that an encoder wrapped', () => {
    const wrapped = base64('wrapped by a 76-column encoder').replace(
      /(.{8})/g,
      '$1\n'
    );

    const resolved = resolveInline(
      wrapped,
      'note.txt',
      'text/plain',
      'project_text'
    );

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.file.bytes.toString()).toBe(
      'wrapped by a 76-column encoder'
    );
  });

  test('refuses a body that is not base64', () => {
    const resolved = resolveInline(
      'this is not base64!',
      'note.txt',
      'text/plain',
      'project_text'
    );

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(
      JSON.parse(String((resolved.result.content[0] as any).text))
    ).toMatchObject({ error: 'invalid_content' });
    expect(resolved.result.isError).toBe(true);
  });

  test('refuses an empty body', () => {
    const resolved = resolveInline(
      '   ',
      'note.txt',
      'text/plain',
      'project_text'
    );

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(
      JSON.parse(String((resolved.result.content[0] as any).text)).error
    ).toBe('invalid_content');
  });

  test('refuses a file over the purpose ceiling before decoding it', () => {
    // One byte over the 10 MB an image may have, expressed as base64 it never
    // has to decode: the whole point of counting from the string.
    const over =
      Math.ceil((PURPOSE_MAX_BYTES.sitemap_content_image + 1) / 3) * 4;

    const resolved = resolveInline(
      'A'.repeat(over),
      'photo.png',
      'image/png',
      'sitemap_content_image'
    );

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(
      JSON.parse(String((resolved.result.content[0] as any).text))
    ).toMatchObject({ error: 'file_too_large' });
  });
});

describe('isBlockedAddress', () => {
  test.each([
    ['127.0.0.1', 'loopback'],
    ['10.1.2.3', 'private'],
    ['172.20.0.1', 'private'],
    ['192.168.1.1', 'private'],
    ['169.254.169.254', 'the metadata endpoint'],
    ['100.100.100.200', 'CGNAT'],
    ['0.0.0.0', 'the unspecified address'],
    ['224.0.0.1', 'multicast'],
    ['::1', 'loopback in the other family'],
    ['fd00::1', 'unique local'],
    ['fe80::1', 'link local'],
  ])('refuses %s (%s)', (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  test.each([
    ['93.184.216.34', 'a public address'],
    ['8.8.8.8', 'a public resolver'],
    ['2606:2800:220:1:248:1893:25c8:1946', 'public IPv6'],
  ])('allows %s (%s)', (address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  test('refuses a private address spelled as IPv4-mapped IPv6', () => {
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true);
    expect(isBlockedAddress('::ffff:93.184.216.34')).toBe(false);
  });
});

describe('resolveUrl', () => {
  test('fetches the file and takes its media type from the response', async () => {
    const origin = await fixture((req, res) => {
      res.writeHead(200, { 'content-type': 'image/png' });
      res.end('png bytes');
    });

    const resolved = await resolveUrl(
      `${origin.url}/assets/logo.png`,
      'sitemap_content_image',
      { addressGuard: allowLoopback }
    );

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.file.bytes.toString()).toBe('png bytes');
    expect(resolved.file.mimeType).toBe('image/png');
    expect(resolved.file.name).toBe('logo.png');
  });

  test('lets the caller override the name and the media type', async () => {
    const origin = await fixture((req, res) => {
      res.writeHead(200, {
        'content-type': 'application/octet-stream',
        'content-disposition': 'attachment; filename="served.bin"',
      });
      res.end('bytes');
    });

    const resolved = await resolveUrl(
      `${origin.url}/download`,
      'sitemap_content_file',
      {
        addressGuard: allowLoopback,
        name: 'chosen.psd',
        mimeType: 'application/octet-stream',
      }
    );

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.file.name).toBe('chosen.psd');
  });

  test('uses the served filename when the caller gave none', async () => {
    const origin = await fixture((req, res) => {
      res.writeHead(200, {
        'content-type': 'text/plain',
        'content-disposition': 'attachment; filename="listed.txt"',
      });
      res.end('a,b');
    });

    const resolved = await resolveUrl(`${origin.url}/x`, 'project_text', {
      addressGuard: allowLoopback,
    });

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.file.name).toBe('listed.txt');
  });

  test('follows a redirect, refusing each hop it lands on', async () => {
    const origin = await fixture((req, res) => {
      if (req.url === '/old') {
        res.writeHead(302, { location: '/new' });
        res.end();
        return;
      }
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('redirected and fetched');
    });

    const resolved = await resolveUrl(`${origin.url}/old`, 'project_text', {
      addressGuard: allowLoopback,
    });

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.file.bytes.toString()).toBe('redirected and fetched');
  });

  test('refuses a URL that resolves to a private address', async () => {
    const origin = await fixture((req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('should never be read');
    });

    // No guard is swapped in: refusing this address is the behaviour under test.
    const resolved = await resolveUrl(
      `${origin.url}/local.txt`,
      'project_text',
      {}
    );

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(
      JSON.parse(String((resolved.result.content[0] as any).text))
    ).toMatchObject({ error: 'blocked_address' });
  });

  test('reads a URL that is not a URL as a failure, not a crash', async () => {
    const resolved = await resolveUrl('not a url', 'project_text', {});

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(
      JSON.parse(String((resolved.result.content[0] as any).text)).error
    ).toBe('fetch_failed');
  });

  test('refuses a served file over the purpose ceiling from its declared length', async () => {
    const origin = await fixture((req, res) => {
      res.writeHead(200, {
        'content-type': 'text/plain',
        'content-length': String(PURPOSE_MAX_BYTES.project_text + 1),
      });
      res.end();
    });

    const resolved = await resolveUrl(
      `${origin.url}/huge.txt`,
      'project_text',
      {
        addressGuard: allowLoopback,
      }
    );

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(
      JSON.parse(String((resolved.result.content[0] as any).text))
    ).toMatchObject({ error: 'file_too_large' });
  });

  test('stops reading a chunked response once it passes the ceiling', async () => {
    // No Content-Length at all, so the running total is the only thing that can
    // stop it — which is the case a declared length cannot cover.
    const origin = await fixture((req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' });
      const chunk = Buffer.alloc(1024 * 1024, 'a');
      let sent = 0;
      const pump = () => {
        if (sent > PURPOSE_MAX_BYTES.sitemap_content_image + 2 * 1024 * 1024) {
          res.end();
          return;
        }
        sent += chunk.byteLength;
        if (res.write(chunk)) {
          setImmediate(pump);
        } else {
          res.once('drain', pump);
        }
      };
      pump();
    });

    const resolved = await resolveUrl(
      `${origin.url}/endless.txt`,
      'sitemap_content_image',
      {
        addressGuard: allowLoopback,
        mimeType: 'text/plain',
      }
    );

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(
      JSON.parse(String((resolved.result.content[0] as any).text))
    ).toMatchObject({ error: 'file_too_large' });
  });

  test('reports a refused fetch with the status it answered', async () => {
    const origin = await fixture((req, res) => {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not here');
    });

    const resolved = await resolveUrl(
      `${origin.url}/missing.txt`,
      'project_text',
      {
        addressGuard: allowLoopback,
      }
    );

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    const body = JSON.parse(String((resolved.result.content[0] as any).text));
    expect(body.error).toBe('fetch_failed');
    expect(body.message).toContain('404');
  });

  test('refuses a scheme that is not http or https', async () => {
    const resolved = await resolveUrl(
      'ftp://example.com/x.txt',
      'project_text',
      {
        addressGuard: allowLoopback,
      }
    );

    expect(resolved.ok).toBe(false);
    if (resolved.ok) return;
    expect(
      JSON.parse(String((resolved.result.content[0] as any).text)).error
    ).toBe('fetch_failed');
  });
});
