import axios from 'axios';
import fs from 'node:fs';
import * as pathMod from 'node:path';
import mime from 'mime-types';
export class ApiHelper {
    baseUrl;
    apiKey;
    client;
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
        });
    }
    resolveApiKey(apiKey) {
        if (!apiKey.startsWith('Bearer ')) {
            return `Bearer ${apiKey}`;
        }
        return apiKey;
    }
    resolvePath(path, args) {
        if (!args) {
            return { path, args };
        }
        const remainingArgs = { ...args };
        let resolvedPath = path;
        const matches = path.matchAll(/\{([^}]+)\}/g);
        for (const match of matches) {
            const varName = match[1];
            if (varName in remainingArgs) {
                resolvedPath = resolvedPath.replace(match[0], String(remainingArgs[varName]));
                delete remainingArgs[varName];
            }
        }
        return { path: resolvedPath, args: remainingArgs };
    }
    buildFilePart(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = pathMod.basename(filePath);
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
        return { blob: new Blob([fileBuffer], { type: mimeType }), fileName };
    }
    fileNotFoundResult(filePath) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: 'File not found',
                        message: `The specified file was not found: ${filePath}`,
                    }),
                },
            ],
            isError: true,
        };
    }
    /**
     * Builds the request body for a multipart tool.
     *
     * `'fields'` sends every argument as its own form field next to the file,
     * which is the shape an upload expects. `'file-and-body'` sends the file
     * part next to a JSON `body` part, which is how the text and XML imports
     * carry their options.
     */
    buildMultipartBody(finalArgs, mode) {
        const formData = new FormData();
        if (mode === 'fields') {
            for (const [key, value] of Object.entries(finalArgs ?? {})) {
                if (value === undefined || value === null) {
                    continue;
                }
                if (key === 'file') {
                    if (!fs.existsSync(String(value))) {
                        return { error: this.fileNotFoundResult(String(value)) };
                    }
                    const { blob, fileName } = this.buildFilePart(String(value));
                    formData.append('file', blob, fileName);
                    continue;
                }
                formData.append(key, String(value));
            }
            return { data: formData };
        }
        const { file, ...restArgs } = finalArgs || {};
        if (!fs.existsSync(file)) {
            return { error: this.fileNotFoundResult(file) };
        }
        const { blob, fileName } = this.buildFilePart(file);
        formData.append('file', blob, fileName);
        const jsonBody = JSON.stringify(restArgs);
        formData.append('body', new Blob([jsonBody], { type: 'application/json' }), 'body');
        return { data: formData };
    }
    async handleToolRequest(method, path, args, apiKey, multiPart) {
        try {
            const headers = {};
            if (apiKey) {
                headers.Authorization = this.resolveApiKey(apiKey);
            }
            if (!(method.toLowerCase() === 'get' || method.toLowerCase() === 'delete')) {
                headers['Content-Type'] = 'application/json';
            }
            const { path: resolvedPath, args: finalArgs } = this.resolvePath(path, args);
            let data = finalArgs;
            const hasFile = typeof finalArgs?.file === 'string' && finalArgs.file.length > 0;
            if (multiPart === 'fields' || (multiPart && hasFile)) {
                const { data: formData, error } = this.buildMultipartBody(finalArgs, multiPart === 'fields' ? 'fields' : 'file-and-body');
                if (error) {
                    return error;
                }
                data = formData;
                // Let axios handle the Content-Type with boundary for FormData
                delete headers['Content-Type'];
            }
            const response = await this.client.request({
                method,
                url: resolvedPath,
                headers,
                [method.toLowerCase() === 'get' || method.toLowerCase() === 'delete'
                    ? 'params'
                    : 'data']: data,
            });
            if (!response?.data) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                error: 'API Error',
                                message: 'No data received from the API',
                            }),
                        },
                    ],
                    isError: true,
                };
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(response.data),
                    },
                ],
                structuredContent: response.data,
            };
        }
        catch (error) {
            return this.handleError(error);
        }
    }
    /**
     * Reads the rate-limit headers the API sends with a refused request.
     *
     * Every rejected request counts against the allowance too, so the caller
     * has to wait the documented number of seconds rather than retry at once.
     */
    rateLimitInfo(headers) {
        const mapping = {
            retryAfter: 'retry-after',
            rateLimitLimit: 'ratelimit-limit',
            rateLimitRemaining: 'ratelimit-remaining',
            rateLimitReset: 'ratelimit-reset',
        };
        const info = {};
        for (const [key, header] of Object.entries(mapping)) {
            const raw = headers?.[header];
            const value = Number(Array.isArray(raw) ? raw[0] : raw);
            if (Number.isFinite(value)) {
                info[key] = value;
            }
        }
        return info;
    }
    async handleError(error) {
        let errorResponse;
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            errorResponse = error.response.data || {
                error: 'API Error',
                message: error.message || 'Unknown API error',
            };
            if (error.response.status === 429) {
                errorResponse = {
                    ...errorResponse,
                    ...this.rateLimitInfo(error.response.headers),
                };
            }
        }
        else if (error.request) {
            // The request was made but no response was received
            errorResponse = {
                error: 'Network Error',
                message: 'No response received from the API',
            };
        }
        else {
            // Something happened in setting up the request that triggered an Error
            errorResponse = {
                error: 'Request Error',
                message: error.message || 'Error setting up the request',
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(errorResponse),
                },
            ],
            isError: true,
        };
    }
}
