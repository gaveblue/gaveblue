// GB+ 2.5.0 build 3 — creation from unmatched bank transactions.
// Run: node gbplus/tests/bank-reconciliation-create-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const load=(name,deps,keys)=>{
 const source=readFileSync(resolve(here,'../js/'+name+'.js'),'utf8')
  .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
 return Function(...Object.keys(deps),source+';return {'+keys.join(',')+'}')(...Object.values(deps));
};
const reconciler=load('bank-reconciliation',{},[
 'reviewSelection','applyReconciliationBatch','undoReconciliationBatch',
 'knownReconciliationKeys','pendingReconciliationKeys','potentialExistingTitle','bankImportHistory'
]);
const bank=load('bank-import-preview',{},['parseBankStatement','proposeReconciliation']);
const store=load('store',{
 uid:()=> 'generated-id',
 validDate:value=>/^2026-11-06$/.test(value),
 paid:(db,id)=>db.payments.filter(p=>p.titleId===id).reduce((sum,p)=>sum+p.amount,0),
 today:()=> '2026-11-06',
 CATEGORY_ICON_OPTIONS:[],BANKS:[]
},['validateDatabase','defaultPanel']);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
const ui=load('bank-import-ui',{
 money:n=>'R$ '+(n/100).toFixed(2),dateLabel:s=>s,esc,icon:()=>'', 
 reconciliationRecordKey:load('bank-reconciliation',{},['reconciliationRecordKey']).reconciliationRecordKey,
 knownReconciliationKeys:reconciler.knownReconciliationKeys,
 bankImportHistory:reconciler.bankImportHistory
},['bankImportMarkup','bankImportHistoryMarkup']);
const domain=load('domain',{
 parseMoneyCentavos:()=>0,expectedDates:()=>[],nextBusinessDay:x=>x,recurrenceAnchor:x=>x
},['accountBalance']);
const clone=value=>structuredClone(value);
const db={
 schemaVersion:1,revision:0,
 accounts:[{id:'a',name:'Conta A',bank:'',branch:'',number:'',initial:10000,active:true}],
 categories:[{id:'income-cat',name:'Recebimentos',type:'income'},
   {id:'expense-cat',name:'Tarifas',type:'expense'}],
 titles:[],payments:[],transfers:[],partners:[],
 settings:{theme:'light',panel:store.defaultPanel()}
};
const parsed=bank.parseBankStatement(
 'Data;Histórico;Valor;Tipo;Identificador\n'+
 '06/11/2026;Pix cliente;50,00;Crédito;PIX-1\n'+
 '06/11/2026;Tarifa mensal;12,50;Débito;TAR-2','banco.csv'
);
const preview=bank.proposeReconciliation(parsed,db,'a');
assert.deepEqual(preview.rows.map(r=>r.status),['not_found','not_found']);
const choices={
 0:{action:'create',categoryId:'income-cat',description:'Pix cliente'},
 1:{action:'create',categoryId:'expense-cat',description:'Tarifa mensal'}
};
const plan=reconciler.reviewSelection(preview,choices,db,{today:'2026-11-06'});
assert.equal(plan.totals.created,2);
assert.equal(plan.totals.amountCreatedIn,5000);
assert.equal(plan.totals.amountCreatedOut,1250);
assert.equal(db.titles.length,0,'Reading and review never write finance');
assert.equal(domain.accountBalance(db,'a','2026-11-06'),10000,'Opening balance is unchanged before approval');
assert.throws(()=>reconciler.reviewSelection(preview,{0:{action:'create',categoryId:'',description:'Pix'}},db,{today:'2026-11-06'}));
assert.throws(()=>reconciler.reviewSelection(preview,{1:{action:'create',categoryId:'income-cat',description:'Tarifa'}},db,{today:'2026-11-06'}));
assert.throws(()=>reconciler.reviewSelection(preview,choices,db,{today:'2026-11-05'}),'Future payment date rejected');
const pending=clone(db);
pending.titles.push({type:'income',amount:5000,due:'2026-11-06',cancelled:false,description:'Pix cliente',accountId:'a'});
assert.equal(reconciler.potentialExistingTitle(pending,'a',preview.rows[0].record),true);
assert.throws(()=>reconciler.reviewSelection(preview,choices,pending,{today:'2026-11-06'}),'Potential duplicate title must be reviewed');
const partial=clone(db);
partial.titles.push({id:'old-pending',type:'income',amount:10000,due:'2026-11-06',cancelled:false,description:'Pix cliente',accountId:'a'});
partial.payments.push({id:'partial-payment',titleId:'old-pending',accountId:'a',amount:5000,date:'2026-11-06'});
assert.equal(reconciler.potentialExistingTitle(partial,'a',preview.rows[0].record),true,'Do not duplicate remaining amount of a partially paid title');
assert.throws(()=>reconciler.reviewSelection(preview,choices,partial,{today:'2026-11-06'}));

