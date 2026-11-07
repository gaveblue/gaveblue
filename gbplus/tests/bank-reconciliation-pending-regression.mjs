// GB+ 2.5.0 — pending bank reconciliation can be resumed safely.
// Run: node gbplus/tests/bank-reconciliation-pending-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const load=(name,deps,keys)=>{
 const raw=readFileSync(resolve(here,'../js/'+name+'.js'),'utf8')
  .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')
  .replace('const BANK_IMPORT_WRITES_ENABLED=false','const BANK_IMPORT_WRITES_ENABLED=true');
 return Function(...Object.keys(deps),raw+';return {'+keys.join(',')+'}')(...Object.values(deps));
};
const r=load('bank-reconciliation',{},[
 'reviewSelection','applyReconciliationBatch','undoReconciliationBatch',
 'knownReconciliationKeys','pendingReconciliationKeys','bankImportHistory','reconciliationRecordKey'
]);
const parser=load('bank-import-preview',{},['parseBankStatement','proposeReconciliation']);
const store=load('store',{
 uid:()=> 'test',validDate:s=>s==='2026-11-06',
 paid:(d,id)=>d.payments.filter(p=>p.titleId===id).reduce((sum,p)=>sum+p.amount,0),
 today:()=> '2026-11-06',CATEGORY_ICON_OPTIONS:[],BANKS:[]
},['validateDatabase','defaultPanel']);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui=load('bank-import-ui',{
 money:n=>'R$ '+(n/100).toFixed(2),dateLabel:s=>s,esc,icon:()=>'', 
 reconciliationRecordKey:r.reconciliationRecordKey,
 knownReconciliationKeys:r.knownReconciliationKeys,
 pendingReconciliationKeys:r.pendingReconciliationKeys,
 bankImportHistory:r.bankImportHistory
},['bankImportMarkup','bankImportHistoryMarkup']);
const db={
 schemaVersion:1,revision:0,
 accounts:[{id:'bank',name:'Conta teste',bank:'',branch:'',number:'',initial:10000,active:true}],
 categories:[{id:'cat',name:'Receitas',type:'income'}],
 titles:[],payments:[],transfers:[],partners:[],
 settings:{theme:'light',panel:store.defaultPanel()}
};
const parsed=parser.parseBankStatement(
 'Data;Descrição;Valor;Tipo;Identificador\n06/11/2026;Pix cliente;50,00;Crédito;TEST-1','sample.csv'
);
const preview=()=>parser.proposeReconciliation(parsed,db,'bank');
const save=(id,decisions)=>{
 let serial=0;
 return r.applyReconciliationBatch(db,parsed,'bank',decisions,{
  batchId:id,now:'2026-11-06T15:00:00Z',today:'2026-11-06',
  propose:parser.proposeReconciliation,makeId:()=>id+'-'+(++serial)
 });
};
const pending={0:{action:'pending'}},created={
 0:{action:'create',categoryId:'cat',description:'Pix cliente'}
};
save('pending-batch',pending);
assert.equal(r.pendingReconciliationKeys(db,'bank').size,1);
assert.equal(r.knownReconciliationKeys(db,'bank').size,0);
assert.equal(store.validateDatabase(db),db);
assert.throws(()=>r.reviewSelection(preview(),pending,db),'Cannot create a second pending decision');
const reviewUI=ui.bankImportMarkup(db,{accountId:'bank',preview:preview(),filter:'all',page:0,step:'review',decisions:{}});
assert.match(reviewUI,/Pendente · retomar/);
assert.match(reviewUI,/Criar receita e registrar recebimento/);
const rowDecisions=reviewUI.match(/<select[^>]*data-bank-review-index="0"[^>]*>([\s\S]*?)<\/select>/)?.[1]||'';
assert(rowDecisions && !rowDecisions.includes('<option value="pending"'), 'Already pending must not offer pending again in this row');
assert.equal(r.reviewSelection(preview(),created,db,{today:'2026-11-06'}).totals.created,1);
save('final-batch',created);
assert.equal(db.bankImportBatches[0].entries[0].resolvedByBatchId,'final-batch');
assert.equal(r.pendingReconciliationKeys(db,'bank').size,0);
assert.equal(r.knownReconciliationKeys(db,'bank').size,1);
assert.equal(store.validateDatabase(db),db);
assert.throws(()=>r.reviewSelection(preview(),created,db,{today:'2026-11-06'}),'Do not reimport resolved decision');
assert.throws(()=>r.undoReconciliationBatch(db,'pending-batch'),'Cannot undo provenance before final resolution');
r.undoReconciliationBatch(db,'final-batch','2026-11-06T16:00:00Z');
assert.equal(r.pendingReconciliationKeys(db,'bank').size,1);
assert.equal(r.knownReconciliationKeys(db,'bank').size,0);
assert.equal(db.bankImportBatches[0].entries[0].resolvedByBatchId,undefined);
assert.equal(db.titles.length,0);
assert.equal(db.payments.length,0);
assert.equal(store.validateDatabase(db),db);
r.undoReconciliationBatch(db,'pending-batch','2026-11-06T16:30:00Z');
assert.equal(r.pendingReconciliationKeys(db,'bank').size,0);
assert.equal(store.validateDatabase(db),db);
console.log('GB+ 2.5.0: pendências, retomada, auditoria e reversão encadeada OK.');
