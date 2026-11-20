import { describe, expect, test } from 'vite-plus/test';
import { upload_file } from './upload_file.js';

describe('upload_file arguments', () => {
  test('takes a path and a purpose, and nothing else', () => {
    const shape = Object.keys(upload_file.inputSchema.shape);

    expect(shape).toEqual(expect.arrayContaining(['purpose', 'file']));
    // A hosted server cannot read the caller's disk, so it does not offer this
    // tool at all: the bytes go through `create_upload_ticket` instead. With
    // only one transport left there is nothing for a source argument to choose
    // between, and no way for a caller to send bytes it cannot describe.
    expect(shape).not.toContain('content');
    expect(shape).not.toContain('url');
    expect(shape).not.toContain('name');
    expect(shape).not.toContain('mimeType');
  });

  test('takes one API call, not a menu of them', () => {
    expect(upload_file.method).toBe('post');
    expect(upload_file.path).toBe('/v1/files');
    expect(upload_file.multipart).toBe('fields');
  });

  test('says where a hosted agent gets its file instead', () => {
    expect(upload_file.description).toContain('create_upload_ticket');
    expect(upload_file.description).toContain('absolute path');
  });
});
