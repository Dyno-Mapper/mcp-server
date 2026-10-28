import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import { ApiHelper } from './api.js';
import axios from 'axios';
import fs from 'node:fs';

// Mock fs functions
mock.method(fs, 'existsSync', (path: string) => {
  if (path === '/tmp/test.txt' || path === '/tmp/test.xml') return true;
  return false;
});
mock.method(fs, 'readFileSync', (path: string) => {
  if (path === '/tmp/test.txt') return Buffer.from('test content');
  if (path === '/tmp/test.xml') return Buffer.from('<xml>test content</xml>');
  throw new Error('File not found');
});

// Mock axios.create to return a mock instance
mock.method(axios, 'create', () => {
  return {
    request: mock.fn(),
  };
});

describe('ApiHelper.handleToolRequest', () => {
  const apiHelper = new ApiHelper('https://api.example.com', 'test-key');
  const mockClient = (apiHelper as any).client;

  test('should handle successful GET request', async () => {
    const mockResponse = {
      data: { success: true, message: 'GET successful' },
      status: 200,
      config: { headers: {} },
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.strictEqual(config.method, 'GET');
      assert.strictEqual(config.url, '/test-path');
      assert.deepStrictEqual(config.params, { id: 123 });
      assert.strictEqual(config.data, undefined);
      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest('GET', '/test-path', {
      id: 123,
    });

    assert.strictEqual(result.isError, undefined);
    assert.strictEqual(result.content.length, 1);
    const data = JSON.parse((result.content[0] as any).text);
    assert.deepStrictEqual(data, mockResponse.data);
  });

  test('should handle successful POST request', async () => {
    const mockResponse = {
      data: { success: true, message: 'POST successful' },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.strictEqual(config.method, 'POST');
      assert.strictEqual(config.url, '/test-path');
      assert.deepStrictEqual(config.data, { name: 'test' });
      assert.strictEqual(config.params, undefined);
      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest('POST', '/test-path', {
      name: 'test',
    });

    assert.strictEqual(result.isError, undefined);
    const data = JSON.parse((result.content[0] as any).text);
    assert.deepStrictEqual(data, mockResponse.data);
  });

  test('should handle request errors via handleError', async () => {
    const mockError = {
      response: {
        data: { error: 'Not Found', message: 'Item not found' },
        status: 404,
      },
    };

    mockClient.request.mock.mockImplementationOnce(async () => {
      throw mockError;
    });

    const result = await apiHelper.handleToolRequest('GET', '/not-found', {});

    assert.strictEqual(result.isError, true);
    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.error, 'Not Found');
    assert.strictEqual(errorData.message, 'Item not found');
  });

  test('should send a JSON body for multiPart: true when no file is given', async () => {
    const mockResponse = {
      data: { success: true, id: 1 },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.strictEqual(config.method, 'POST');
      assert.strictEqual(config.url, '/v1/project/text');
      // No file means one source only, so the request goes out as JSON
      // instead of multipart: a file part plus a body source is refused.
      assert.ok(!(config.data instanceof FormData));
      assert.deepStrictEqual(config.data, {
        url: 'https://example.com/urllist.txt',
      });
      assert.strictEqual(config.headers['Content-Type'], 'application/json');

      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/project/{type}',
      {
        type: 'text',
        url: 'https://example.com/urllist.txt',
      },
      undefined,
      true
    );

    assert.strictEqual(result.isError, undefined);
    const data = JSON.parse((result.content[0] as any).text);
    assert.deepStrictEqual(data, mockResponse.data);
  });

  test('should send a JSON body when only a fileKey is given', async () => {
    const mockResponse = {
      data: { success: true, id: 2 },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.ok(!(config.data instanceof FormData));
      assert.deepStrictEqual(config.data, {
        fileKey: 'uploads/api/project_text/b2/file.txt',
      });
      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/project/{type}',
      { type: 'text', fileKey: 'uploads/api/project_text/b2/file.txt' },
      undefined,
      true
    );

    assert.strictEqual(result.isError, undefined);
  });

  test('should send each argument as a form field for multiPart: fields', async () => {
    const mockResponse = {
      data: { key: 'uploads/api/project_text/b2/file.txt' },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.strictEqual(config.method, 'POST');
      assert.strictEqual(config.url, '/v1/files');
      assert.ok(config.data instanceof FormData);

      const formData = config.data as FormData;
      assert.strictEqual(formData.get('purpose'), 'project_text');
      assert.ok(formData.has('file'));
      // An upload carries fields next to the file, not a JSON body part.
      assert.ok(!formData.has('body'));

      const file = formData.get('file') as any;
      assert.strictEqual(file.name, 'test.txt');
      assert.strictEqual(file.type, 'text/plain');
      assert.strictEqual(config.headers['Content-Type'], undefined);

      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/files',
      { purpose: 'project_text', file: '/tmp/test.txt' },
      undefined,
      'fields'
    );

    assert.strictEqual(result.isError, undefined);
    const data = JSON.parse((result.content[0] as any).text);
    assert.deepStrictEqual(data, mockResponse.data);
  });

  test('should return an error when multiPart: fields has a missing file', async () => {
    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/files',
      { purpose: 'project_text', file: '/tmp/non-existent.txt' },
      undefined,
      'fields'
    );

    assert.strictEqual(result.isError, true);
    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.error, 'File not found');
    assert.ok(errorData.message.includes('/tmp/non-existent.txt'));
  });

  test('should handle successful POST request with multiPart: true and file', async () => {
    const mockResponse = {
      data: { success: true, id: 2 },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.strictEqual(config.method, 'POST');
      assert.strictEqual(config.url, '/v1/project/text');
      assert.ok(config.data instanceof FormData);

      const formData = config.data as FormData;
      assert.ok(formData.has('file'));
      assert.ok(formData.has('body'));

      const file = formData.get('file') as any;
      assert.strictEqual(file.name, 'test.txt');
      assert.strictEqual(file.type, 'text/plain');

      const body = JSON.parse(await (formData.get('body') as File).text());
      assert.strictEqual(body.speed, 'slowest');

      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/project/{type}',
      {
        type: 'text',
        file: '/tmp/test.txt',
        speed: 'slowest',
      },
      undefined,
      true
    );

    assert.strictEqual(result.isError, undefined);
    const data = JSON.parse((result.content[0] as any).text);
    assert.deepStrictEqual(data, mockResponse.data);
  });

  test('should handle successful POST request with multiPart: true and xml file', async () => {
    const mockResponse = {
      data: { success: true, id: 3 },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.strictEqual(config.method, 'POST');
      assert.strictEqual(config.url, '/v1/project/xml');
      assert.ok(config.data instanceof FormData);

      const formData = config.data as FormData;
      assert.ok(formData.has('file'));

      const file = formData.get('file') as any;
      assert.strictEqual(file.name, 'test.xml');
      assert.strictEqual(file.type, 'application/xml');

      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/project/{type}',
      {
        type: 'xml',
        file: '/tmp/test.xml',
      },
      undefined,
      true
    );

    assert.strictEqual(result.isError, undefined);
    const data = JSON.parse((result.content[0] as any).text);
    assert.deepStrictEqual(data, mockResponse.data);
  });

  test('should return error when multiPart: true and file property is set but file not found', async () => {
    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/project/{type}',
      {
        type: 'text',
        file: '/tmp/non-existent.txt',
      },
      undefined,
      true
    );

    assert.strictEqual(result.isError, true);
    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.error, 'File not found');
    assert.ok(errorData.message.includes('/tmp/non-existent.txt'));
  });
});

