import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ApiHelper } from './api.js';
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
