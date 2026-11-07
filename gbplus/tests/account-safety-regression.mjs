// GB+ 2.6.1 — no financial data is removed without explicit user confirmation.
// Run: node gbplus/tests/account-safety-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const src=file=>readFileSync(resolve(here,'../js/'+file+'.js'),'utf8');
const load=(file,deps,keys)=>Function(...Object.keys(deps),src(file)
 .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+
 ';return {'+keys.join(',')+'};')(...Object.values(deps));
const baseline=()=>({
 schemaVersion:1,revision:0,titles:[],payments:[],accounts:[],cards:[],cardPurchases:[],
 transfers:[],partners:[],banks:[],bankImportBatches:[],categories:[{id:'default',name:'Outras despesas',type:'expense'}],
 settings:{theme:'light',panel:{desktop:{balance:true},mobile:{balance:true}},setupCompleted:false}
});
const safety=load('account-safety',{emptyDatabase:baseline},[
 'financialResetCounts','canResetFinancialData','canDeleteAccount','clearFinancialDocument'
]);
const sample={
 schemaVersion:1,revision:19,
 titles:[{id:'title1'}],payments:[{id:'pay1'}],accounts:[{id:'acc1'}],
 cards:[{id:'card1'}],cardPurchases:[{id:'purchase1'}],transfers:[{id:'trans1'}],
 partners:[{id:'partner1'}],banks:[{id:'bank1'}],bankImportBatches:[{id:'batch1'}],
 settings:{theme:'dark',setupCompleted:true},secretSetting:'not persisted'
};
const original=structuredClone(sample);
const count=safety.financialResetCounts(sample);
for(const value of Object.values(count))assert.equal(value,1);
assert(!safety.canResetFinancialData('',''));
assert(!safety.canResetFinancialData('limpar',true));
assert(!safety.canResetFinancialData('LIMPAR',false));
assert(safety.canResetFinancialData('LIMPAR',true));
assert(!safety.canDeleteAccount('EXCLUIR','outro@exemplo.com','pessoa@exemplo.com',true));
assert(!safety.canDeleteAccount('excluir','pessoa@exemplo.com','pessoa@exemplo.com',true));
assert(!safety.canDeleteAccount('EXCLUIR','pessoa@exemplo.com','pessoa@exemplo.com',false));
assert(safety.canDeleteAccount('EXCLUIR','pessoa@exemplo.com','pessoa@exemplo.com',true));
const copy=structuredClone(sample);
assert.equal(safety.clearFinancialDocument(copy),copy);
assert.deepEqual(copy,baseline(),'Reset must restore a valid initial financial document');
assert.deepEqual(sample,original,'Reset must not mutate the in-use account until save succeeds');
assert.throws(()=>safety.clearFinancialDocument(null),/inválidos/);

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
const ui=load('account-safety-ui',{
 esc,icon:()=>'<svg></svg>',button:(label,action)=>'<button data-action="'+action+'">'+label+'</button>',
 financialResetCounts:safety.financialResetCounts,
 canResetFinancialData:safety.canResetFinancialData,
 canDeleteAccount:safety.canDeleteAccount
},['resetAccountModal','deleteAccountModal']);
const reset=ui.resetAccountModal(sample,true);
assert.match(reset,/Limpar todos os registros financeiros/);
assert.match(reset,/seu login|Seu login/);
assert.match(reset,/LIMPAR/);
assert.match(reset,/id="gb-reset-execute"[^>]*disabled/);
assert.match(reset,/Exportar backup JSON/);
const deletion=ui.deleteAccountModal({email:'pessoa@exemplo.com'});
assert.match(deletion,/EXCLUIR/);
assert.match(deletion,/id="gb-delete-execute"[^>]*disabled/);
assert.match(deletion,/pessoa@exemplo.com/);
assert(!ui.deleteAccountModal({email:'<x>@exemplo.com'}).includes('<x>'), 'Email must be HTML-escaped');
const app=src('app');
const views=src('views');
assert.match(views,/settings-reset/);
assert.match(views,/settings-delete/);
assert.match(app,/commit\(d=>clearFinancialDocument\(d\)/, 'Reset must use revision-checked commit');
assert.match(app,/functions\.invoke\('gbplus-delete-account'/);
assert(!app.includes('A exclusão automática ainda não está disponível'),'Old fake delete flow must be gone');
const backend=readFileSync(resolve(here,'../../supabase/functions/gbplus-delete-account/index.ts'),'utf8');
assert.match(backend,/admin\.auth\.getUser\(token\)/,'Must validate actual signed-in user');
assert.match(backend,/admin\.auth\.admin\.deleteUser\(user\.id, false\)/,'Can delete only Auth-verified caller');
assert.match(backend,/body\.confirmation !== 'EXCLUIR'/);
assert(!backend.includes('body.user_id')&&!backend.includes('body.userId'),'Never trust user IDs sent by browser');
assert(!app.includes('SUPABASE_SERVICE_ROLE_KEY'),'Never expose admin key in client');
console.log('GB+ 2.6.1: reset financeiro, confirmações e exclusão autenticada verificados.');
