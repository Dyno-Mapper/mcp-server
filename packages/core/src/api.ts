import axios, { AxiosInstance } from 'axios';
import { type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs';
import * as pathMod from 'node:path';
import mime from 'mime-types';

export class ApiHelper {
  private client: AxiosInstance;
  private readonly timeoutMs?: number;

  constructor(
    readonly baseUrl: string,
    readonly apiKey: string,
    options: { timeoutMs?: number } = {}
  ) {
    this.timeoutMs = options.timeoutMs;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      ...(options.timeoutMs ? { timeout: options.timeoutMs } : {}),
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

  private buildFilePart(filePath: string): { blob: Blob; fileName: string } {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = pathMod.basename(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    return { blob: new Blob([fileBuffer], { type: mimeType }), fileName };
  }

  private fileNotFoundResult(filePath: string): CallToolResult {
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
  private buildMultipartBody(
    finalArgs: any,
    mode: 'fields' | 'file-and-body'
  ): { data?: FormData; error?: CallToolResult } {
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
    formData.append(
      'body',
      new Blob([jsonBody], { type: 'application/json' }),
      'body'
    );

    return { data: formData };
  }

  async handleToolRequest(
    method: string,
    path: string,
    args: any,
    apiKey?: string,
    multiPart?: boolean | 'fields'
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
      const hasFile =
        typeof finalArgs?.file === 'string' && finalArgs.file.length > 0;

      if (multiPart === 'fields' || (multiPart && hasFile)) {
        const { data: formData, error } = this.buildMultipartBody(
          finalArgs,
          multiPart === 'fields' ? 'fields' : 'file-and-body'
        );

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

      // A successful `204` carries no body, and neither does a `200` that the
      // API answers with nothing. That is a success with an empty object, not
      // the error the generic empty-response branch below reports.
      const emptySuccess =
        response?.status === 204 ||
        response?.data === '' ||
        response?.data == null;

      if (emptySuccess) {
        const data = {};

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data),
            },
          ],
          structuredContent: data,
        };
      }

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

  /**
   * Reads the rate-limit headers the API sends with a refused request.
   *
   * Every rejected request counts against the allowance too, so the caller
   * has to wait the documented number of seconds rather than retry at once.
   */
  private rateLimitInfo(headers: any): Record<string, number> {
    const mapping: Record<string, string> = {
      retryAfter: 'retry-after',
      rateLimitLimit: 'ratelimit-limit',
      rateLimitRemaining: 'ratelimit-remaining',
      rateLimitReset: 'ratelimit-reset',
    };
    const info: Record<string, number> = {};

    for (const [key, header] of Object.entries(mapping)) {
      const raw = headers?.[header];
      const value = Number(Array.isArray(raw) ? raw[0] : raw);
      if (Number.isFinite(value)) {
        info[key] = value;
      }
    }

    return info;
  }

  async handleError(error: any): Promise<CallToolResult> {
    let errorResponse: { error: string; message: string } & Record<string, any>;

    // The hosted transport caps a call below CloudFront's response timeout, so
    // a slow endpoint has to become advice the agent can act on rather than a
    // 504 from the CDN with no JSON-RPC body.
    if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
      const seconds = Math.round((this.timeoutMs ?? 0) / 1000);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Request Timeout',
              message:
                `The DYNO Mapper API did not answer within ${seconds} seconds. ` +
                'Narrow the query — a smaller page size, a single project, or a shorter date range — and try again.',
            }),
          },
        ],
        isError: true,
      };
    }

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
