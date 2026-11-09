// GB+ 2.9.0 — cofrinhos, metas, ícones, transferência e compatibilidade.
 // Execute: node gbplus/tests/gbplus-290-goals-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const strip=s=>s.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const load=(path,keys,deps={})=>
 Function(...Object.keys(deps),strip(read(path))+'; return {'+keys.join(',')+'}')( ...Object.values(deps));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>'<svg data-icon="'+esc(name)+'"></svg>';
const gbIcon=icon;
const money=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const date='2026-11-09',today=()=>date;
const domain=load('js/domain.js',['accountBalance','balance','transfer','validDate','paid'],{
 parseMoneyCentavos:value=>Math.round(Number(value)*100),
 expectedDates:()=>[],nextBusinessDay:value=>value,recurrenceAnchor:value=>value
});
const goals=load('js/account-goals.js',[
 'ACCOUNT_ICON_OPTIONS','GOAL_PRESETS','accountKind','accountIcon','accountMark',
 'goalProgress','goalProgressMarkup','goalPreset','accountTypeLabel'
],{gbIcon,bankBadge:b=>'<span>'+esc(b?.name||'Banco')+'</span>',
 bankForAccount:()=>null,accountBalance:domain.accountBalance,today,money,esc});
assert.equal(goals.accountKind({bank:'Banco'}),'bank');
assert.equal(goals.accountKind({bank:'',bankId:''}),'custom');
assert.equal(goals.accountKind({kind:'goal',bank:''}),'goal');
assert.equal(goals.accountIcon({kind:'goal'}),'piggy-bank');
assert.equal(goals.goalPreset('education')[2],'graduation-cap');

const accounts=[
 {id:'bank',name:'Banco',bank:'Banco',bankId:'',branch:'',number:'',initial:100000,active:true},
 {id:'vault',name:'Meu casamento',kind:'goal',icon:'heart',bank:'',bankId:'',
  branch:'',number:'',goalCategory:'wedding',goalTarget:100000,goalDue:'2027-11-09',
  initial:0,active:true}
];
const db={accounts,titles:[],payments:[],transfers:[]};
const original=domain.balance(db);
domain.transfer(db,{from:'bank',to:'vault',amount:25000,date});
assert.equal(domain.accountBalance(db,'bank'),75000);
assert.equal(domain.accountBalance(db,'vault'),25000);
assert.equal(domain.balance(db),original,'Depositar não cria dinheiro');
let progress=goals.goalProgress(db,accounts[1],date);
assert.equal(progress.percent,25);
assert.equal(progress.remaining,75000);
assert(progress.monthly>0);
assert(goals.goalProgressMarkup(db,accounts[1]).includes('25%'));
domain.transfer(db,{from:'vault',to:'bank',amount:5000,date});
assert.equal(domain.balance(db),original,'Retirar também não altera o saldo total');
assert.equal(goals.goalProgress(db,accounts[1],date).remaining,80000);

const field=(label,name,value='',type='text',attrs='')=>
 '<label>'+esc(label)+'<input name="'+esc(name)+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>';
const select=(label,name,options,value)=>'<label>'+esc(label)+'<select name="'+esc(name)+'">'+
 options.map(([v,l])=>'<option value="'+esc(v)+'" '+(v===value?'selected':'')+'>'+esc(l)+'</option>').join('')+'</select></label>';
