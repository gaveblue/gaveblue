// GB+ 2.5.0 build 2 — read-only reconciliation + secure metadata regression.
// Run: node gbplus/tests/bank-reconciliation-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const source=name=>readFileSync(resolve(here,'../js/'+name+'.js'),'utf8');
const load=(name,deps,names)=>{
 const js=source(name).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
 return Function(...Object.keys(deps),js+';return {'+names.join(',')+'}')( ...Object.values(deps) );
};
const recon=load('bank-reconciliation',{},['reconciliationRecordKey','knownReconciliationKeys','reviewSelection','applyReconciliationBatch','undoReconciliationBatch','bankImportHistory']);
const bank=load('bank-import-preview',{},['parseBankStatement','proposeReconciliation']);
const store=load('store',{
 uid:()=> 'u',validDate:x=>/^\d{4}-\d{2}-\d{2}$/.test(x),paid:()=>0,
 today:()=> '2026-11-06',CATEGORY_ICON_OPTIONS:[],BANKS:[]
},['validateDatabase','defaultPanel']);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui=load('bank-import-ui',{
 money:n=> 'R$ '+(n/100).toFixed(2),dateLabel:x=>x,esc,icon:()=>'<svg></svg>',
 reconciliationRecordKey:recon.reconciliationRecordKey,
 knownReconciliationKeys:recon.knownReconciliationKeys,
 bankImportHistory:recon.bankImportHistory
},['bankImportMarkup','bankImportHistoryMarkup']);
const database={
 schemaVersion:1,revision:0,
 accounts:[{id:'account-a',name:'Conta A',bank:'',branch:'',number:'',initial:1000,active:true},
  {id:'account-b',name:'Conta B',bank:'',branch:'',number:'',initial:0,active:true}],
 titles:[{id:'title-a',description:'Pix cliente',document:'',notes:'',type:'income',
   amount:1563,issue:'2026-11-06',due:'2026-11-06',cancelled:false,accountId:'account-a',
   partnerId:'',categoryId:'cat-in',mode:'single',sequence:1,count:1,groupId:null}],
 payments:[{id:'payment-a',titleId:'title-a',accountId:'account-a',amount:1563,date:'2026-11-06'}],
 transfers:[],partners:[],categories:[{id:'cat-in',type:'income',name:'Vendas'}],
 settings:{theme:'light',panel:store.defaultPanel()}
};
const text='Data;Histórico;Valor;Tipo;Identificador\n06/11/2026;Pix cliente;15,63;Crédito;T-1\n06/11/2026;Tarifa;5,00;Débito;T-2';
const parsed=bank.parseBankStatement(text,'banco.csv');
const preview=bank.proposeReconciliation(parsed,database,'account-a');
const decisions={0:{action:'link',target:'payment:payment-a'},1:{action:'pending'}};
const before=JSON.stringify({titles:database.titles,payments:database.payments,transfers:database.transfers,accounts:database.accounts});
const plan=recon.reviewSelection(preview,decisions,database);
assert.equal(plan.totals.linked,1);
assert.equal(plan.totals.pending,1);
assert.equal(plan.entries.length,2);
assert.equal(database.bankImportBatches,undefined,'Review cannot mutate db');
const onScreen=ui.bankImportMarkup(database,{accountId:'account-a',preview,decisions,filter:'all',step:'review',page:0});
assert.match(onScreen,/data-bank-review-index="0"/);
assert.match(onScreen,/data-bank-review-target="0"/);
const confirmation=ui.bankImportMarkup(database,{accountId:'account-a',preview,decisions,review:plan,step:'confirm'});
assert.match(confirmation,/Confirmar 2 decisão/);
assert.match(confirmation,/Alteração de saldo/);
assert.throws(()=>recon.reviewSelection(preview,{0:{action:'link',target:'payment:other'}},database));
assert.throws(()=>recon.reviewSelection(preview,{},database));
assert.equal(bank.proposeReconciliation(parsed,database,'account-b').totals.possibleMatches,0);
const saved=recon.applyReconciliationBatch(database,parsed,'account-a',decisions,{
 propose:bank.proposeReconciliation,batchId:'batch-1',now:'2026-11-06T15:30:00Z'
});
assert.equal(saved.batch.entries.length,2);
assert.equal(JSON.stringify({titles:database.titles,payments:database.payments,transfers:database.transfers,accounts:database.accounts}),before,'No financial mutation');
assert.equal(recon.knownReconciliationKeys(database,'account-a').size,2);
assert.throws(()=>recon.reviewSelection(preview,decisions,database),'Reimport blocked');
assert.throws(()=>recon.applyReconciliationBatch(database,parsed,'account-a',decisions,{
 propose:bank.proposeReconciliation,batchId:'batch-2'
}));
assert.match(ui.bankImportHistoryMarkup(database,'account-a'),/Reverter vínculos/);
assert.equal(store.validateDatabase(database),database,'Audit should fit existing document schema');
const invalid=structuredClone(database);
invalid.bankImportBatches[0].entries.push({...invalid.bankImportBatches[0].entries[0]});
assert.throws(()=>store.validateDatabase(invalid),'Repeated fingerprint');
const forged=structuredClone(database);
forged.bankImportBatches[0].entries[0].amount=-1563;
assert.throws(()=>store.validateDatabase(forged),'Incorrect amount sign');
const fileName=ui.bankImportMarkup(database,{accountId:'account-a',preview,decisions:{},filename:'<img src=x onerror=alert(1)>.csv',step:'review'});
assert(!fileName.includes('<img src=x'), 'Filename must be HTML-escaped');
recon.undoReconciliationBatch(database,'batch-1','2026-11-06T16:00:00Z');
assert.equal(database.bankImportBatches[0].status,'reverted');
assert.equal(recon.knownReconciliationKeys(database,'account-a').size,0);
assert.equal(recon.reviewSelection(preview,decisions,database).entries.length,2,'Can reimport after explicit undo');
assert.equal(store.validateDatabase(database),database);
const afterUndo=structuredClone(database);
afterUndo.payments=[];
assert.equal(store.validateDatabase(afterUndo),afterUndo,'Financial payment reversal must not be blocked by history');
assert.equal(JSON.stringify({titles:database.titles,payments:database.payments,transfers:database.transfers,accounts:database.accounts}),before);
console.log('GB+ 2.5.0 build 2: 24 checks for review, audit, duplicate prevention and reversal passed.');
