// GB+ 2.5.0 build 9 — custom CSV column mapping, no automatic financial mutation.
// Run: node gbplus/tests/bank-import-mapping-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const load=(name,deps,keys)=>{
 const src=readFileSync(resolve(here,'../js/'+name+'.js'),'utf8')
  .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
 return Function(...Object.keys(deps),src+';return {'+keys.join(',')+'}')(...Object.values(deps));
};
const bank=load('bank-import-preview',{},['inspectBankCsv','parseBankCsv','parseBankStatement','proposeReconciliation']);
const rec=load('bank-reconciliation',{},['reconciliationRecordKey','knownReconciliationKeys','pendingReconciliationKeys','bankImportHistory']);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db={accounts:[{id:'A',name:'Banco fictício',active:true,initial:10000}],titles:[],payments:[],transfers:[],categories:[]};
const ui=load('bank-import-ui',{
 money:n=>'R$ '+(n/100).toFixed(2),dateLabel:x=>x,accountBalance:(db,id)=>db.accounts.find(a=>a.id===id).initial,esc,icon:()=>'',...rec
},['bankImportMarkup','BANK_IMPORT_WRITES_ENABLED']);
assert.equal(ui.BANK_IMPORT_WRITES_ENABLED,true,'Compilação 9 preserva a conciliação assistida');

const raw='Dia da operação|Detalhes do banco|R$ Débito|R$ Crédito|Nº documento|Saldo em conta\n'+
 '06/11/2026|<img src=x onerror=alert(1)>|12,50||REF-1|87,50\n'+
 '07/11/2026|PIX CLIENTE||50,00|REF-2|137,50';
const inspected=bank.inspectBankCsv(raw);
assert.equal(inspected.separator,'|');
assert.equal(inspected.rowCount,2);
assert.equal(inspected.columns.date,-1,'Nonstandard date header needs mapping');
const markup=ui.bankImportMarkup(db,{step:'mapping',accountId:'A',csvSource:raw,csvMapping:inspected,filename:'extrato.csv'});
assert.match(markup,/Mapear colunas do CSV/);
assert.match(markup,/data-bank-map-field="date"/);
assert.match(markup,/data-bank-map-mode/);
assert.match(markup,/data-action="bank-import-apply-map"/);
assert.match(markup,/&lt;img/,'Untrusted CSV preview must be HTML-escaped');
assert(!markup.includes('<img src=x onerror'),'CSV may not inject HTML');
assert(!markup.includes('data-action="bank-import-commit"'),'Mapping must not expose commit');

const indexes={date:0,description:1,debit:2,credit:3,id:4,balance:5};
const parsed=bank.parseBankCsv(raw,{separator:'|',indexes});
assert.deepEqual(parsed.records.map(x=>x.amount),[-1250,5000]);
assert.deepEqual(parsed.records.map(x=>x.externalId),['REF-1','REF-2']);
assert.deepEqual(parsed.bankBalance,{amount:13750,date:'2026-11-07',source:'csv-balance-column'});
const preview=bank.proposeReconciliation(parsed,db,'A');
const view=ui.bankImportMarkup(db,{accountId:'A',preview,filename:'extrato.csv',step:'review',csvMapping:inspected,decisions:{}});
assert.match(view,/data-action="bank-import-map"/);
assert.match(view,/R\$ 137\.50/);
assert.match(view,/data-action="bank-import-review" disabled/,'No decision = no financial write');
assert.deepEqual(db.payments,[]);
assert.deepEqual(db.titles,[]);

for(const [label,cols] of [
 ['duplicate',{...indexes,description:0}],
 ['out of range',{...indexes,date:100}],
 ['missing date',{...indexes,date:-1}],
 ['two modes',{...indexes,amount:2}]
]){
 assert.throws(()=>bank.parseBankCsv(raw,{separator:'|',indexes:cols}),undefined,label);
}
const kinds='Dia;Histórico;Montante;Natureza\n06/11/2026;TARIFA;12,50;D\n06/11/2026;RECEITA;25,00;C';
const typed=bank.parseBankCsv(kinds,{indexes:{date:0,description:1,amount:2,kind:3}});
assert.deepEqual(typed.records.map(x=>x.amount),[-1250,2500]);
assert.throws(()=>bank.parseBankCsv(kinds.replace(';12,50;D',';12,50;INDEFINIDO'),{indexes:{date:0,description:1,amount:2,kind:3}}),/tipo de movimento não reconhecido/);
const standard=bank.parseBankStatement('Data;Descrição;Valor;Tipo\n06/11/2026;TARIFA;12,50;Débito','legado.csv');
assert.equal(standard.records[0].amount,-1250,'Previously supported CSV stays valid');
console.log('GB+ build 9: CSV manual mapping, sanitization, signs, legacy data and no mutation OK.');
