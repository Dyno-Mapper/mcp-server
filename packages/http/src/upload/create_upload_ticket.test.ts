import { describe, expect, test } from 'vite-plus/test';
import type { ToolContext } from '@dynomapper/mcp-core';
import { readHttpConfig, type HttpConfig } from '../config.js';
import { uploadTicketTool } from './create_upload_ticket.js';
import { openTicket, ticketKey } from './ticket.js';

function config(overrides: Partial<HttpConfig> = {}): HttpConfig {
  return {
    ...readHttpConfig({}),
    uploadSecret: 'your_upload_secret_of_at_least_32_characters',
    ...overrides,
  };
}

const context: ToolContext = {
  mode: 'hosted',
  token: 'caller-token',
  requestOrigin: 'https://mcp.example.com',
};

function text(result: any): any {
  return JSON.parse(String(result.content[0].text));
}

describe('create_upload_ticket', () => {
  test('returns a PUT URL, an expiry and a command that runs', async () => {
    const tool = uploadTicketTool(config());
    const result: any = await tool.execute(
      {
        purpose: 'sitemap_content_image',
        name: 'shot.png',
        mimeType: 'image/png',
      },
      context
    );

    const body = text(result);
    expect(body.method).toBe('PUT');
    expect(body.uploadUrl).toMatch(
      /^https:\/\/mcp\.example\.com\/upload\/[A-Za-z0-9_-]+$/
    );
    expect(body.curl).toContain(body.uploadUrl);
    expect(body.curl.startsWith('curl -T ')).toBe(true);
    expect(Number.isNaN(Date.parse(body.expiresAt))).toBe(false);
    expect(result.structuredContent.uploadUrl).toBe(body.uploadUrl);
  });

  test('seals the caller’s token, so the route can act as that caller', async () => {
    const settings = config();
    const tool = uploadTicketTool(settings);
    const body = text(
      await tool.execute(
        { purpose: 'project_text', name: 'list.txt', mimeType: 'text/plain' },
        context
      )
    );

    const sealed = body.uploadUrl.split('/upload/')[1];
    const opened = openTicket(sealed, ticketKey(settings.uploadSecret));

    expect(opened.ok).toBe(true);
    if (opened.ok) {
      expect(opened.claims.token).toBe('caller-token');
      expect(opened.claims.purpose).toBe('project_text');
      expect(opened.claims.name).toBe('list.txt');
      expect(opened.claims.mimeType).toBe('text/plain');
    }
  });

  test('normalises the name before it is sealed', async () => {
    const tool = uploadTicketTool(config());
    const body = text(
      await tool.execute(
        {
          purpose: 'sitemap_content_image',
          name: '../../shot".png',
          mimeType: 'image/png',
        },
        context
      )
    );

    const opened = openTicket(
      body.uploadUrl.split('/upload/')[1],
      ticketKey(config().uploadSecret)
    );

    expect(opened.ok && opened.claims.name).toBe('shot_.png');
  });

  test('normalises the media type', async () => {
    const tool = uploadTicketTool(config());
    const body = text(
      await tool.execute(
        {
          purpose: 'project_text',
          name: 'a.txt',
          mimeType: 'Text/Plain; charset=utf-8',
        },
        context
      )
    );

    const opened = openTicket(
      body.uploadUrl.split('/upload/')[1],
      ticketKey(config().uploadSecret)
    );

    expect(opened.ok && opened.claims.mimeType).toBe('text/plain');
  });

  test('refuses, naming the variable, when the deployment has no origin', async () => {
    const tool = uploadTicketTool(config());
    const result: any = await tool.execute(
      {
        purpose: 'sitemap_content_image',
        name: 'a.png',
        mimeType: 'image/png',
      },
      { mode: 'hosted', token: 'caller-token' }
    );

    expect(result.isError).toBe(true);
    expect(text(result).error).toBe('upload_ticket_unavailable');
    expect(text(result).message).toContain('MCP_PUBLIC_URL');
  });

  test('refuses, naming the variable, when no secret is set', async () => {
    const tool = uploadTicketTool(config({ uploadSecret: '' }));
    const result: any = await tool.execute(
      {
        purpose: 'sitemap_content_image',
        name: 'a.png',
        mimeType: 'image/png',
      },
      context
    );

    expect(result.isError).toBe(true);
    expect(text(result).message).toContain('MCP_UPLOAD_SECRET');
  });

  test('uses the origin the request arrived at, so a proxy name wins', async () => {
    const tool = uploadTicketTool(
      config({ publicUrl: 'https://mcp.dynomapper.com' })
    );
    const body = text(
      await tool.execute(
        {
          purpose: 'sitemap_content_image',
          name: 'a.png',
          mimeType: 'image/png',
        },
        context
      )
    );

    expect(body.uploadUrl.startsWith('https://mcp.example.com/')).toBe(true);
  });
});
