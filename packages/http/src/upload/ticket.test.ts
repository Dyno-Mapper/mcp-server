import { describe, expect, test } from 'vite-plus/test';
import {
  PURPOSE_MAX_BYTES,
  openTicket,
  safeName,
  sealTicket,
  ticketKey,
  type TicketClaims,
} from './ticket.js';

const KEY = ticketKey('your_upload_secret_of_at_least_32_characters');
const OTHER_KEY = ticketKey('example_other_secret_of_at_least_32_chars');

function claims(overrides: Partial<TicketClaims> = {}): TicketClaims {
  return {
    token: 'personal-access-token',
    purpose: 'sitemap_content_image',
    name: 'shot.png',
    mimeType: 'image/png',
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

describe('sealing a ticket', () => {
  test('round trips every claim', () => {
    const original = claims();
    const opened = openTicket(sealTicket(original, KEY), KEY);

    expect(opened.ok).toBe(true);
    if (opened.ok) {
      expect(opened.claims).toEqual(original);
    }
  });

  test('is one URL path segment, whatever the token contains', () => {
    // A base64 token carries `/`, `+` and `=`; sealing is what keeps those out
    // of the path, so the URL needs no escaping and survives a `curl` line.
    const sealed = sealTicket(claims({ token: 'a/b+c==' }), KEY);

    expect(sealed).toMatch(/^[A-Za-z0-9_-]+$/);
    const inPath = `/upload/${sealed}`;
    expect(inPath.split('/')).toHaveLength(3);
    expect(openTicket(sealed, KEY).ok).toBe(true);
  });

  test('rejects a flipped byte rather than returning garbage', () => {
    const sealed = sealTicket(claims(), KEY);
    const raw = Buffer.from(sealed, 'base64url');
    raw[raw.length - 1] = (raw[raw.length - 1] ?? 0) ^ 0x01;
    const tampered = raw.toString('base64url');

    expect(openTicket(tampered, KEY)).toEqual({ ok: false, error: 'invalid' });
  });

  test('rejects a ticket sealed with another secret', () => {
    expect(openTicket(sealTicket(claims(), OTHER_KEY), KEY)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  test('rejects a truncated ticket', () => {
    const sealed = sealTicket(claims(), KEY);
    expect(openTicket(sealed.slice(0, 20), KEY)).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  test('rejects a ticket that is not one of ours at all', () => {
    expect(openTicket('not-a-ticket', KEY)).toEqual({
      ok: false,
      error: 'invalid',
    });
    expect(openTicket('', KEY)).toEqual({ ok: false, error: 'invalid' });
  });

  test('distinguishes expired from invalid, because the repair differs', () => {
    const sealed = sealTicket(claims({ expiresAt: 1_000 }), KEY);

    expect(openTicket(sealed, KEY, 2_000)).toEqual({
      ok: false,
      error: 'expired',
    });
  });

  test('carries the purposes the API accepts and nothing else', () => {
    // The ceiling table is the whole design's foundation: a purpose it does not
    // name cannot be sealed, so the route can index it without a fallback.
    expect(Object.keys(PURPOSE_MAX_BYTES).sort()).toEqual([
      'pdf_accessibility',
      'project_text',
      'project_xml',
      'sitemap_content_file',
      'sitemap_content_image',
    ]);
  });
});

describe('safeName', () => {
  test('removes the characters that would break the multipart header', () => {
    expect(safeName('a"bXc\r\nd.png')).toBe('a_bXc__d.png');
  });

  test('removes a directory, the way the API does', () => {
    expect(safeName('../../etc/passwd')).toBe('passwd');
    expect(safeName('C:\\Users\\me\\shot.png')).toBe('shot.png');
  });

  test('keeps a name a caller would recognise', () => {
    expect(safeName('Q3 report (final).pdf')).toBe('Q3 report (final).pdf');
  });

  test('never returns an empty name', () => {
    expect(safeName('')).toBe('upload');
    expect(safeName('""').length).toBeGreaterThan(0);
  });

  test('bounds the length', () => {
    expect(safeName('x'.repeat(500)).length).toBe(200);
  });
});
