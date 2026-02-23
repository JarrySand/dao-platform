import { describe, it, expect } from 'vitest';

// --- Replicate the validation logic from eas-proxy/route.ts for unit testing ---

const MAX_QUERY_LENGTH = 4_000;
const MAX_DEPTH = 5;
const ALLOWED_ROOT_FIELDS = new Set(['attestation', 'attestations', 'schema', 'schemas']);

function stripComments(query: string): string {
  return query.replace(/#[^\n]*/g, '');
}

function checkDepth(query: string): boolean {
  let depth = 0;
  for (const ch of query) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth > MAX_DEPTH) return false;
  }
  return depth === 0;
}

function extractRootFields(query: string): string[] {
  const braceIndex = query.indexOf('{');
  if (braceIndex === -1) return [];

  const inner = query.slice(braceIndex + 1);
  const fields: string[] = [];
  const fieldPattern = /(?:(\w+)\s*:\s*)?(\w+)\s*[\s({]/g;
  let depth = 0;
  let match: RegExpExecArray | null;

  while ((match = fieldPattern.exec(inner)) !== null) {
    const preceding = inner.slice(0, match.index);
    depth = 0;
    for (const ch of preceding) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (depth === 0) {
      fields.push(match[2]);
    }
  }

  return fields;
}

function isAllowedEASQuery(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const { query } = body as Record<string, unknown>;
  if (typeof query !== 'string') return false;
  if (query.length > MAX_QUERY_LENGTH) return false;

  const cleaned = stripComments(query);
  const normalized = cleaned.replace(/\s+/g, ' ').trim();
  if (!normalized) return false;

  if (/^(mutation|subscription)\b/i.test(normalized)) return false;
  if (/\b(mutation|subscription)\b/i.test(normalized.split('{')[0] || '')) return false;

  if (!checkDepth(normalized)) return false;

  const rootFields = extractRootFields(normalized);
  if (rootFields.length === 0) return false;

  for (const field of rootFields) {
    if (!ALLOWED_ROOT_FIELDS.has(field)) return false;
  }

  return true;
}

// --- Tests ---

describe('isAllowedEASQuery', () => {
  describe('valid queries', () => {
    it('allows valid attestation query', () => {
      const body = {
        query: `query GetAttestation($uid: String!) {
          attestation(where: { id: $uid }) { id attester }
        }`,
      };
      expect(isAllowedEASQuery(body)).toBe(true);
    });

    it('allows attestations list query', () => {
      const body = {
        query: `query { attestations(where: { schemaId: { equals: "0x123" } }) { id } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(true);
    });

    it('allows schema query', () => {
      const body = {
        query: `query { schema(where: { id: "0x123" }) { id } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(true);
    });

    it('allows shorthand query without query keyword', () => {
      const body = {
        query: `{ attestation(where: { id: "0x123" }) { id } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(true);
    });
  });

  describe('blocked operations', () => {
    it('blocks mutation queries', () => {
      const body = {
        query: `mutation { createAttestation(data: {}) { id } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(false);
    });

    it('blocks subscription queries', () => {
      const body = {
        query: `subscription { attestation(where: { id: "0x123" }) { id } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(false);
    });

    it('blocks queries with disallowed root fields', () => {
      const body = {
        query: `query { users { id name } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(false);
    });
  });

  describe('injection prevention', () => {
    it('blocks mutation hidden in comments', () => {
      const body = {
        query: `# this is a comment\nmutation { createAttestation(data: {}) { id } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(false);
    });

    it('blocks aliased disallowed fields', () => {
      const body = {
        query: `query { myData: users { id } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(false);
    });

    it('blocks excessively nested queries', () => {
      const body = {
        query: `query { attestation { a { b { c { d { e { f } } } } } } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(false);
    });

    it('blocks queries exceeding max length', () => {
      const body = {
        query: `query { attestation { id } }` + ' '.repeat(MAX_QUERY_LENGTH),
      };
      expect(isAllowedEASQuery(body)).toBe(false);
    });

    it('strips comments before validation', () => {
      const body = {
        query: `# comment with mutation keyword
query { attestations(where: { schemaId: { equals: "0x123" } }) { id } }`,
      };
      expect(isAllowedEASQuery(body)).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('rejects null body', () => {
      expect(isAllowedEASQuery(null)).toBe(false);
    });

    it('rejects missing query field', () => {
      expect(isAllowedEASQuery({ variables: {} })).toBe(false);
    });

    it('rejects non-string query', () => {
      expect(isAllowedEASQuery({ query: 42 })).toBe(false);
    });

    it('rejects empty query string', () => {
      expect(isAllowedEASQuery({ query: '' })).toBe(false);
    });

    it('rejects unbalanced braces', () => {
      expect(isAllowedEASQuery({ query: '{ attestation { id }' })).toBe(false);
    });
  });
});
