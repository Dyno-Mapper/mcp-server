import { test, describe } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { tools } from './tools/tools.js';

const spec = JSON.parse(
  readFileSync(new URL('../resource/api.json', import.meta.url), 'utf8')
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
  const specProps = Object.keys(specSchema.properties);

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

describe('tool registry', () => {
  test('every tool is keyed by its own name', () => {
    for (const [key, tool] of Object.entries(tools)) {
      assert.strictEqual(
        (tool as any).name,
        key,
        `tool registered as "${key}" declares name "${(tool as any).name}"`
      );
    }
  });

  test('registers the tools added for the new endpoints', () => {
    for (const name of [
      'get_project_dacq_score',
      'get_project_login_inputs',
      'submit_project_login_input',
      'create_project_from_sharepoint',
      'get_accessibility_login_inputs',
      'submit_accessibility_login_input',
      'upload_file',
    ]) {
      assert.ok(name in tools, `missing tool ${name}`);
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

    assert.deepStrictEqual(missing, []);
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

    assert.deepStrictEqual(problems, []);
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
    assert.deepStrictEqual(uncovered, []);
  });

  test('descriptions never reference an API path', () => {
    const offenders: string[] = [];

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
        if (/\/v1\//.test(text)) {
          offenders.push(tool.name);
          break;
        }
      }
    }

    assert.deepStrictEqual(offenders, []);
  });
});
