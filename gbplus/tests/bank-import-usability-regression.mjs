// GB+ 2.5.2 — selection UX and no automatic financial mutations.
// Run: node gbplus/tests/bank-import-usability-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const src=(file)=>readFileSync(resolve(here,'../js/'+file+'.js'),'utf8');
const css=readFileSync(resolve(here,'../bank-import.css'),'utf8');
const load=(file,deps,exports)=>Function(...Object.keys(deps),
 src(file).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+
 ';return {'+exports.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
const recordKey=r=>r.externalId?'id:'+r.externalId:'mov:'+r.date+'|'+r.amount+'|'+r.description;
const fakeSaved=new Set(['id:already']);
const ui=load('bank-import-ui',{
 money:n=>'R$ '+(n/100).toFixed(2),dateLabel:d=>d,accountBalance:()=>0,esc,
 icon:()=>'<i aria-hidden="true"></i>',reconciliationRecordKey:recordKey,
 knownReconciliationKeys:()=>fakeSaved,pendingReconciliationKeys:()=>new Set(),
 bankImportHistory:()=>[]
},['bankImportFilteredRows','bankImportBulkDecisions','bankImportMarkup']);

const row=(index,amount,status='not_found',externalId='m'+index)=>({
 index,status,record:{date:'2026-11-06',amount,description:'Movimento '+index,externalId},candidates:[]
});
const rows=[row(0,-2500),row(1,-1500),row(2,6200),row(3,-3000,'possible_match'),
 row(4,-600,'possible_duplicate_in_file'),row(5,-800,'not_found','already')];
const preview={accountId:'conta',rows,format:'csv',totals:{
 credits:6200,debits:8400,possibleMatches:1,ambiguous:1,unmatched:4
}};
const db={accounts:[{id:'conta',name:'Conta de teste',active:true}],categories:[
 {id:'desp',type:'expense',name:'Tarifas'},
 {id:'rec',type:'income',name:'Serviços'}
],titles:[],payments:[],transfers:[]};
const snapshot=JSON.stringify(db);
assert.equal(ui.bankImportFilteredRows(preview,'all').length,6);
assert.equal(ui.bankImportFilteredRows(preview,'expense').length,5);
assert.equal(ui.bankImportFilteredRows(preview,'income').length,1);
assert.equal(ui.bankImportFilteredRows(preview,'ambiguous').length,1);
const result=ui.bankImportBulkDecisions(preview,[0,1],'create','desp',db,'conta',{},'2026-11-06');
assert.equal(result[0].action,'create');
assert.equal(result[1].categoryId,'desp');
assert.equal(ui.bankImportFilteredRows(preview,'decided',result).length,2);
assert.throws(()=>ui.bankImportBulkDecisions(preview,[2],'create','desp',db,'conta',{},'2026-11-06'),/somente|apenas/i);
assert.throws(()=>ui.bankImportBulkDecisions(preview,[3],'create','desp',db,'conta',{},'2026-11-06'),/somente|apenas/i);
assert.throws(()=>ui.bankImportBulkDecisions(preview,[4],'ignore','',db,'conta',{},'2026-11-06'),/repetido/i);
assert.throws(()=>ui.bankImportBulkDecisions(preview,[5],'ignore','',db,'conta',{},'2026-11-06'),/registrado/i);
assert.throws(()=>ui.bankImportBulkDecisions(preview,[0],'create','rec',db,'conta',{},'2026-11-06'),/categoria/i);
assert.throws(()=>ui.bankImportBulkDecisions(preview,[0,2],'create','desp',db,'conta',{},'2026-11-06'),/apenas/i);
assert.equal(JSON.stringify(db),snapshot,'Preparing decisions cannot mutate finance records');
const draft={accountId:'conta',preview,decisions:result,selectedRows:[0,1],
 bulkAction:'create',bulkCategory:'desp',filter:'expense',step:'review',page:0,filename:'extrato.csv'};
const html=ui.bankImportMarkup(db,draft);
for(const part of ['Resumo do extrato','Saídas do banco','Entradas no banco','Entenda as opções',
 'data-action="bank-import-select-visible"','data-action="bank-import-apply-bulk"',
 'data-bank-select-index="0"','Com decisão','Categoria comum das despesas',
 'Revisar decisões'])assert(html.includes(part),'UI missing: '+part);
assert(!html.includes('data-bank-select-index="2"'),'Income must be hidden by expense filter');
assert.match(html,/data-bank-select-index="5"[^>]*disabled/,'Saved bank movement cannot be selected');
const review={entries:[{date:'2026-11-06',description:'Movimento 0',amount:-2500,action:'create',categoryId:'desp'}],
 totals:{linked:0,ignored:0,pending:0,created:1,amountCreatedIn:0,amountCreatedOut:2500}};
const confirmHtml=ui.bankImportMarkup(db,{...draft,step:'confirm',review,confirmAccount:false,confirmCreation:false});
assert.match(confirmHtml,/id="gb-import-account-confirm"/);
assert.match(confirmHtml,/id="gb-import-create-confirm"/);
assert.match(confirmHtml,/data-action="bank-import-commit" disabled/);
assert.match(css,/\.gb-import-bulk-fields/);
assert.match(css,/\.gb-import-row\.is-selected/);
assert.equal(JSON.stringify(db),snapshot);
console.log('GB+ 2.5.2: filtros, seleção, ações, bloqueios e dupla confirmação verificados.');
