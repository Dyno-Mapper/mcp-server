import { describe, expect, test } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { tools } from './tools/tools.js';

// The published API spec is a repository-level fixture, shared with the source
// it documents rather than copied into the package.
const spec = JSON.parse(
  readFileSync(new URL('../../../resource/api.json', import.meta.url), 'utf8')
) as any;

interface SpecOp {
  method: string;
  path: string;
  operation: any;
}

function specOperations(path: string, method: string): SpecOp[] {
  const paths = path.includes('{type}')
    ? ['text', 'xml'].map((t) => path.replace('{type}', t))
    : [path];

  return paths.map((p) => ({
    method,
    path: p,
    operation: spec.paths?.[p]?.[method.toLowerCase()],
  }));
}

function successSchema(operation: any): any | null {
  const codes = Object.keys(operation?.responses ?? {})
    .filter((code) => code.startsWith('2'))
    .sort();

  for (const code of codes) {
    const schema =
      operation.responses[code]?.content?.['application/json']?.schema;
    if (schema) return schema;
  }

  return null;
}

function isNullable(schema: any): boolean {
  if (!schema) return false;
  if (schema.nullable) return true;
  for (const variant of schema.anyOf ?? schema.oneOf ?? []) {
    if (variant?.type === 'null') return true;
  }
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  return types.includes('null');
}

/**
 * Collects the places where a tool's output schema is *stricter* than the
 * documented response. A mismatch makes the SDK throw an McpError at call
 * time, so the tool must never require a field the API calls optional, and
 * must never insist on a value the API permits to be null.
 */
function strictness(schema: any, specSchema: any, path = ''): string[] {
  const problems: string[] = [];
  if (!schema || !specSchema) return problems;

  if (schema.type === 'array' && specSchema.type === 'array') {
    return strictness(schema.items, specSchema.items, `${path}[]`);
  }

  if (!schema.properties || !specSchema.properties) return problems;

  const schemaProps = Object.keys(schema.properties);

  for (const key of schemaProps) {
    const toolField = schema.properties[key];
    const specField = specSchema.properties[key];
    // A field with a default is not strict: zod fills it in when the response
    // omits it, so the tool cannot fail validation because of it.
    const hasDefault = 'default' in toolField;
    const toolRequired = (schema.required ?? []).includes(key) && !hasDefault;
    const specRequired = (specSchema.required ?? []).includes(key);

    if (!specField) {
      if (toolRequired) {
        problems.push(
          `${path}/${key} is required by the tool but absent from the documented response`
        );
      }
      continue;
    }

    if (toolRequired && !specRequired) {
      problems.push(
        `${path}/${key} is required by the tool, optional in the spec`
      );
    }

    if (!isNullable(toolField) && isNullable(specField)) {
      problems.push(
        `${path}/${key} cannot be null in the tool, nullable in the spec`
      );
    }

    problems.push(...strictness(toolField, specField, `${path}/${key}`));
  }

  return problems;
}

/**
 * The public API's documentation style guide (`dynomapper-public-api`,
 * `docs/style-guide.md`) is the house style for every string a client reads,
 * and these tool descriptions follow it. These are the rules R1–R10 the guide's
 * own checker can hold; voice, structure and what deserves an explanation stay
 * in review.
 */
const houseStyle: {
  id: string;
  pattern: RegExp;
  fix: string;
  raw?: boolean;
  prepare?: (text: string) => string;
}[] = [
  {
    id: 'R1',
    pattern: /\b(please|simply|easily)\b/gi,
    fix: 'write for a caller, not a settings screen',
  },
  {
    id: 'R1',
    pattern: /\b(ON|OFF)\b/g,
    fix: 'use `true` and `false`, not a settings-screen label',
  },
  {
    id: 'R3',
    pattern: /\bIds?\b/g,
    fix: 'the house form is "ID" in prose and `id` for the field',
  },
  {
    id: 'R3',
    pattern: /\bJavascript\b/g,
    fix: 'write "JavaScript"',
  },
  {
    id: 'R3',
    pattern: /\b(sub-domains?|querystrings?)\b/gi,
    fix: 'write "subdomain" or "query string"',
  },
  {
    id: 'R4',
    pattern: /\bthis endpoint\b/gi,
    fix: 'name the tool, or say "the call"',
  },
  {
    id: 'R8',
    pattern: /YOUR_[A-Z0-9_]+/g,
    raw: true,
    fix: 'use `ACCESS_TOKEN`, `PASSWORD` or `CLIENT_SECRET`',
  },
  {
    id: 'R9',
    pattern: /\b(e\.g\.|i\.e\.|etc\.|vs\.)/gi,
    fix: 'write "for example", "that is", or finish the list',
  },
  {
    id: 'R9',
    pattern: /\bvia\b/gi,
    fix: 'write "through" or "by using"',
  },
  {
    id: 'R9',
    pattern: / - /g,
    prepare: (text) => text.replace(/^[ \t]*[-*+] /gm, ' '),
    fix: 'use an em dash, not a spaced hyphen',
  },
  {
    id: 'R9',
    pattern:
      /\b(colour\w*|behaviour\w*|cancelled|cancelling|summaris\w*|sanitis\w*|recognis\w*|normalis\w*|unnormalis\w*|uncategoris\w*|totalled|centre[sd]?)\b/gi,
    fix: 'this corpus is American: color, behavior, canceled, summarize, sanitize, recognize, normalize, center',
  },
];