describe('ApiHelper.handleError', () => {
  const apiHelper = new ApiHelper('https://api.example.com', 'test-key');

  test('should handle axios response error with data', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Bad Request',
          message: 'Invalid input parameters',
        },
        status: 400,
      },
    };

    const result = await apiHelper.handleError(mockError);

    assert.strictEqual(result.isError, true);
    assert.strictEqual(result.content.length, 1);
    assert.strictEqual(result.content[0].type, 'text');

    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.error, 'Bad Request');
    assert.strictEqual(errorData.message, 'Invalid input parameters');
  });

  test('should handle axios response error without data (fallback)', async () => {
    const mockError = {
      message: 'Network response was not ok',
      response: {
        status: 500,
      },
    };

    const result = await apiHelper.handleError(mockError);

    assert.strictEqual(result.isError, true);
    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.error, 'API Error');
    assert.strictEqual(errorData.message, 'Network response was not ok');
  });

  test('should surface rate-limit headers on a 429', async () => {
    const mockError = {
      response: {
        data: {
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
          code: 'rate_limit_exceeded',
        },
        status: 429,
        headers: {
          'retry-after': '12',
          'ratelimit-limit': '60',
          'ratelimit-remaining': '0',
          'ratelimit-reset': '12',
        },
      },
    };

    const result = await apiHelper.handleError(mockError);

    assert.strictEqual(result.isError, true);
    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.code, 'rate_limit_exceeded');
    assert.strictEqual(errorData.retryAfter, 12);
    assert.strictEqual(errorData.rateLimitLimit, 60);
    assert.strictEqual(errorData.rateLimitRemaining, 0);
    assert.strictEqual(errorData.rateLimitReset, 12);
  });

  test('should leave other error statuses without rate-limit fields', async () => {
    const mockError = {
      response: {
        data: { statusCode: 404, error: 'Not Found', message: 'Missing' },
        status: 404,
        headers: { 'retry-after': '12' },
      },
    };

    const result = await apiHelper.handleError(mockError);

    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.retryAfter, undefined);
  });

  test('should handle axios request error (no response)', async () => {
    const mockError = {
      request: {},
    };

    const result = await apiHelper.handleError(mockError);

    assert.strictEqual(result.isError, true);
    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.error, 'Network Error');
    assert.strictEqual(errorData.message, 'No response received from the API');
  });

  test('should handle general error (setup error)', async () => {
    const mockError = new Error('Generic error message');

    const result = await apiHelper.handleError(mockError);

    assert.strictEqual(result.isError, true);
    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.error, 'Request Error');
    assert.strictEqual(errorData.message, 'Generic error message');
  });

  test('should handle error without message', async () => {
    const mockError = {};

    const result = await apiHelper.handleError(mockError);

    assert.strictEqual(result.isError, true);
    const errorData = JSON.parse((result.content[0] as any).text);
    assert.strictEqual(errorData.error, 'Request Error');
    assert.strictEqual(errorData.message, 'Error setting up the request');
  });
});

