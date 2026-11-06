// GB+ 2.5.0 build 7 — declared bank balance, reference date and read-only comparison.
// Run: node gbplus/tests/bank-import-balance-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=dirname(fileURLToPath(import.meta.url));
const load=(name,deps,keys)=>{
 const source=readFileSync(resolve(dir,'../js/'+name+'.js'),'utf8')
  .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
 return Function(...Object.keys(deps),source+';return {'+keys.join(',')+'}')(...Object.values(deps));
};
const parser=load('bank-import-preview',{},['parseBankStatement','proposeReconciliation']);
const rec=load('bank-reconciliation',{},[
 'reconciliationRecordKey','knownReconciliationKeys','pendingReconciliationKeys','bankImportHistory'
]);
const esc=x=>String(x??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const balance=(db,id,date)=>{
 const a=db.accounts.find(x=>x.id===id);
 return a.initial+db.payments.filter(p=>p.accountId===id&&p.date<=date).reduce((sum,p)=>
  sum+(db.titles.find(t=>t.id===p.titleId).type==='income'?p.amount:-p.amount),0)+
 db.transfers.filter(t=>t.date<=date).reduce((sum,t)=>sum+(t.to===id?t.amount:0)-(t.from===id?t.amount:0),0);
};
const ui=load('bank-import-ui',{
 money:n=>'R$ '+(n/100).toFixed(2),dateLabel:d=>d,esc,icon:()=>'',accountBalance:balance,...rec
},['bankImportMarkup','BANK_IMPORT_WRITES_ENABLED']);
assert.equal(ui.BANK_IMPORT_WRITES_ENABLED,true,'Build 8 enables assisted reconciliation with approval');
const db={
 accounts:[{id:'A',name:'Conta A',initial:10000,active:true},{id:'B',name:'Outra conta',initial:20000,active:true}],
 titles:[],payments:[],transfers:[],categories:[]
};
const ofx='<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS>'+
 '<BANKACCTFROM><ACCTID>1234567890</BANKACCTFROM>'+
 '<BANKTRANLIST><STMTTRN><DTPOSTED>20261106<TRNAMT>50.00<FITID>1<MEMO>Pix</STMTTRN></BANKTRANLIST>'+
 '<LEDGERBAL><BALAMT>137.50<DTASOF>20261106180000[-3:BRT]</LEDGERBAL>'+
 '</STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>';
const ofxResult=parser.parseBankStatement(ofx,'banco.ofx');
assert.deepEqual(ofxResult.bankBalance,{date:'2026-11-06',amount:13750,source:'ofx-ledger'});
assert.match(ofxResult.accountHint,/•/,'Account identifier masked');
const ofxPreview=parser.proposeReconciliation(ofxResult,db,'A');
assert.deepEqual(ofxPreview.bankBalance,ofxResult.bankBalance);
const before=JSON.stringify(db);
const visible=ui.bankImportMarkup(db,{
 accountId:'A',preview:ofxPreview,filename:'banco.ofx',step:'review',filter:'all',page:0,decisions:{}
});
assert.match(visible,/Diferença indicativa/);
assert.match(visible,/R\$ 137\.50/);
assert.match(visible,/R\$ 100\.00/);
assert.match(visible,/R\$ 37\.50/);
assert.match(visible,/saldo inicial do GB\+ não tem data-base/i);
assert(!visible.includes('data-action="bank-import-commit"'));
assert.equal(JSON.stringify(db),before,'Preview must not change account data');
const csv='Data;Descrição;Valor;Saldo\n06/11/2026;Pix;50,00;137,50\n05/11/2026;Tarifa;-12,50;87,50';
const csvResult=parser.parseBankStatement(csv,'banco.csv');
assert.deepEqual(csvResult.bankBalance,{date:'2026-11-06',amount:13750,source:'csv-balance-column'});
const ambiguous=parser.parseBankStatement(
 'Data;Descrição;Valor;Saldo\n06/11/2026;Pix;50,00;137,50\n06/11/2026;Tarifa;-12,50;87,50','banco.csv'
);
assert.equal(ambiguous.bankBalance,null,'Multiple intraday balances without time cannot be called final');
assert.match(ambiguous.warnings[0],/saldos diferentes/);
const ambiguityView=ui.bankImportMarkup(db,{
 accountId:'A',preview:parser.proposeReconciliation(ambiguous,db,'A'),step:'review',filter:'all',decisions:{}
});
assert.match(ambiguityView,/A comparação foi omitida/);
assert(!ambiguityView.includes('Diferença indicativa'));
const missingLatest=parser.parseBankStatement(
 'Data;Descrição;Valor;Saldo\n06/11/2026;Pix;50,00;\n05/11/2026;Tarifa;-12,50;87,50','banco.csv'
);
assert.equal(missingLatest.bankBalance,null,'Past-day balance is not the latest closing balance');

const missing=parser.parseBankStatement('Data;Descrição;Valor\n06/11/2026;Pix;50,00','banco.csv');
assert.equal(missing.bankBalance,null);
const missView=ui.bankImportMarkup(db,{
 accountId:'A',preview:parser.proposeReconciliation(missing,db,'A'),step:'review',filter:'all',decisions:{}
});
assert.match(missView,/não informa um saldo bancário final/);
assert(!missView.includes('Diferença indicativa'));
console.log('GB+ 2.5.0 build 7: comparação indicativa de saldos, fonte e restrição de leitura OK.');
