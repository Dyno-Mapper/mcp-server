import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { ApiHelper } from './api.js';

// One shared request mock: api.ts only ever reaches axios through
// axios.create(), so replacing the factory is enough to drive every call.
const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('axios', () => ({
  default: { create: () => ({ request }) },
}));

// api.ts loads uploads off disk. Only the two fixture paths exist, and the
// missing ones must throw the same way fs does.
vi.mock('node:fs', async (importOriginal) => {
  // api.ts reaches fs through its default export, so the mock has to carry the
  // replacements on the default as well as on the named exports.
  type FsModule = typeof import('node:fs');
  const actual = await importOriginal<FsModule & { default: FsModule }>();

  const existsSync = (filePath: string) =>
    filePath === '/tmp/test.txt' || filePath === '/tmp/test.xml';

  const readFileSync = (filePath: string) => {
    if (filePath === '/tmp/test.txt') return Buffer.from('test content');
    if (filePath === '/tmp/test.xml') {
      return Buffer.from('<xml>test content</xml>');
    }
    throw new Error('File not found');
  };

  return {
    ...actual,
    default: { ...actual.default, existsSync, readFileSync },
    existsSync,
    readFileSync,
  };
});

beforeEach(() => {
  request.mockReset();
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

    mockClient.request.mockImplementationOnce(async (config: any) => {
      expect(config.method).toBe('GET');
      expect(config.url).toBe('/test-path');
      expect(config.params).toEqual({ id: 123 });
      expect(config.data).toBeUndefined();
      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest('GET', '/test-path', {
      id: 123,
    });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    const data = JSON.parse((result.content[0] as any).text);
    expect(data).toEqual(mockResponse.data);
  });

  test('should handle successful POST request', async () => {
    const mockResponse = {
      data: { success: true, message: 'POST successful' },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mockImplementationOnce(async (config: any) => {
      expect(config.method).toBe('POST');
      expect(config.url).toBe('/test-path');
      expect(config.data).toEqual({ name: 'test' });
      expect(config.params).toBeUndefined();
      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest('POST', '/test-path', {
      name: 'test',
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as any).text);
    expect(data).toEqual(mockResponse.data);
  });

  test('should handle request errors via handleError', async () => {
    const mockError = {
      response: {
        data: { error: 'Not Found', message: 'Item not found' },
        status: 404,
      },
    };

    mockClient.request.mockImplementationOnce(async () => {
      throw mockError;
    });

    const result = await apiHelper.handleToolRequest('GET', '/not-found', {});

    expect(result.isError).toBe(true);
    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.error).toBe('Not Found');
    expect(errorData.message).toBe('Item not found');
  });

  test('should send a JSON body for multiPart: true when no file is given', async () => {
    const mockResponse = {
      data: { success: true, id: 1 },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mockImplementationOnce(async (config: any) => {
      expect(config.method).toBe('POST');
      expect(config.url).toBe('/v1/project/text');
      // No file means one source only, so the request goes out as JSON
      // instead of multipart: a file part plus a body source is refused.
      expect(config.data instanceof FormData).toBe(false);
      expect(config.data).toEqual({
        url: 'https://example.com/urllist.txt',
      });
      expect(config.headers['Content-Type']).toBe('application/json');

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

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as any).text);
    expect(data).toEqual(mockResponse.data);
  });

  test('should send a JSON body when only a fileKey is given', async () => {
    const mockResponse = {
      data: { success: true, id: 2 },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mockImplementationOnce(async (config: any) => {
      expect(config.data instanceof FormData).toBe(false);
      expect(config.data).toEqual({
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

    expect(result.isError).toBeUndefined();
  });

  test('should send each argument as a form field for multiPart: fields', async () => {
    const mockResponse = {
      data: { key: 'uploads/api/project_text/b2/file.txt' },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mockImplementationOnce(async (config: any) => {
      expect(config.method).toBe('POST');
      expect(config.url).toBe('/v1/files');
      expect(config.data instanceof FormData).toBe(true);

      const formData = config.data as FormData;
      expect(formData.get('purpose')).toBe('project_text');
      expect(formData.has('file')).toBe(true);
      // An upload carries fields next to the file, not a JSON body part.
      expect(formData.has('body')).toBe(false);

      const file = formData.get('file') as any;
      expect(file.name).toBe('test.txt');
      expect(file.type).toBe('text/plain');
      expect(config.headers['Content-Type']).toBeUndefined();

      return { ...mockResponse, config };
    });

    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/files',
      { purpose: 'project_text', file: '/tmp/test.txt' },
      undefined,
      'fields'
    );

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as any).text);
    expect(data).toEqual(mockResponse.data);
  });

  test('should return an error when multiPart: fields has a missing file', async () => {
    const result = await apiHelper.handleToolRequest(
      'POST',
      '/v1/files',
      { purpose: 'project_text', file: '/tmp/non-existent.txt' },
      undefined,
      'fields'
    );

    expect(result.isError).toBe(true);
    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.error).toBe('File not found');
    expect(errorData.message).toContain('/tmp/non-existent.txt');
  });

  test('should handle successful POST request with multiPart: true and file', async () => {
    const mockResponse = {
      data: { success: true, id: 2 },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mockImplementationOnce(async (config: any) => {
      expect(config.method).toBe('POST');
      expect(config.url).toBe('/v1/project/text');
      expect(config.data instanceof FormData).toBe(true);

      const formData = config.data as FormData;
      expect(formData.has('file')).toBe(true);
      expect(formData.has('body')).toBe(true);

      const file = formData.get('file') as any;
      expect(file.name).toBe('test.txt');
      expect(file.type).toBe('text/plain');

      const body = JSON.parse(await (formData.get('body') as File).text());
      expect(body.speed).toBe('slowest');

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

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as any).text);
    expect(data).toEqual(mockResponse.data);
  });

  test('should handle successful POST request with multiPart: true and xml file', async () => {
    const mockResponse = {
      data: { success: true, id: 3 },
      status: 201,
      config: { headers: {} },
    };

    mockClient.request.mockImplementationOnce(async (config: any) => {
      expect(config.method).toBe('POST');
      expect(config.url).toBe('/v1/project/xml');
      expect(config.data instanceof FormData).toBe(true);

      const formData = config.data as FormData;
      expect(formData.has('file')).toBe(true);

      const file = formData.get('file') as any;
      expect(file.name).toBe('test.xml');
      expect(file.type).toBe('application/xml');

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

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as any).text);
    expect(data).toEqual(mockResponse.data);
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

    expect(result.isError).toBe(true);
    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.error).toBe('File not found');
    expect(errorData.message).toContain('/tmp/non-existent.txt');
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

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');

    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.error).toBe('Bad Request');
    expect(errorData.message).toBe('Invalid input parameters');
  });

  test('should handle axios response error without data (fallback)', async () => {
    const mockError = {
      message: 'Network response was not ok',
      response: {
        status: 500,
      },
    };

    const result = await apiHelper.handleError(mockError);

    expect(result.isError).toBe(true);
    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.error).toBe('API Error');
    expect(errorData.message).toBe('Network response was not ok');
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

    expect(result.isError).toBe(true);
    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.code).toBe('rate_limit_exceeded');
    expect(errorData.retryAfter).toBe(12);
    expect(errorData.rateLimitLimit).toBe(60);
    expect(errorData.rateLimitRemaining).toBe(0);
    expect(errorData.rateLimitReset).toBe(12);
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
    expect(errorData.retryAfter).toBeUndefined();
  });

  test('should handle axios request error (no response)', async () => {
    const mockError = {
      request: {},
    };

    const result = await apiHelper.handleError(mockError);

    expect(result.isError).toBe(true);
    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.error).toBe('Network Error');
    expect(errorData.message).toBe('No response received from the API');
  });

  test('should handle general error (setup error)', async () => {
    const mockError = new Error('Generic error message');

    const result = await apiHelper.handleError(mockError);

    expect(result.isError).toBe(true);
    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.error).toBe('Request Error');
    expect(errorData.message).toBe('Generic error message');
  });

  test('should handle error without message', async () => {
    const mockError = {};

    const result = await apiHelper.handleError(mockError);

    expect(result.isError).toBe(true);
    const errorData = JSON.parse((result.content[0] as any).text);
    expect(errorData.error).toBe('Request Error');
    expect(errorData.message).toBe('Error setting up the request');
  });
});

