import axios, { AxiosInstance } from 'axios';
import { type CallToolResult } from '@modelcontextprotocol/sdk/types.js';

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
        'Content-Type': 'application/json',
      },
    });
  }

  async handleToolRequest(
    method: string,
    path: string,
    args: any
  ): Promise<CallToolResult> {
    try {
      const response = await this.client.request({
        method,
        url: path,
        [method.toLowerCase() === 'get' || method.toLowerCase() === 'delete'
          ? 'params'
          : 'data']: args,
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
