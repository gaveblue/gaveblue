// GB+ 2.5.0 — local persistence and revision-conflict test.
// Run: node gbplus/tests/bank-reconciliation-storage-regression.mjs
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
let id=0;const uid=()=> 'localtest-'+(++id);
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'));
const paid=(db,titleId)=>db.payments.filter(p=>p.titleId===titleId).reduce((n,p)=>n+p.amount,0);
const store=load('store',{
 uid,validDate,paid,today:()=> '2026-11-06',CATEGORY_ICON_OPTIONS:[],BANKS:[]
},['LocalRepository','validateDatabase','defaultPanel','KEY','backupText','parseBackup']);
const bank=load('bank-import-preview',{},['parseBankStatement','proposeReconciliation']);
const reconcile=load('bank-reconciliation',{},['applyReconciliationBatch','undoReconciliationBatch','knownReconciliationKeys']);
const domain=load('domain',{
 parseMoneyCentavos:()=>0,expectedDates:()=>[],nextBusinessDay:x=>x,recurrenceAnchor:x=>x
},['accountBalance']);
const data={
 schemaVersion:1,revision:0,
 accounts:[{id:'account',name:'Conta fictícia',bank:'',branch:'',number:'',active:true,initial:10000}],
 categories:[
  {id:'category-income',name:'Recebimentos',type:'income'},
  {id:'category-expense',name:'Tarifas',type:'expense'}
 ],
 titles:[],payments:[],transfers:[],partners:[],
 settings:{theme:'light',panel:store.defaultPanel()}
};
store.validateDatabase(data);
const map=new Map([[store.KEY,JSON.stringify(data)]]);
const fakeStorage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
const repoA=new store.LocalRepository(fakeStorage);
const repoB=new store.LocalRepository(fakeStorage);
const initialA=await repoA.read(),initialB=await repoB.read();
assert.equal(initialA.revision,0);
const parsed=bank.parseBankStatement(
 'Data;Histórico;Valor;Tipo;Identificador\n'+
 '06/11/2026;HOMOLOGACAO PIX;50,00;Crédito;TEST-PIX\n'+
 '06/11/2026;HOMOLOGACAO TARIFA;12,50;Débito;TEST-TAR','test.csv'
);
const edited=structuredClone(initialA);
const choices={
 0:{action:'create',categoryId:'category-income',description:'HOMOLOGACAO PIX'},
 1:{action:'create',categoryId:'category-expense',description:'HOMOLOGACAO TARIFA'}
};
reconcile.applyReconciliationBatch(edited,parsed,'account',choices,{
 batchId:uid(),now:'2026-11-06T17:00:00Z',today:'2026-11-06',makeId:uid,
 propose:bank.proposeReconciliation
});
const saved=await repoA.save(edited);
assert.equal(saved.revision,1,'Revision increments exactly once');
assert.equal(saved.titles.length,2);
assert.equal(saved.payments.length,2);
assert.equal(domain.accountBalance(saved,'account','2026-11-06'),13750,'Final balance exactly R$ 137.50');
await assert.rejects(()=>repoB.save(initialB),/outra aba/,'Stale concurrent writer must be rejected');
const repoC=new store.LocalRepository(fakeStorage);
const restored=await repoC.read();
assert.equal(restored.revision,1);
assert.equal(reconcile.knownReconciliationKeys(restored,'account').size,2);
assert.throws(()=>reconcile.applyReconciliationBatch(structuredClone(restored),parsed,'account',choices,{
 batchId:uid(),now:'2026-11-06T17:05:00Z',today:'2026-11-06',makeId:uid,propose:bank.proposeReconciliation
}),'No duplicate import after reload');
const backup=store.parseBackup(store.backupText(restored));
assert.equal(backup.revision,1,'Backup round-trip must retain import history and revision');
reconcile.undoReconciliationBatch(restored,restored.bankImportBatches[0].id,'2026-11-06T18:00:00Z');
const reversed=await repoC.save(restored);
assert.equal(reversed.revision,2);
assert.equal(reversed.titles.length,0);
assert.equal(reversed.payments.length,0);
assert.equal(domain.accountBalance(reversed,'account','2026-11-06'),10000,'Rollback restores R$ 100.00');
assert.equal(reversed.bankImportBatches[0].status,'reverted','Undo keeps auditable history');
const repoD=new store.LocalRepository(fakeStorage);
assert.equal((await repoD.read()).revision,2,'Reversal remains persisted after reload');
console.log('GB+ 2.5.0: persistência local, concorrência, backup, duplicidade e reversão OK.');
