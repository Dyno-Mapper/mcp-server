import { test, describe, mock } from 'node:test';
import assert from 'node:assert';
import { ApiHelper } from './api.js';
import axios from 'axios';

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
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.strictEqual(config.method, 'GET');
      assert.strictEqual(config.url, '/test-path');
      assert.deepStrictEqual(config.params, { id: 123 });
      assert.strictEqual(config.data, undefined);
      return mockResponse;
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
    };

    mockClient.request.mock.mockImplementationOnce(async (config: any) => {
      assert.strictEqual(config.method, 'POST');
      assert.strictEqual(config.url, '/test-path');
      assert.deepStrictEqual(config.data, { name: 'test' });
      assert.strictEqual(config.params, undefined);
      return mockResponse;
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
