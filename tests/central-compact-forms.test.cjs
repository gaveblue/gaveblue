const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../postoscredenciados-covreecia/app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../postoscredenciados-covreecia/index.html'), 'utf8');
for (const target of ['fuel', 'loose']) {
  test(`${target}: native photo attaches once, without extra review or upload`, async () => {
    const calls = [], file = { name: 'receipt.jpg' };
    const c = vm.createContext({ closeReceiptCamera() { calls.push('close'); }, prepareReceiptFile(t, f) { calls.push([t, f]); } });
    vm.runInContext(source.slice(source.indexOf('async function reviewNativeReceiptFile('), source.indexOf('function openReceiptCamera(')), c);
    await c.reviewNativeReceiptFile(target, file);
    assert.deepEqual(calls, ['close', [target, file]]);
    calls.length = 0; await c.reviewNativeReceiptFile(target, null); assert.equal(calls.length, 0);
  });
}
test('driver controls remain in forms but their containers are hidden', () => {
  for (const id of ['fuel-form', 'loose-note-form']) assert.match(html, new RegExp(`<form id="${id}"[^>]*>\\s*<div class="form-field" hidden>`));
  assert.match(html, /id="driver-name"/); assert.match(html, /id="loose-driver-name"/);
});
test('upload labels remain consistent after reset and loading', () => {
  assert.doesNotMatch(html + source, /Salv[ae]r? o? ?comprovante|Salvar comprovante|Salvando comprovante/);
  assert.equal((source.match(/'Enviando comprovante\.\.\.' : 'Enviar comprovante'/g) || []).length, 2);
});
