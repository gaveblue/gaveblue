import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const config = await readFile(new URL('../../supabase/config.toml', import.meta.url), 'utf8');

const block = name => {
  const escaped = name.replace(/[.*+?^\x24{}()|[\]\\]/g, '\\$&');
  const match = config.match(new RegExp('^\\[functions\\.' + escaped + '\\]\\s*\\n([\\s\\S]*?)(?=^\\[|\\u0024)', 'm'));
  assert.ok(match, 'Missing Supabase function configuration: ' + name);
  return match[1];
};

test('admin API enforces JWT at the edge gateway', () => {
  assert.match(block('gbplus-admin'), /^verify_jwt\\s*=\\s*true\\s*\\u0024/m);
});

test('delete-account API continues to enforce JWT', () => {
  assert.match(block('gbplus-delete-account'), /^verify_jwt\\s*=\\s*true\\s*\\u0024/m);
});
