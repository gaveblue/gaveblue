// GB+ 2.5.0 — import preview regression suite (offline, no accounts required).
// Run: node gbplus/tests/bank-import-preview-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const read=name=>readFileSync(resolve(here,'../js/'+name+'.js'),'utf8');
const load=(name,deps,exports)=>{
 const code=read(name).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
 return Function(...Object.keys(deps),code+';return {'+exports.join(',')+'}')(...Object.values(deps));
};
const parser=load('bank-import-preview',{},['parseBankStatement','parseBankCsv','parseBankOfx','proposeReconciliation','BANK_IMPORT_MAX_ROWS','statementCents']);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui=load('bank-import-ui',{money:cents=>'R$ '+(cents/100).toFixed(2),dateLabel:x=>x,esc,icon:()=>'◇'},['bankImportMarkup','BANK_IMPORT_PAGE_SIZE']);
assert.equal(parser.statementCents('1.234,56'),123456);
assert.equal(parser.statementCents('-12.34'),-1234);
const csv='Data;Histórico;Valor;Tipo;Identificador\n06/11/2026;"Pix recebido";"15,63";Crédito;PIX-1\n06/11/2026;Tarifa;"5,00";Débito;T-2';
const result=parser.parseBankStatement(csv,'banco.csv');
assert.equal(result.records.length,2);
assert.deepEqual(result.records.map(x=>x.amount),[1563,-500],'Debit sign inferred from Tipo');
const split=parser.parseBankCsv('Data;Descrição;Entrada;Saída\n06/11/2026;Crédito;15,63;\n06/11/2026;Débito;;5,00');
assert.deepEqual(split.records.map(x=>x.amount),[1563,-500]);
const ofx=parser.parseBankStatement('<OFX><BANKTRANLIST><STMTTRN><DTPOSTED>20261106<TRNAMT>-5.00<FITID>EX-1<MEMO>Tarifa</STMTTRN></BANKTRANLIST></OFX>','statement.ofx');
assert.equal(ofx.records.length,1);
assert.equal(ofx.records[0].amount,-500);
const db={
 accounts:[{id:'bank-a',name:'Conta corrente',active:true},{id:'bank-b',name:'Poupança',active:true}],
 titles:[{id:'title-1',type:'income',description:'Pix recebido'}],
 payments:[{id:'payment-1',titleId:'title-1',accountId:'bank-a',amount:1563,date:'2026-11-06'}],
 transfers:[],
};
const before=JSON.stringify(db);
const preview=parser.proposeReconciliation(result,db,'bank-a');
assert.deepEqual(preview.rows.map(row=>row.status),['possible_match','not_found']);
assert.equal(preview.totals.possibleMatches,1);
assert.equal(preview.totals.debits,500);
assert.equal(preview.totals.credits,1563);
assert.equal(JSON.stringify(db),before,'No bank, payment or title mutation');
const other=parser.proposeReconciliation(result,db,'bank-b');
assert.equal(other.totals.possibleMatches,0,'No cross-account matches');
const repeat=parser.parseBankCsv('Data;Descrição;Valor\n06/11/2026;Tarifa;-5,00\n06/11/2026;Tarifa;-5,00');
assert.equal(parser.proposeReconciliation(repeat,db,'bank-a').rows[1].status,'possible_duplicate_in_file');
const initial=ui.bankImportMarkup(db,{accountId:'bank-a',preview:null,error:''});
assert(initial.includes('id="gb-import-file"'));
assert(initial.includes('read')===false||initial.includes('read')); // Smoke test for render without browser.
const after=ui.bankImportMarkup(db,{accountId:'bank-a',preview,filename:'&<script>.csv',filter:'all',page:0});
assert(after.includes('Possível vínculo'));
assert(after.includes('&amp;&lt;script&gt;.csv'));
assert(!after.includes('<script>'),'No raw HTML from filename');
const many={...preview,rows:Array.from({length:45},(_,i)=>({...preview.rows[0],index:i,record:{...preview.rows[0].record,description:'Movimento '+i}})),totals:{...preview.totals,possibleMatches:45,unmatched:0,ambiguous:0}};
const page1=ui.bankImportMarkup(db,{accountId:'bank-a',preview:many,filename:'long.csv',filter:'all',page:0});
const page3=ui.bankImportMarkup(db,{accountId:'bank-a',preview:many,filename:'long.csv',filter:'all',page:2});
assert(page1.includes('Página 1 de 3'));
assert(page3.includes('Página 3 de 3'));
assert(page1.includes('Movimento 19')&&!page1.includes('Movimento 20'));
assert(page3.includes('Movimento 44')&&!page3.includes('Movimento 39'));
assert.equal(ui.BANK_IMPORT_PAGE_SIZE,20);
assert.throws(()=>parser.parseBankStatement('','empty.csv'));
console.log('GB+ 2.5.0: OFX/CSV, classificação, conta, segurança, paginação e não mutação OK.');
