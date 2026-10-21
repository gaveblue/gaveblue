const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../recibos.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(
  source.slice(source.indexOf('    function normalizarChaveImportacao('), source.indexOf('    function preencherValorEQuantia(')) +
  source.slice(source.indexOf('    function lerProducaoTrainer('), source.indexOf('    // Importar Excel')),
  context
);
const parse = rows => JSON.parse(JSON.stringify(context.lerProducaoTrainer(rows)));
const header = ['NOMES COLABORADORES', 'FUNÇÃO', 21, 22, 'PLANTAS', 'R$', 'TOTAL'];
const names = ['ALAN CIRQUEIRA DE CARVALHO', 'CLAUDINEI SOUZA LIMA', 'EUNATAN FERNANDES CAMPOS', 'HERLON CARVALHO', 'IGNO MARRONE', 'KAIQUE SOUZA MOURA', 'REINALDO APERECIDO', 'RENILDO SANTOS', 'WEVERTON NERES BARBOSA', 'WESLLE NERES BARBOSA'];

test('calcário: título, cabeçalho mesclado, dez colaboradores e total geral excluído', () => {
  const rows = [['PRODUÇÃO SETEMBRO/26 CALCARIO MANUAL CAFÉ VELHO'], [], header,
    ['', '', 'SEG', 'TER'],
    ...names.map((name, i) => [name, 'TRP', 3111, 3111, 6222, 0.06, i === 7 ? 240 : 374]),
    ['', '', '', '', '', '', 3606], [],
    ['EMPREITEIRO', 'FUNÇÃO', 21, 22, 'QDE PLANTAS', 'R$', 'VALOR A RECEBER'],
    ['DIEGO NERES BARBOSA', 'EMP', 31999, 27999, 59998, 0.02, 1200]];
  const result = parse(rows);
  assert.equal(result.length, 10);
  assert.equal(result[0].Nome, names[0]);
  assert.equal(result[0].Valor, '374,00'); // Não recalcular 6222 * 0,06.
  assert.equal(result[7].Valor, '240,00');
  assert.equal(result.reduce((sum, row) => sum + Number(row.Valor.replace(',', '.')), 0), 3606);
});

test('adubação: valores diferentes na coluna TOTAL e empreiteiro excluído', () => {
  const totals = [390, 150, 390, 150, 150, 390, 240, 150, 390];
  const result = parse([['PRODUÇÃO SETEMBRO/26 ADUBAÇÃO'], header, ['', '', 'SEX', 'SAB'],
    ...totals.map((total, i) => [names[i], 'TRP', 3750, 6000, 9750, 0.04, `R$ ${total},00`]),
    ['', '', '', '', '', '', 2400], ['EMPREITEIRO'], ['DIEGO', 'EMP', 30000, 30000, 60000, 0.02, 1200]]);
  assert.deepEqual(result.map(row => Number(row.Valor.replace(',', '.'))), totals);
});

test('encontra colunas deslocadas, normaliza cabeçalhos e aceita zero e moeda brasileira', () => {
  const result = parse([['TOTAL', 'PLANTAS', ' Nome do\nColaborador '],
    ['R$ 1.234,56', 99999, 'MARIA'], [0, 100, 'JOÃO'], ['TOTAL GERAL']]);
  assert.deepEqual(result, [{ Nome: 'MARIA', Valor: '1234,56' }, { Nome: 'JOÃO', Valor: '0,00' }]);
});

test('não confunde R$ ou quantidade com TOTAL; rejeita valores ausentes ou inválidos', () => {
  assert.throws(() => parse([['NOMES COLABORADORES', 'R$'], ['ANA', 0.06]]), /TOTAL/);
  for (const value of ['', 'erro', '#VALUE!', -10]) {
    assert.throws(() => parse([header, ['ANA', 'TRP', 100, 100, 200, 0.06, value]]), /TOTAL inválido/);
  }
});

test('modelo antigo mantém o caminho original de leitura e os campos', () => {
  const legacy = [{ Nome: 'MARIA', Valor: 125.5, Data: '21/10/2026' }];
  let legacyCalls = 0;
  context.XLSX = { utils: { sheet_to_json: (sheet, options) => {
    if (options?.header === 1) return [['Nome', 'Valor', 'Data'], ['MARIA', 125.5, '21/10/2026']];
    legacyCalls++;
    return legacy;
  } } };
  assert.equal(context.lerLinhasPlanilhaRecibos({}, 'covre'), legacy);
  assert.equal(context.lerLinhasPlanilhaRecibos({}, 'padrao'), legacy);
  assert.equal(legacyCalls, 2);
  const data = context.extrairDadosImportados(legacy[0]);
  assert.equal(data.recebedor, 'MARIA');
  assert.equal(data.valor, 125.5);
  assert.equal(data.data, '21/10/2026');
});

test('tabela de produção vazia não cai no leitor antigo', () => {
  assert.deepEqual(parse([header, ['', '', 'SEG', 'TER']]), []);
});
