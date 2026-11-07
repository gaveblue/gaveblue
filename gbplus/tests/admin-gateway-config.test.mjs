import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const config = await readFile(new URL('../../supabase/config.toml', import.meta.url), 'utf8');

const jwtSetting = name => {
  const lines = config.split('\n');
  const start = lines.findIndex(line => line.trim() === '[functions.' + name + ']');
  assert.ok(start >= 0, 'Missing function configuration: ' + name);
  const after = lines.slice(start + 1);
  const next = after.findIndex(line => line.trim().startsWith('[functions.'));
  const block = after.slice(0, next < 0 ? after.length : next);
  const settings = block.filter(line => line.trim().startsWith('verify_jwt'));
  assert.equal(settings.length, 1, 'Each function must have exactly one JWT setting');
  return settings[0].trim();
};

test('admin API enforces JWT at gateway', () => {
  assert.equal(jwtSetting('gbplus-admin'), 'verify_jwt = true');
});

test('delete account API enforces JWT at gateway', () => {
  assert.equal(jwtSetting('gbplus-delete-account'), 'verify_jwt = true');
});
