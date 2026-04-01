import axios, { AxiosInstance } from 'axios';
import { type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs';
import * as pathMod from 'node:path';
import mime from 'mime-types';

export class ApiHelper {
  private client: AxiosInstance;

  constructor(
    readonly baseUrl: string,
    readonly apiKey: string
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  private resolveApiKey(apiKey: string) {
    if (!apiKey.startsWith('Bearer ')) {
      return `Bearer ${apiKey}`;
    }
    return apiKey;
  }

  resolvePath(path: string, args: any): { path: string; args: any } {
    if (!args) {
      return { path, args };
    }

    const remainingArgs = { ...args };
    let resolvedPath = path;

    const matches = path.matchAll(/\{([^}]+)\}/g);
    for (const match of matches) {
      const varName = match[1];
      if (varName in remainingArgs) {
        resolvedPath = resolvedPath.replace(
          match[0],
          String(remainingArgs[varName])
        );
        delete remainingArgs[varName];
      }
    }

    return { path: resolvedPath, args: remainingArgs };
  }

  async handleToolRequest(
    method: string,
    path: string,
    args: any,
    apiKey?: string,
    multiPart?: boolean
  ): Promise<CallToolResult> {
    try {
      const headers: Record<string, string> = {};

      if (apiKey) {
        headers.Authorization = this.resolveApiKey(apiKey);
      }

      if (
        !(method.toLowerCase() === 'get' || method.toLowerCase() === 'delete')
      ) {
        headers['Content-Type'] = 'application/json';
      }

      const { path: resolvedPath, args: finalArgs } = this.resolvePath(
        path,
        args
      );

      let data = finalArgs;

      if (multiPart) {
        const formData = new FormData();
        const { file, ...restArgs } = finalArgs || {};
        if (file) {
          if (fs.existsSync(file)) {
            const fileBuffer = fs.readFileSync(file);
            const fileName = pathMod.basename(file);
            const mimeType = mime.lookup(file) || 'application/octet-stream';
            const blob = new Blob([fileBuffer], { type: mimeType });
            formData.append('file', blob, fileName);
          } else {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: 'File not found',
                    message: `The specified file was not found: ${file}`,
                  }),
                },
              ],
              isError: true,
            };
          }
        } else {
          // If file property is undefined, pass the file as empty value
          formData.append('file', '');
        }
        const jsonBody = JSON.stringify(restArgs);
        const jsonBodyBlob = new Blob([jsonBody], { type: 'application/json' });
        formData.append('body', jsonBodyBlob, 'body');

        data = formData;
        // Let axios handle the Content-Type with boundary for FormData
        if (headers['Content-Type']) {
          delete headers['Content-Type'];
        }
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
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleError(error: any): Promise<CallToolResult> {
    let errorResponse: { error: string; message: string };

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorResponse = error.response.data || {
        error: 'API Error',
        message: error.message || 'Unknown API error',
      };
    } else if (error.request) {
      // The request was made but no response was received
      errorResponse = {
        error: 'Network Error',
        message: 'No response received from the API',
      };
    } else {
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
