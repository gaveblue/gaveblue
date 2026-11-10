// GB+ 3.0.7 — regressão financeira com dados sintéticos, sem guardar documentos do usuário.
import assert from 'node:assert/strict';
import {normalizeTabularReport,normalizeSicoobPositionedPages,normalizeReceivableOcr,reportDuplicates,applyFinancialReport,brlCents,isoDate} from '../js/financial-report-core.js';
import {csvRows} from '../js/financial-report-readers.js';
const today='2026-11-10', dateNumber=46336;
assert.equal(isoDate(dateNumber),today);
assert.equal(brlCents('1.000'),100000);
assert.equal(brlCents('R$ 1.250,75'),125075);
const payable=normalizeTabularReport('payable',[
 ['Empresa','Financeiro','Nota','Parceiro','Tipo','Vencimento','Data Pagamento','Conta da Baixa','Conciliação','Valor','Provisão','Situação'],
 [1,20001,99001,'FORNECEDOR EXEMPLO','BOLETO',dateNumber,dateNumber,'BANCO A','Não conciliado',125.9,'NÃO','PAGO'],
 [1,20002,99002,'FORNECEDOR NOVO','PIX',dateNumber+1,'-','-','-',320.15,'NÃO','A VENCER']]);
assert.equal(payable.records.length,2);
assert.equal(payable.records[0].status,'paid');
assert.equal(payable.records[0].paymentDate,today);
assert.equal(payable.records[1].status,'open');
assert.equal(payable.records[0].amount,12590);
assert(payable.records[0].notes.includes('Conciliação:'));
const receivable=normalizeTabularReport('receivable',[
 ['Número Financeiro','Número da NF','Razão Social','Vendedor','Negociação','Vencimento','Valor'],
 [20345,48809,'CLIENTE EXEMPLO','VENDEDOR','12/08/2026','10/11/2026','R$ 690,00']]);
assert.equal(receivable.records.length,1);
assert.equal(receivable.records[0].amount,69000);
assert.equal(receivable.records[0].issue,'2026-08-12');
const page=(headers,entries)=>({items:[...headers,...entries]});
const it=(str,x,y)=>({str,x,y});
const bank=normalizeSicoobPositionedPages([page([it('58-LIQUIDAÇÃO - VIA COMPENSAÇÃO',28,510),it('82-BAIXA - PEDIDO CEDENTE',28,310)],
 [it('CLIENTE UM',31,443),it('255000-1',210,440),it('50001-1',296,440),it(today.replaceAll('-','/'),347,440),
 it('10/11/2026',426,440),it('100,00',542,440),it('0,00',590,440),it('10/11/2026',708,440),it('100,00',780,440),
 it('CLIENTE DOIS',31,254),it('255000-2',210,250),it('50002-1',296,250),it('10/11/2026',426,250),it('50,00',542,250),it('0,00',590,250),it('10/11/2026',708,250),it('50,00',780,250)])]);
assert.equal(bank.records.length,1);
assert.equal(bank.excluded.length,1);
assert.equal(bank.records[0].amount,10000);
assert(bank.excluded[0].reason.startsWith('82'));
const db={titles:[],payments:[],partners:[],accounts:[{id:'acc',active:true}],categories:[{id:'expenses',type:'expense'},{id:'income',type:'income'}]};
let id=0;const next=()=>String(++id);
const done=applyFinancialReport(db,payable.records,{kind:'payable',categoryId:'expenses',accountId:'acc',explicitConfirmed:true,createPartners:true},next,today);
assert.equal(done.count,2);
assert.equal(done.settlements,1);
assert.equal(db.payments.length,1);
assert.equal(db.partners.length,2);
assert(reportDuplicates(db,payable.records).every(x=>x.duplicate));
assert.throws(()=>applyFinancialReport(db,payable.records,{kind:'payable',categoryId:'expenses',accountId:'acc',explicitConfirmed:true},next,today),/já foram lançados/);
assert.throws(()=>applyFinancialReport(db,receivable.records,{kind:'receivable',categoryId:'income',accountId:'acc',explicitConfirmed:false},next,today),/confirme/);
const csv='Parceiro;Valor;Vencimento\n"CLIENTE; NOVO";"1.000,00";10/11/2026\n';
const parsedCSV=csvRows(csv);
assert.equal(parsedCSV[1][0],'CLIENTE; NOVO');
assert.equal(parsedCSV[1][1],'1.000,00');
const noTitleRows=normalizeTabularReport('received',[
 ['Sacado','Nosso Número','Vencimento','Vlr. Cobrado','Dt. Liquid.','Ocorrência'],
 ['BAIXA EXEMPLO','255123-6','10/11/2026','200,00','10/11/2026','82-BAIXA'],
 ['LIQUIDADO EXEMPLO','255124-6','10/11/2026','300,00','10/11/2026','58-LIQUIDAÇÃO']]);
assert.equal(noTitleRows.records.length,1);
assert.equal(noTitleRows.excluded.length,1);
console.log('GB+ 3.0.7: normalização/duplicidade/liquidação/baixa aprovadas.');
