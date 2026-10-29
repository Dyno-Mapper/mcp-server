import { describe, expect, test } from 'vite-plus/test';
import {
  parseEntrypoint,
  UsageError,
  type EntrypointSpec,
} from './transport.js';

const STDIO: EntrypointSpec = {
  transport: 'stdio',
  otherArtifact: 'Use the container image instead.',
};

const HTTP: EntrypointSpec = {
  transport: 'http',
  otherArtifact: 'Use the npm package instead.',
};

describe('parseEntrypoint', () => {
  test('serves when nothing selects a transport', () => {
    expect(parseEntrypoint([], {}, STDIO)).toBe('serve');
    expect(parseEntrypoint([], {}, HTTP)).toBe('serve');
  });

  test('accepts the flag and value naming its own transport', () => {
    expect(parseEntrypoint(['--stdio'], {}, STDIO)).toBe('serve');
    expect(parseEntrypoint([], { MCP_TRANSPORT: 'stdio' }, STDIO)).toBe(
      'serve'
    );
    expect(parseEntrypoint(['--http'], {}, HTTP)).toBe('serve');
    expect(parseEntrypoint([], { MCP_TRANSPORT: 'http' }, HTTP)).toBe('serve');
  });

  test('answers --help without starting anything', () => {
    expect(parseEntrypoint(['--help'], {}, STDIO)).toBe('help');
    expect(parseEntrypoint(['-h'], {}, HTTP)).toBe('help');
  });

  test('refuses the other transport with a pointer to its artifact', () => {
    expect(() => parseEntrypoint(['--http'], {}, STDIO)).toThrow(
      'Use the container image instead.'
    );
    expect(() => parseEntrypoint([], { MCP_TRANSPORT: 'http' }, STDIO)).toThrow(
      'MCP_TRANSPORT=http'
    );
    expect(() => parseEntrypoint(['--stdio'], {}, HTTP)).toThrow(
      'Use the npm package instead.'
    );
    expect(() => parseEntrypoint([], { MCP_TRANSPORT: 'stdio' }, HTTP)).toThrow(
      'MCP_TRANSPORT=stdio'
    );
  });

  test('refuses the removed SSE spelling with its replacement', () => {
    expect(() => parseEntrypoint(['--sse'], {}, STDIO)).toThrow(
      'removed in 0.2.0'
    );
    expect(() => parseEntrypoint([], { MCP_TRANSPORT: 'sse' }, HTTP)).toThrow(
      'removed in 0.2.0'
    );
  });

  test('refuses an unknown transport or flag', () => {
    expect(() =>
      parseEntrypoint([], { MCP_TRANSPORT: 'websocket' }, STDIO)
    ).toThrow('MCP_TRANSPORT');
    expect(() => parseEntrypoint(['--port', '3000'], {}, STDIO)).toThrow(
      'Unknown option'
    );
    expect(() => parseEntrypoint(['--port'], {}, HTTP)).toThrow(UsageError);
  });
});