/** Every description a JSON schema carries, with a path for the failure. */
function schemaProse(
  schema: any,
  path: string
): { where: string; text: string }[] {
  if (!schema || typeof schema !== 'object') return [];

  const entries: { where: string; text: string }[] = [];
  if (typeof schema.description === 'string') {
    entries.push({ where: path, text: schema.description });
  }

  for (const [key, value] of Object.entries(schema.properties ?? {})) {
    entries.push(...schemaProse(value, `${path}.${key}`));
  }
  if (schema.items) entries.push(...schemaProse(schema.items, `${path}[]`));
  for (const key of ['anyOf', 'oneOf', 'allOf']) {
    for (const value of schema[key] ?? []) {
      entries.push(...schemaProse(value, `${path}<${key}>`));
    }
  }

  return entries;
}

describe('tool registry', () => {
  test('every tool is keyed by its own name', () => {
    for (const [key, tool] of Object.entries(tools)) {
      expect(
        (tool as any).name,
        `tool registered as "${key}" declares name "${(tool as any).name}"`
      ).toBe(key);
    }
  });

  test('registers the latest tools', () => {
    for (const name of [
      'get_project_dacq_score',
      'get_project_login_inputs',
      'submit_project_login_input',
      'create_project_from_sharepoint',
      'create_project_from_scratch',
      'get_accessibility_login_inputs',
      'submit_accessibility_login_input',
      'upload_file',
      'create_project_category',
      'update_project_category',
      'delete_project_category',
      'move_project_category',
      'create_project_workflow_status',
      'update_project_workflow_status',
      'delete_project_workflow_status',
      'move_project_workflow_status',
      'create_project_sitemap_item',
      'bulk_update_project_sitemap_items',
      'update_project_sitemap_item',
      'delete_project_sitemap_item',
      'bulk_delete_project_sitemap_items',
      'move_project_sitemap_item',
      'bulk_move_project_sitemap_items',
      'duplicate_project_sitemap_item',
      'sort_project_sitemap_items',
      'get_project_sitemap_undo',
      'undo_project_sitemap_edit',
      'get_project_sitemap_redo',
      'redo_project_sitemap_edit',
      'get_project_sitemap_item_content',
      'replace_project_sitemap_item_content',
      'get_all_project_comments',
      'create_item_comment',
      'update_item_comment',
      'delete_item_comment',
    ]) {
      expect(name in tools, `missing tool ${name}`).toBe(true);
    }
  });

  test('every tool points at a documented operation', () => {
    const missing: string[] = [];

    for (const tool of Object.values(tools) as any[]) {
      for (const op of specOperations(tool.path, tool.method)) {
        if (!op.operation) {
          missing.push(`${tool.name}: ${op.method.toUpperCase()} ${op.path}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  test('no tool output schema is stricter than the documented response', () => {
    const problems: string[] = [];

    for (const tool of Object.values(tools) as any[]) {
      const schema = z.toJSONSchema(tool.outputSchema, {
        io: 'output',
        unrepresentable: 'any',
      }) as any;

      for (const op of specOperations(tool.path, tool.method)) {
        const documented = successSchema(op.operation);
        if (!documented) continue;

        for (const problem of strictness(schema, documented)) {
          problems.push(`${tool.name}: ${problem}`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  test('every documented operation is reachable through a tool', () => {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    const documented = new Set<string>();

    for (const [path, item] of Object.entries<any>(spec.paths ?? {})) {
      for (const method of Object.keys(item)) {
        if (methods.includes(method)) {
          documented.add(`${method.toUpperCase()} ${path}`);
        }
      }
    }

    const covered = new Set<string>();
    for (const tool of Object.values(tools) as any[]) {
      for (const op of specOperations(tool.path, tool.method)) {
        covered.add(`${op.method.toUpperCase()} ${op.path}`);
      }
    }

    const uncovered = [...documented].filter((op) => !covered.has(op));
    expect(uncovered).toEqual([]);
  });

  test('descriptions describe tools rather than API routes', () => {
    const offenders: string[] = [];
    const routeSyntax =
      /\b(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\/|\bendpoint\b/i;

    for (const tool of Object.values(tools) as any[]) {
      const inputJson = JSON.stringify(
        z.toJSONSchema(tool.inputSchema, {
          io: 'input',
          unrepresentable: 'any',
        })
      );
      const outputJson = JSON.stringify(
        z.toJSONSchema(tool.outputSchema, {
          io: 'output',
          unrepresentable: 'any',
        })
      );

      for (const text of [tool.description, inputJson, outputJson]) {
        if (/\/v1\//.test(text) || routeSyntax.test(text)) {
          offenders.push(tool.name);
          break;
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  test('tool prose follows the API documentation house style', () => {
    const violations: string[] = [];

    const check = (where: string, text: string) => {
      const bare = text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ');

      for (const rule of houseStyle) {
        const target = rule.raw ? text : bare;
        const prepared = rule.prepare ? rule.prepare(target) : target;

        for (const match of prepared.matchAll(rule.pattern)) {
          violations.push(`${where}: ${rule.id} "${match[0]}" — ${rule.fix}`);
        }
      }
    };

    for (const tool of Object.values(tools) as any[]) {
      check(`${tool.name} description`, tool.description);

      for (const [key, io] of [
        ['inputSchema', 'input'],
        ['outputSchema', 'output'],
      ] as const) {
        const schema = z.toJSONSchema(tool[key], {
          io,
          unrepresentable: 'any',
        }) as any;

        for (const entry of schemaProse(schema, key)) {
          check(`${tool.name} ${entry.where}`, entry.text);
        }
      }
    }

    check(
      'packages/stdio/README.md',
      readFileSync(
        new URL('../../../packages/stdio/README.md', import.meta.url),
        'utf8'
      )
    );

    expect(violations).toEqual([]);
  });
});