const button=(title,action,kind='',extra='')=>'<button data-action="'+action+'" '+extra+'>'+title+'</button>';
const forms=load('js/forms.js',['accountForm','accountBankPreview','transferForm'],{
 esc,icon,gbIcon,field,select,button,formFooter:(label='Salvar')=>'<button type="submit">'+esc(label)+'</button>',
 findBank:()=>null,bankBadge:()=>'',accountKind:goals.accountKind,accountIcon:goals.accountIcon,
 goalPreset:goals.goalPreset,ACCOUNT_ICON_OPTIONS:goals.ACCOUNT_ICON_OPTIONS,GOAL_PRESETS:goals.GOAL_PRESETS,
 today
});
const goalForm=forms.accountForm(db,null,{kind:'goal'});
assert(goalForm.includes('name="kind" value="goal"'));
assert(goalForm.includes('name="goalTarget"')&&goalForm.includes('name="goalDue"'));
assert(goalForm.includes('name="goalCategory"')&&goalForm.includes('data-action="account-icon"'));
assert(!goalForm.includes('Outra instituição')&&!goalForm.includes('Agência (opcional)'));
const custom=forms.accountForm(db,null,{kind:'custom'});
assert(custom.includes('Conta personalizada')&&custom.includes('name="icon"'));
assert(custom.includes('data-account-goal-fields hidden'),'Meta escondida para conta sem banco');
assert(forms.accountBankPreview(db,'','','goal','heart').includes('Cofrinho'));
const transferMarkup=forms.transferForm(db,{to:'vault'});
assert(transferMarkup.includes('name="to"')&&transferMarkup.includes('value="vault"'));
assert(transferMarkup.includes('Transferir'));

const {accountsView}=load('js/views.js',['accountsView'],{
 accountKind:goals.accountKind,accountMark:goals.accountMark,
 accountTypeLabel:goals.accountTypeLabel,goalProgressMarkup:goals.goalProgressMarkup,
 bankName:()=>'',esc,money,accountBalance:domain.accountBalance,today,button,icon,
 heading:(title)=>'<h1>'+esc(title)+'</h1>',
 empty:(title)=>'<p>'+esc(title)+'</p>'
});
const rendered=accountsView(db,{embedded:true});
assert(rendered.includes('Meus cofrinhos')&&rendered.includes('Meu casamento'));
assert(rendered.includes('data-action="goal-deposit"')&&rendered.includes('data-action="goal-withdraw"'));
assert(rendered.includes('role="progressbar"')&&rendered.includes('Contas e dinheiro disponível'));
assert(!rendered.includes('Outra instituição'));

let n=0;
const store=load('js/store.js',['emptyDatabase','validateDatabase'],{
 uid:()=>String(++n),validDate:domain.validDate,paid:domain.paid,today,
 CATEGORY_ICON_OPTIONS:[],ACCOUNT_ICON_OPTIONS:goals.ACCOUNT_ICON_OPTIONS,
 GOAL_PRESETS:goals.GOAL_PRESETS,accountKind:goals.accountKind,
 BANKS:[],CATEGORY_SUGGESTIONS:[],DEFAULT_NOTIFICATION_PREFS:{},
 validNotificationPrefs:()=>true
});
const copy=store.emptyDatabase();
copy.accounts.push({...accounts[0],id:'bank'}, {...accounts[1],id:'vault'});
assert.equal(store.validateDatabase(copy),copy);
const bad=structuredClone(copy);
bad.accounts[1].goalTarget=0;
assert.throws(()=>store.validateDatabase(bad),/cofrinho/);
bad.accounts[1].goalTarget=100000;
bad.accounts[1].icon='<script>';
assert.throws(()=>store.validateDatabase(bad),/ícone/);
const legacy=structuredClone(copy);
delete legacy.accounts[0].kind;
delete legacy.accounts[0].icon;
assert.equal(store.validateDatabase(legacy),legacy,'Contas antigas continuam válidas');

const app=read('js/app.js');
assert(app.includes("'new-goal':()=>")&&app.includes("'goal-deposit':el=>"));
assert(app.includes("'goal-withdraw':el=>")&&app.includes("'account-icon':el=>"));
assert(app.includes("'goal-duration':el=>"));
assert(app.includes("accountBalance(d,v.from,v.date)<amount"),'Resgate sem saldo deve ser bloqueado');
assert(app.includes('branch:previous?.branch')&&app.includes('number:previous?.number'));
const index=read('index.html');
assert(index.includes('account-goals.css?v=20261109-2900'));
assert(index.includes('gbplus-version" content="2.9.0"'));
assert(read('sw.js').includes("gb-plus-shell-v2900"));
assert(JSON.parse(read('version.json')).version==='2.9.0');
console.log('GB+ 2.9.0: cofrinhos, metas, dinheiro conservado, integridade e compatibilidade aprovados.');
