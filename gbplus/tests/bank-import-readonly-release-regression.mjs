// GB+ 2.5.0 build 6 — production read-only safety lock.
// Run: node gbplus/tests/bank-import-readonly-release-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(base,path),'utf8');
const load=(code,deps,exports)=>{
 const cleaned=code.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'').replace('const BANK_IMPORT_WRITES_ENABLED=true','const BANK_IMPORT_WRITES_ENABLED=false');
 return Function(...Object.keys(deps),cleaned+';return {'+exports.join(',')+'}')(...Object.values(deps));
};
const finance=load(read('js/bank-reconciliation.js'),{},[
 'reconciliationRecordKey','knownReconciliationKeys','pendingReconciliationKeys','bankImportHistory'
]);
const parser=load(read('js/bank-import-preview.js'),{},['parseBankStatement','proposeReconciliation']);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const ui=load(read('js/bank-import-ui.js'),{
 money:amount=>'R$ '+(amount/100).toFixed(2),dateLabel:x=>x,esc,icon:()=>'',...finance
},['bankImportMarkup','bankImportHistoryMarkup','BANK_IMPORT_WRITES_ENABLED']);
assert.equal(ui.BANK_IMPORT_WRITES_ENABLED,false,'Safety lock MUST remain false in published code');
const db={
 accounts:[{id:'account',name:'Conta exemplo',active:true}],
 titles:[],payments:[],transfers:[],categories:[{id:'inc',name:'Receitas',type:'income'}]
};
const input=ui.bankImportMarkup(db,{accountId:'account',preview:null});
assert.match(input,/id="gb-import-file"/,'Bank upload must stay available');
const parsed=parser.parseBankStatement(
 'Data;Histórico;Valor;Tipo\n06/11/2026;Pix fictício;50,00;Crédito','test.csv'
);
const preview=parser.proposeReconciliation(parsed,db,'account');
const displayed=ui.bankImportMarkup(db,{
 accountId:'account',preview,filename:'test.csv',step:'review',
 decisions:{0:{action:'create',categoryId:'inc',description:'Pix fictício'}},page:0,filter:'all'
});
assert.match(displayed,/Prévia da leitura/);
assert.match(displayed,/Nenhum dado financeiro foi alterado/);
assert.match(displayed,/Fechar prévia/);
for(const forbidden of [
 'data-action="bank-import-review"',
 'data-action="bank-import-commit"',
 'data-bank-review-index',
 'data-bank-create-category',
 'data-bank-create-description',
 'gb-import-create-confirm'
])assert(!displayed.includes(forbidden),'Write control exposed: '+forbidden);
const fakeHistory={
 ...db,bankImportBatches:[{id:'b1',accountId:'account',createdAt:'2026-11-06T12:00:00Z',
  format:'csv',status:'active',entries:[{key:'mov:sample',action:'pending'}]}]
};
assert(!ui.bankImportHistoryMarkup(fakeHistory,'account').includes('data-action="bank-import-undo"'));
const app=read('js/app.js');
assert.match(app,/if\(!BANK_IMPORT_WRITES_ENABLED\)return;/,'Review handler must reject writes');
assert.match(app,/if\(!BANK_IMPORT_WRITES_ENABLED\)throw Error\('A conciliação com gravação/);
assert.match(app,/if\(!BANK_IMPORT_WRITES_ENABLED\)throw Error\('A reversão por importação/);
const html=read('index.html');
assert.match(html,/name="gbplus-version" content="2.5.0"/);
assert.match(html,/name="gbplus-build" content="9"/);
assert.match(html,/app\.js\?v=20261106-2509/);
const manifest=JSON.parse(read('version.json'));
assert.equal(manifest.build,9);
assert.equal(manifest.version,'2.5.0');
assert.match(manifest.release_status,/reconciliation/);
console.log('GB+ 2.5.0 build 6: preview enabled, all bank-import write actions locked.');
