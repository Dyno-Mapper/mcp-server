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
    const mockClient = apiHelper.client;
    test('should handle successful GET request', async () => {
        const mockResponse = {
            data: { success: true, message: 'GET successful' },
            status: 200,
        };
        mockClient.request.mock.mockImplementationOnce(async (config) => {
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
        const data = JSON.parse(result.content[0].text);
        assert.deepStrictEqual(data, mockResponse.data);
    });
    test('should handle successful POST request', async () => {
        const mockResponse = {
            data: { success: true, message: 'POST successful' },
            status: 201,
        };
        mockClient.request.mock.mockImplementationOnce(async (config) => {
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
        const data = JSON.parse(result.content[0].text);
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
        const errorData = JSON.parse(result.content[0].text);
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
        const errorData = JSON.parse(result.content[0].text);
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
        const errorData = JSON.parse(result.content[0].text);
        assert.strictEqual(errorData.error, 'API Error');
        assert.strictEqual(errorData.message, 'Network response was not ok');
    });
    test('should handle axios request error (no response)', async () => {
        const mockError = {
            request: {},
        };
        const result = await apiHelper.handleError(mockError);
        assert.strictEqual(result.isError, true);
        const errorData = JSON.parse(result.content[0].text);
        assert.strictEqual(errorData.error, 'Network Error');
        assert.strictEqual(errorData.message, 'No response received from the API');
    });
    test('should handle general error (setup error)', async () => {
        const mockError = new Error('Generic error message');
        const result = await apiHelper.handleError(mockError);
        assert.strictEqual(result.isError, true);
        const errorData = JSON.parse(result.content[0].text);
        assert.strictEqual(errorData.error, 'Request Error');
        assert.strictEqual(errorData.message, 'Generic error message');
    });
    test('should handle error without message', async () => {
        const mockError = {};
        const result = await apiHelper.handleError(mockError);
        assert.strictEqual(result.isError, true);
        const errorData = JSON.parse(result.content[0].text);
        assert.strictEqual(errorData.error, 'Request Error');
        assert.strictEqual(errorData.message, 'Error setting up the request');
    });
});