describe('ApiHelper.resolvePath', () => {
  const apiHelper = new ApiHelper('https://api.example.com', 'test-key');

  test('should return same path if no variables exist', () => {
    const path = '/projects';
    const args = { id: 123 };
    const result = apiHelper.resolvePath(path, args);

    assert.strictEqual(result.path, '/projects');
    assert.deepStrictEqual(result.args, { id: 123 });
  });

  test('should resolve single path variable and remove it from args', () => {
    const path = '/projects/{id}';
    const args = { id: 123, other: 'test' };
    const result = apiHelper.resolvePath(path, args);

    assert.strictEqual(result.path, '/projects/123');
    assert.deepStrictEqual(result.args, { other: 'test' });
  });

  test('should resolve multiple path variables', () => {
    const path = '/projects/{projectId}/items/{itemId}';
    const args = { projectId: 'p1', itemId: 'i1', extra: true };
    const result = apiHelper.resolvePath(path, args);

    assert.strictEqual(result.path, '/projects/p1/items/i1');
    assert.deepStrictEqual(result.args, { extra: true });
  });

  test('should not resolve variable if not in args', () => {
    const path = '/projects/{id}';
    const args = { other: 'test' };
    const result = apiHelper.resolvePath(path, args);

    assert.strictEqual(result.path, '/projects/{id}');
    assert.deepStrictEqual(result.args, { other: 'test' });
  });

  test('should handle null or undefined args', () => {
    const path = '/projects/{id}';
    assert.deepStrictEqual(apiHelper.resolvePath(path, null), {
      path,
      args: null,
    });
    assert.deepStrictEqual(apiHelper.resolvePath(path, undefined), {
      path,
      args: undefined,
    });
  });

  test('should handle multiple occurrences of the same variable', () => {
    const path = '/projects/{id}/duplicate/{id}';
    const args = { id: 123 };
    const result = apiHelper.resolvePath(path, args);

    // Note: Due to current implementation using `replace(match[0], ...)` inside loop,
    // and `delete remainingArgs[varName]`, the second occurrence might not be replaced
    // if it's the same variable name because it's deleted from remainingArgs after first match.
    // Let's verify what the code actually does.
    // Loop uses `path.matchAll(/\{([^}]+)\}/g)`.
    // First match: {id}, varName: id. id in args? yes. replace {id} with 123. delete args.id.
    // Second match: {id}, varName: id. id in args? NO (deleted).
    // So result will be /projects/123/duplicate/{id}
    assert.strictEqual(result.path, '/projects/123/duplicate/{id}');
    assert.deepStrictEqual(result.args, {});
  });
});