describe('ApiHelper.resolvePath', () => {
  const apiHelper = new ApiHelper('https://api.example.com', 'test-key');

  test('should return same path if no variables exist', () => {
    const path = '/projects';
    const args = { id: 123 };
    const result = apiHelper.resolvePath(path, args);

    expect(result.path).toBe('/projects');
    expect(result.args).toEqual({ id: 123 });
  });

  test('should resolve single path variable and remove it from args', () => {
    const path = '/projects/{id}';
    const args = { id: 123, other: 'test' };
    const result = apiHelper.resolvePath(path, args);

    expect(result.path).toBe('/projects/123');
    expect(result.args).toEqual({ other: 'test' });
  });

  test('should resolve multiple path variables', () => {
    const path = '/projects/{projectId}/items/{itemId}';
    const args = { projectId: 'p1', itemId: 'i1', extra: true };
    const result = apiHelper.resolvePath(path, args);

    expect(result.path).toBe('/projects/p1/items/i1');
    expect(result.args).toEqual({ extra: true });
  });

  test('should not resolve variable if not in args', () => {
    const path = '/projects/{id}';
    const args = { other: 'test' };
    const result = apiHelper.resolvePath(path, args);

    expect(result.path).toBe('/projects/{id}');
    expect(result.args).toEqual({ other: 'test' });
  });

  test('should handle null or undefined args', () => {
    const path = '/projects/{id}';
    expect(apiHelper.resolvePath(path, null)).toEqual({
      path,
      args: null,
    });
    expect(apiHelper.resolvePath(path, undefined)).toEqual({
      path,
      args: undefined,
    });
  });

  test('should handle multiple occurrences of the same variable', () => {
    const path = '/projects/{id}/duplicate/{id}';
    const args = { id: 123 };
    const result = apiHelper.resolvePath(path, args);

    // resolvePath replaces by matched text and deletes the variable from the
    // remaining args, so the second occurrence of {id} is left unresolved.
    // This pins that behaviour rather than endorsing it.
    expect(result.path).toBe('/projects/123/duplicate/{id}');
    expect(result.args).toEqual({});
  });
});
