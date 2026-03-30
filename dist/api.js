import axios from 'axios';
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
                'Content-Type': 'application/json',
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
    async handleToolRequest(method, path, args, apiKey) {
        try {
            const headers = {};
            if (apiKey) {
                headers.Authorization = this.resolveApiKey(apiKey);
            }
            const { path: resolvedPath, args: finalArgs } = this.resolvePath(path, args);
            const response = await this.client.request({
                method,
                url: resolvedPath,
                headers,
                [method.toLowerCase() === 'get' || method.toLowerCase() === 'delete'
                    ? 'params'
                    : 'data']: finalArgs,
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
    async handleError(error) {
        let errorResponse;
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            errorResponse = error.response.data || {
                error: 'API Error',
                message: error.message || 'Unknown API error',
            };
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
