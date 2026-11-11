// GB+ 3.0.9 — seleção de pendentes, proveniência e paginação de parceiros.
// Todos os registros abaixo são fictícios: sem dados de clientes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseErpPartners,parseErpMovements,applyErpPartners,applyErpMovements,
 erpSelectionIndexes,erpIsPending,erpIsSettled,defaultErpCategories,movementDecisions}
 from '../js/sankhya-import-core.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const now='2026-11-10';
const db={partners:[],titles:[],payments:[],categories:[
 {id:'catIncome',type:'income',name:'Outras receitas'},
 {id:'catExpense',type:'expense',name:'Outras despesas'}],
 accounts:[{id:'bank',name:'Banco Exemplo',active:true}]};
let serial=0;const uid=()=>'synthetic'+(++serial);
const partners=parseErpPartners([
 ['Cód. Parceiro','Nome Parceiro','Razão social','Ativo'],
 [123,'CLIENTE EXEMPLO','CLIENTE EXEMPLO LTDA','Sim']]);
applyErpPartners(db,partners.rows,uid,{confirmed:true});
assert.deepEqual(defaultErpCategories(db),{income:'catIncome',expense:'catExpense'});
const h=['Nro Único','Parceiro','Receita/Despesa','Vlr do Desdobramento','Valor Líquido',
 'Dt. Vencimento','Nro Nota','Empresa','Dt. Negociação','Data Baixa','Vlr Baixa','Conta Baixa'];
const row=(unique,paidDate='',payment=0)=>[
 unique,123,'Receita',100,100,46335,2002,1,46308,paidDate,payment,'Cód.Conta: 1 - Banco Exemplo'];
const preview=parseErpMovements([h,row(9001),row(9002,46335,100),row(9003,46354,105)]);
assert.equal(preview.rows.length,3);
assert(erpIsPending(preview.rows[0],now));
assert(erpIsSettled(preview.rows[1],now));
assert(erpIsPending(preview.rows[2],now)); // future: never settle prematurely
assert.deepEqual(erpSelectionIndexes(db,preview,now,'pending'),[0,2]);
assert.deepEqual(erpSelectionIndexes(db,preview,now,'settlements'),[1]);
assert.deepEqual(erpSelectionIndexes(db,preview,now,'new'),[0,1,2]);
const opts={confirmed:true,categories:defaultErpCategories(db),accounts:{'1':'bank'}};
const selection=erpSelectionIndexes(db,preview,now,'pending').map(i=>preview.rows[i]);
const first=applyErpMovements(db,selection,opts,uid,now);
assert.equal(first.created,2);
assert.equal(first.settled,0);
assert.equal(db.payments.length,0);
assert(db.titles.every(t=>t.categoryId==='catIncome'&&t.importSource==='sankhya'));
assert(db.titles.every(t=>t.notes.includes('Via importação')));
assert.deepEqual(erpSelectionIndexes(db,preview,now,'pending'),[]);
const paid=erpSelectionIndexes(db,preview,now,'settlements').map(i=>preview.rows[i]);
const second=applyErpMovements(db,paid,opts,uid,now);
assert.equal(second.created,1);
assert.equal(second.settled,1);
assert.equal(db.payments.length,1);
assert.equal(db.titles.length,3);
assert.equal(movementDecisions(db,preview.rows,now).filter(r=>r.decision==='unchanged').length,3);
assert.equal(erpSelectionIndexes(db,preview,now,'settlements').length,0);
const source=read('js/sankhya-import-ui.js');
assert(source.includes('Selecionar somente pendentes'));
assert(source.includes('gb-erp-view-filter'));
assert(source.includes('erpOriginalIndex:i')); // pagination never loses row identity
const app=read('js/app.js');
assert(app.includes("'erp-import-select-pending':()"));
assert(app.includes("erpSelectionIndexes(db,d.parsed,today(),'pending')"));
assert(app.includes("partnerPage:0"));
const view=read('js/views.js');
assert(view.includes('gb-partner-table-wrap')&&view.includes('gb-partner-pagination'));
assert(view.includes('const pageSize=75'));
assert(view.includes('Cód. parceiro')&&view.includes('CPF/CNPJ'));
assert(!view.slice(view.indexOf('export function partnersView'),view.indexOf('export function accountsView')).includes('partner-grid'));
const titles=read('js/ui.js'),launch=read('js/launches-view.js');
assert(titles.includes('Via importação')&&launch.includes('Via importação'));
assert(titles.includes("importKey?.startsWith('sankhya-fin-v1:')"));
const v=JSON.parse(read('version.json'));
assert.equal(v.version,'3.0.9');
assert.equal(v.build,3009);
assert(read('index.html').includes('app.js?v=20261110-309'));
assert(read('sw.js').includes('gb-plus-shell-v3009'));
console.log('GB+ 3.0.9: seleção pendente, baixa, categorias padrão e grade de parceiros aprovadas.');