const before=JSON.stringify({accounts:db.accounts,titles:db.titles,payments:db.payments,transfers:db.transfers});
let sequence=0;
const saved=reconciler.applyReconciliationBatch(db,parsed,'a',choices,{
 batchId:'batch-3',now:'2026-11-06T17:00:00Z',today:'2026-11-06',
 makeId:()=> 'import-created-'+(++sequence),
 propose:bank.proposeReconciliation
});
assert.equal(saved.totals.created,2);
assert.equal(domain.accountBalance(db,'a','2026-11-06'),13750,'Paid income minus paid expense updates bank balance exactly once');
assert.equal(db.titles.length,2);
assert.equal(db.payments.length,2);
assert.deepEqual(db.titles.map(t=>t.type),['income','expense']);
assert.deepEqual(db.titles.map(t=>t.amount),[5000,1250]);
assert.deepEqual(db.payments.map(p=>p.amount),[5000,1250]);
assert(db.payments.every((p,i)=>p.titleId===db.titles[i].id&&p.accountId==='a'));
assert.equal(db.bankImportBatches[0].entries.length,2);
assert(db.bankImportBatches[0].entries.every(e=>e.action==='create'&&e.createdTitleId&&e.createdPaymentId));
assert.equal(store.validateDatabase(db),db,'Created titles/payments/history satisfy document schema');
assert.equal(reconciler.knownReconciliationKeys(db,'a').size,2);
assert.throws(()=>reconciler.reviewSelection(preview,choices,db,{today:'2026-11-06'}),'Reimport rejected');
assert.throws(()=>reconciler.applyReconciliationBatch(db,parsed,'a',choices,{
 batchId:'batch-retry',today:'2026-11-06',makeId:()=> 'newid',propose:bank.proposeReconciliation
}),'No duplicate payment');
const previewUI=ui.bankImportMarkup({...db,bankImportBatches:[]},{
 accountId:'a',preview,decisions:choices,step:'review',filter:'all',page:0
});
assert.match(previewUI,/data-bank-create-category="0"/);
assert.match(previewUI,/data-bank-create-description="1"/);
const confirmUI=ui.bankImportMarkup(db,{
 accountId:'a',preview,decisions:choices,step:'confirm',review:plan,confirmCreation:false
});
assert.match(confirmUI,/gb-import-create-confirm/);
assert.match(confirmUI,/data-action="bank-import-commit" disabled/);
const altered=clone(db);
altered.titles[0].description='Título alterado pelo usuário';
assert.throws(()=>reconciler.undoReconciliationBatch(altered,'batch-3'),'Edited imported title cannot be deleted silently');
assert.equal(altered.payments.length,2);
assert.equal(altered.bankImportBatches[0].status,'active');
reconciler.undoReconciliationBatch(db,'batch-3','2026-11-06T18:00:00Z');
assert.equal(db.payments.length,0,'Reversal removes only its own payments');
assert.equal(db.titles.length,0,'Reversal removes only its own titles');
assert.equal(domain.accountBalance(db,'a','2026-11-06'),10000,'Reversing lot restores previous balance');
assert.equal(db.bankImportBatches[0].status,'reverted');
assert.equal(store.validateDatabase(db),db,'Reverted audit preserves valid schema');
assert.equal(reconciler.knownReconciliationKeys(db,'a').size,0);
assert.equal(reconciler.reviewSelection(preview,choices,db,{today:'2026-11-06'}).entries.length,2);
assert.equal(JSON.stringify({accounts:db.accounts,titles:db.titles,payments:db.payments,transfers:db.transfers}),before);
console.log('GB+ 2.5.0 build 3: criação, autorização, isolamento, anti-duplicidade e estorno OK.');
