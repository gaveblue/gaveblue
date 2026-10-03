const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const base = path.join(__dirname, '../postoscredenciados-covreecia');
const source = fs.readFileSync(path.join(base, 'app.js'), 'utf8');
test('fuel KM is required in markup; service KM remains optional', () => {
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  assert.match(html.match(/<input[^>]*id="fuel-km"[^>]*>/)[0], /\brequired\b/);
  assert.doesNotMatch(html.match(/<input[^>]*id="loose-km"[^>]*>/)[0], /\brequired\b/);
});
for (const mode of ['rapido', 'completo']) {
  for (const km of ['', ' ', undefined, '-1', '1.5', 'abc', 'Infinity', '45200', '0']) {
    test(`${mode}: validates KM ${JSON.stringify(km)}`, () => {
      const context = vm.createContext({ window: {}, currentFuelFormMode: mode, showErrorMessage() {} });
      vm.runInContext(source.slice(source.indexOf('function validateFuelReceiptUploadFields('), source.indexOf('function validateLooseNoteReceiptUploadFields(')), context);
      const data = { motorista:'Teste', cidade:'Cidade', posto:'Posto', data:'2026-10-03', valor:'10', litros:'2', tipoCombustivel:'Diesel', file:{}, km };
      assert.equal(context.validateFuelReceiptUploadFields(data), km === '45200' || km === '0');
    });
  }
}
