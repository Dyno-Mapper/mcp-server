import { describe, expect, test } from 'vite-plus/test';
import { upload_file } from './upload_file.js';

const context = { mode: 'hosted' as const };

function refusal(result: any): { error: string; message: string } {
  return JSON.parse(String((result.error.content[0] as any).text));
}

describe('upload_file arguments', () => {
  test('takes a path on stdio, and no URL', () => {
    const stdio = Object.keys((upload_file.inputSchema('stdio') as any).shape);

    expect(stdio).toEqual(expect.arrayContaining(['purpose', 'file']));
    expect(stdio).not.toContain('content');
    // The stdio server shares the caller's filesystem, so every file it may
    // upload has a path. A URL would only add a way to reach the wrong host.
    expect(stdio).not.toContain('url');
  });

  test('takes bytes or a URL on a hosted server, and no path', () => {
    const hosted = Object.keys(
      (upload_file.inputSchema('hosted') as any).shape
    );

    expect(hosted).toEqual(
      expect.arrayContaining(['purpose', 'content', 'name', 'mimeType', 'url'])
    );
    expect(hosted).not.toContain('file');
  });
});

describe('upload_file.prepare', () => {
  test('sends the path through untouched on stdio', async () => {
    const prepared = await upload_file.prepare(
      { purpose: 'project_text', file: '/tmp/sitemap.txt' },
      { mode: 'stdio' }
    );

    expect('error' in prepared).toBe(false);
    if ('error' in prepared) return;
    expect(prepared.source).toBe('file');
    expect(prepared.upload).toBeUndefined();
    expect(prepared.args).toEqual({
      purpose: 'project_text',
      file: '/tmp/sitemap.txt',
    });
  });

  test('turns base64 into the bytes the upload sends', async () => {
    const prepared = await upload_file.prepare(
      {
        purpose: 'project_text',
        content: Buffer.from('https://example.com').toString('base64'),
        name: 'list.txt',
        mimeType: 'text/plain',
      },
      context
    );

    expect('error' in prepared).toBe(false);
    if ('error' in prepared) return;
    expect(prepared.source).toBe('content');
    expect(prepared.upload?.bytes.toString()).toBe('https://example.com');
    expect(prepared.upload?.name).toBe('list.txt');
    // Only the purpose travels as a form field; the bytes go as the file part.
    expect(prepared.args).toEqual({ purpose: 'project_text' });
  });

  test('treats the empty string a client fills in as absent', async () => {
    const schema = upload_file.inputSchema('hosted') as any;
    const bytes = Buffer.from('https://example.com').toString('base64');

    // A caller emitting a tool call tends to fill every property, leaving `""`
    // for the ones it has nothing for. That must not read as "a URL was sent".
    expect(
      schema.safeParse({
        purpose: 'project_text',
        content: bytes,
        name: 'list.txt',
        mimeType: 'text/plain',
        url: '',
      }).success
    ).toBe(true);

    expect(
      schema.safeParse({
        purpose: 'project_text',
        content: bytes,
        name: 'list.txt',
        mimeType: 'text/plain',
        url: null,
      }).success
    ).toBe(true);

    // And prepare still picks the source that was really given.
    const prepared = await upload_file.prepare(
      {
        purpose: 'project_text',
        content: bytes,
        name: 'list.txt',
        mimeType: 'text/plain',
        url: '',
      },
      context
    );

    expect('error' in prepared).toBe(false);
    if ('error' in prepared) return;
    expect(prepared.source).toBe('content');
  });

  test('refuses a URL the stdio server was never offered', async () => {
    const prepared = await upload_file.prepare(
      { purpose: 'project_text', url: 'https://example.com/list.txt' },
      { mode: 'stdio' }
    );

    expect('error' in prepared).toBe(true);
    if (!('error' in prepared)) return;

    const body = refusal(prepared);
    expect(body.error).toBe('invalid_file_source');
    // The message names what this transport does take, not what it does not.
    expect(body.message).toContain('`file`');
    expect(body.message).not.toContain('`url`');
  });

  test('refuses a call that names no source', async () => {
    const prepared = await upload_file.prepare(
      { purpose: 'project_text' },
      context
    );

    expect('error' in prepared).toBe(true);
    if (!('error' in prepared)) return;
    expect(refusal(prepared)).toMatchObject({ error: 'invalid_file_source' });
  });

  test('refuses a call that names two sources', async () => {
    const prepared = await upload_file.prepare(
      {
        purpose: 'project_text',
        content: Buffer.from('a').toString('base64'),
        name: 'list.txt',
        mimeType: 'text/plain',
        url: 'https://example.com/list.txt',
      },
      context
    );

    expect('error' in prepared).toBe(true);
    if (!('error' in prepared)) return;
    // The same word the import call uses for the same mistake.
    expect(refusal(prepared)).toMatchObject({ error: 'invalid_file_source' });
  });

  test('refuses bytes without the name an import would use as a title', async () => {
    const prepared = await upload_file.prepare(
      {
        purpose: 'project_text',
        content: Buffer.from('a').toString('base64'),
        mimeType: 'text/plain',
      },
      context
    );

    expect('error' in prepared).toBe(true);
    if (!('error' in prepared)) return;
    expect(refusal(prepared)).toMatchObject({ error: 'invalid_content' });
  });
});
