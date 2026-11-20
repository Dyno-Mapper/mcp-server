import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import * as pathMod from 'node:path';

export type UploadPurpose =
  | 'project_text'
  | 'project_xml'
  | 'pdf_accessibility'
  | 'sitemap_content_image'
  | 'sitemap_content_file';

const MIB = 1024 * 1024;

/**
 * The reference's size limits, in the bytes they cost.
 *
 * The API enforces these itself and remains the authority; the table exists so
 * an oversized upload is refused before a byte is spooled, which is the
 * difference between an instant `413` and a 64 MB write that is thrown away.
 * The reference says "64 MB" without saying which MB; the binary reading is
 * assumed, because it is the one that cannot reject a file the API would have
 * accepted.
 */
export const PURPOSE_MAX_BYTES: Record<UploadPurpose, number> = {
  project_text: 64 * MIB,
  project_xml: 64 * MIB,
  sitemap_content_file: 64 * MIB,
  pdf_accessibility: 30 * MIB,
  sitemap_content_image: 10 * MIB,
};

export function isUploadPurpose(value: unknown): value is UploadPurpose {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(PURPOSE_MAX_BYTES, value)
  );
}

/** What a sealed ticket carries. */
export interface TicketClaims {
  /**
   * The caller's bearer token, verbatim.
   *
   * A ticket has to carry it, which is the one surprising thing about this
   * design: the route has to authenticate to the API *as the caller*, and the
   * caller is an agent sandbox that has no credential of its own to present on
   * the PUT. The token is inside the ciphertext, so the URL is a capability:
   * anyone holding it can spend that upload, once, with that purpose, inside
   * the ticket's lifetime. Deleting this field would break every upload, so it
   * is not an accident and must not be "cleaned up".
   */
  token: string;
  purpose: UploadPurpose;
  name: string;
  mimeType: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

const IV_BYTES = 12;
const TAG_BYTES = 16;
/** Enough for a filename; a ticket carries no more than a few hundred bytes. */
const MAX_CLAIMS_BYTES = 4096;

const BASE64URL = /^[A-Za-z0-9_-]+$/;

/**
 * The AES key derived from `MCP_UPLOAD_SECRET`.
 *
 * Hashed rather than used directly so the operator may choose any passphrase of
 * at least 32 characters instead of a 32-byte hex string, and so the minimum
 * can be stated as a length rather than as an encoding.
 */
export function ticketKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Seals claims into a URL-safe capability.
 *
 * AES-256-GCM, not a signature: the ticket has to be *confidential* as well as
 * tamper-evident, because it carries the caller's token. Output is
 * `base64url(iv ‖ tag ‖ ciphertext)` in that order — the IV and tag have fixed
 * lengths, so no delimiters are needed — and base64url means the result is one
 * path segment that survives a URL, a `curl` line and a log line unchanged.
 */
export function sealTicket(claims: TicketClaims, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(claims), 'utf8'),
    cipher.final(),
  ]);

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    'base64url'
  );
}

export type TicketResult =
  | { ok: true; claims: TicketClaims }
  | { ok: false; error: 'invalid' | 'expired' };

/**
 * Opens a sealed ticket, distinguishing "not ours" from "ours but stale".
 *
 * Returned rather than thrown because the route answers those two cases with
 * different messages, and both are ordinary caller mistakes: a truncated URL
 * copied out of a terminal, and a ticket used after a long pause. Either way the
 * only repair available to an agent is to call `create_upload_ticket` again.
 */
export function openTicket(
  sealed: string,
  key: Buffer,
  now: number = Date.now()
): TicketResult {
  if (sealed.length === 0 || !BASE64URL.test(sealed)) {
    return { ok: false, error: 'invalid' };
  }

  const raw = Buffer.from(sealed, 'base64url');

  if (raw.length <= IV_BYTES + TAG_BYTES) {
    return { ok: false, error: 'invalid' };
  }

  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);

  let plaintext: Buffer;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    // A flipped byte, a truncated ticket, or a key from before a rotation.
    return { ok: false, error: 'invalid' };
  }

  if (plaintext.length > MAX_CLAIMS_BYTES) {
    return { ok: false, error: 'invalid' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(plaintext.toString('utf8'));
  } catch {
    return { ok: false, error: 'invalid' };
  }

  const claims = asClaims(parsed);
  if (!claims) {
    return { ok: false, error: 'invalid' };
  }

  if (claims.expiresAt <= now) {
    return { ok: false, error: 'expired' };
  }

  return { ok: true, claims };
}

function asClaims(value: unknown): TicketClaims | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.token !== 'string' ||
    candidate.token.length === 0 ||
    !isUploadPurpose(candidate.purpose) ||
    typeof candidate.name !== 'string' ||
    candidate.name.length === 0 ||
    typeof candidate.mimeType !== 'string' ||
    candidate.mimeType.length === 0 ||
    typeof candidate.expiresAt !== 'number' ||
    !Number.isFinite(candidate.expiresAt)
  ) {
    return undefined;
  }

  return {
    token: candidate.token,
    purpose: candidate.purpose,
    name: candidate.name,
    mimeType: candidate.mimeType,
    expiresAt: candidate.expiresAt,
  };
}

/**
 * The filename as the multipart framing can carry it.
 *
 * This route writes the `Content-Disposition` header by hand, so a name
 * containing a quote, a backslash or a newline would end the header early and
 * turn a filename into additional form parts. Normalising here — once, when the
 * ticket is sealed, rather than in the writer — means the sealed claim can only
 * ever hold a name the framing is safe to emit, and the writer needs no escape
 * logic of its own.
 *
 * Directory components go first, for the same reason `upload_file` already
 * strips them: the API keeps a filename, not a path.
 */
export function safeName(name: string): string {
  const base = pathMod.basename(name.replace(/\\/g, '/'));

  const cleaned = base
    // Quote, backslash and the two line terminators are the characters that
    // would break out of the quoted header value.
    .replace(/["\\\r\n]/g, '_')
    // Anything outside printable ASCII has no unambiguous representation in a
    // header without RFC 5987 encoding, which the API does not ask for.
    .replace(/[^\x20-\x7E]/g, '_')
    .trim();

  if (cleaned.length === 0) {
    return 'upload';
  }

  return cleaned.slice(0, 200);
}

/** The media type as the API reports it: lower-cased, no parameters. */
export function normaliseMediaType(mimeType: string): string {
  return (mimeType.split(';')[0] ?? '').trim().toLowerCase();
}
