// GB+ 3.0.0 — integrated visual selectors, forms and financial invariants.
// node gbplus/tests/gbplus-300-visual-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const strip=code=>code.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const load=(path,keys,deps={})=>Function(...Object.keys(deps),
 strip(read(path))+';return {'+keys.join(',')+'}')( ...Object.values(deps));
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon=name=>'<svg data-icon="'+esc(name)+'"></svg>';
const gbIcon=icon;
const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value/100);
const today=()=> '2026-11-09';
const field=(label,name,value='',type='text',attrs='')=>
 '<label class="field">'+esc(label)+'<input name="'+esc(name)+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>';
const select=(label,name,items,value='',attrs='')=>
 '<label class="field">'+esc(label)+'<select name="'+name+'" '+attrs+'>'+
 items.map(([id,text])=>'<option value="'+esc(id)+'"'+(String(id)===String(value)?' selected':'')+'>'+esc(text)+'</option>').join('')+'</select></label>';
const button=(label,action,cls='',extra='')=>
 '<button type="button" class="button '+cls+'" data-action="'+action+'" '+extra+'>'+label+'</button>';
const formFooter=(label='Salvar')=>'<div class="form-footer"><button type="submit">'+esc(label)+'</button></div>';
const db={
 banks:[], accounts:[
  {id:'b1',name:'Conta principal',bank:'Banco de Teste',bankId:'b1bank',
   branch:'',number:'',initial:100000,active:true},
  {id:'cash',name:'Carteira física',kind:'custom',icon:'wallet',bank:'',bankId:'',
   branch:'',number:'',initial:5000,active:true},
  {id:'goal',name:'Reserva de emergência',kind:'goal',icon:'shield-check',
   bank:'',bankId:'',branch:'',number:'',initial:20000,active:true,
   goalCategory:'emergency',goalTarget:200000,goalDue:'2027-12-31'}
 ], cards:[{id:'c1',name:'Cartão Teste',bankId:'b1bank',active:true,
   closingDay:10,dueDay:17,limit:300000,payAccountId:'b1',last4:'1234'}],
 cardPurchases:[],titles:[],payments:[],transfers:[],
 partners:[{id:'p1',name:'Fornecedor Teste',active:true}],
 categories:[{id:'ce',name:'Compras',type:'expense',icon:'shopping-cart'},
  {id:'ci',name:'Salário',type:'income',icon:'briefcase-business'}]
};
const banks=[{id:'b1bank',name:'Banco de Teste',code:'001',color:'#222222'}];
const findBank=(src,id)=>banks.find(x=>x.id===id)||null;
const bankBadge=b=>'<span class="bank" aria-label="'+esc(b?.name||'Banco')+'"></span>';
const bankPickerCatalog=()=>banks;
const accountBalance=(src,id)=>src.accounts.find(a=>a.id===id)?.initial||0;
const accountMark=(src,a)=>a.kind==='goal'?'<span class="goal-mark">meta</span>':
 a.kind==='custom'?'<span class="cash-mark">dinheiro</span>':bankBadge(findBank(src,a.bankId));
const ACCOUNT_ICON_OPTIONS=[['wallet','Carteira'],['shield-check','Segurança'],['piggy-bank','Cofrinho']];
const GOAL_PRESETS=[['emergency','Reserva de emergência','shield-check','Reserva de emergência'],
 ['custom','Outro objetivo','piggy-bank','Meu cofrinho']];
const categoryIconFor=c=>c?.icon||'tag';
const CATEGORY_ICON_OPTIONS=[['tag','Geral'],['shopping-cart','Compras']];
const picker=load('js/finance-picker-300.js',
 ['financePickerItems','financePickerField','refreshFinancePicker'],{
 esc,icon,money,accountBalance,today,bankPickerCatalog,bankBadge,findBank,
 accountMark,ACCOUNT_ICON_OPTIONS,GOAL_PRESETS,gbIcon,categoryIconFor,CATEGORY_ICON_OPTIONS});
assert.equal(picker.financePickerItems(db,'bank').length,2);
assert.equal(picker.financePickerItems(db,'account').length,3);
assert.equal(picker.financePickerItems(db,'account',{exclude:'cash'}).length,2);
assert.equal(picker.financePickerItems(db,'goal').length,2);
assert.equal(picker.financePickerItems(null,'category-icon').length,2);
assert.equal(picker.financePickerItems(db,'expense-category').length,1);
assert.equal(picker.financePickerItems(db,'partner',{allowEmpty:true}).length,2);
assert.equal(picker.financePickerItems(db,'account',{allowEmpty:true})[0].id,'');
const pickerHtml=picker.financePickerField(db,{kind:'account',name:'from',label:'Conta de origem',value:'b1'});
assert.match(pickerHtml,/data-action="gb30-picker"/);
assert.match(pickerHtml,/name="from"/);
assert.match(pickerHtml,/data-gb-native="true"/);
assert.match(pickerHtml,/tabindex="-1" aria-hidden="true"/);
assert.match(pickerHtml,/Conta principal/);
assert.match(pickerHtml,/Saldo disponível/);
assert(!pickerHtml.includes('value="<img'),'Raw markup cannot be selected');

const accountKind=a=>a.kind||(a.bank?'bank':'custom');
const accountIcon=a=>a.icon||'wallet';
const goalPreset=id=>GOAL_PRESETS.find(p=>p[0]===id)||GOAL_PRESETS[1];
const accountBankPreview=(src,bankId,manual,kind,ico)=>
 '<span>'+esc(kind||'custom')+' '+esc(ico||'wallet')+'</span>';
const forms=load('js/forms.js',
 ['accountForm','transferForm','paymentForm','categoryForm'],{
 esc,icon,gbIcon,field,select,button,formFooter,accountKind,accountIcon,
 goalPreset,findBank,bankBadge,CATEGORY_ICON_OPTIONS,categoryIconFor,
 ACCOUNT_ICON_OPTIONS,GOAL_PRESETS,financePickerField:picker.financePickerField,
 today,money,pending:()=>12000
});
const newAccount=forms.accountForm(db,null,{kind:'goal'});
assert.match(newAccount,/id="account-form"/);
assert.match(newAccount,/name="kind" value="goal"/);
assert.match(newAccount,/name="goalCategory"/);
assert.match(newAccount,/name="goalTarget"/);
assert.match(newAccount,/name="goalDue"/);
assert.match(newAccount,/data-kind="icon"/);
assert.match(newAccount,/data-kind="goal"/);
assert.match(newAccount,/gb30-optional/);
assert(!newAccount.includes('gb-account-icon-grid'),'No massive icon grid by default');
const editAccount=forms.accountForm(db,db.accounts[2]);
assert.match(editAccount,/Editar/); // Edit form includes optional delete button.
const transferForm=forms.transferForm(db,{to:'goal'});
assert.match(transferForm,/data-field="from"/);
assert.match(transferForm,/data-field="to"/);
assert.match(transferForm,/value="goal"/);
assert.match(transferForm,/name="amount"/);
const paymentForm=forms.paymentForm(db,{id:'t1',description:'Conta de luz',accountId:'b1'});
assert.match(paymentForm,/data-field="accountId"/);
assert.match(paymentForm,/name="amount"/);
const categoryForm=forms.categoryForm();
assert.match(categoryForm,/data-kind="category-icon"/);
assert.match(categoryForm,/name="icon"/);
assert(!categoryForm.includes('gb-category-icon-grid'));

const creditCards=src=>src.cards;
const finance24=load('js/finance-24-ui.js',['cardForm','cardPurchaseForm','cardsView'],{
 esc,field,select,formFooter,button,icon,money,today,creditCards,cardPurchases:()=>[],
 financePickerField:picker.financePickerField,findBank,bankBadge,
 cardUsed:()=>10000,cardAvailable:()=>290000,cardCycle:()=> '2026-11',
 cardDue:()=> '2026-11-17',pending:()=>0,paid:()=>0,status:()=> 'Em aberto',
 dateLabel:s=>s,heading:(name)=>name,empty:(title)=>title
});
const cardMarkup=finance24.cardForm(db,db.cards[0]);
assert.match(cardMarkup,/data-field="bankId"/);
assert.match(cardMarkup,/data-field="payAccountId"/);
assert.match(cardMarkup,/gb30-optional/);
assert.match(cardMarkup,/name="limit"/);
assert.match(cardMarkup,/name="closingDay"/);
assert.match(cardMarkup,/name="dueDay"/);
assert.match(cardMarkup,/name="active"/);
const purchaseMarkup=finance24.cardPurchaseForm(db,'c1');
assert.match(purchaseMarkup,/data-field="cardId"/);
assert.match(purchaseMarkup,/data-field="categoryId"/);
assert.match(purchaseMarkup,/data-field="partnerId"/);
assert.match(purchaseMarkup,/name="amount"/);
const cardsMarkup=finance24.cardsView(db,{embedded:true});
assert.match(cardsMarkup,/gb30-card-details/);
assert.match(cardsMarkup,/data-action="new-card-purchase"/);
assert.match(cardsMarkup,/data-action="new-card-invoice"/);
const view=load('js/views.js',['accountsView'],{
 esc,money,accountBalance,today,button,icon,accountKind,accountMark,
 accountTypeLabel:a=>a.kind||'Banco',goalProgressMarkup:()=>'<div role="progressbar">20%</div>',
 bankName:(src,id)=>findBank(src,id)?.name||'',heading:x=>x,empty:x=>x
});
const accountsMarkup=view.accountsView(db,{embedded:true});
assert.match(accountsMarkup,/gb30-accounts-summary/);
assert.match(accountsMarkup,/Em contas/);
assert.match(accountsMarkup,/Nos cofrinhos/);
assert.match(accountsMarkup,/gb30-more/);
assert.match(accountsMarkup,/data-action="goal-deposit"/);
assert.match(accountsMarkup,/data-action="goal-withdraw"/);
const app=read('js/app.js');
assert.match(app,/'gb30-picker':el=>/);
assert.match(app,/refreshFinancePicker\(form,'goalCategory'/);
assert.match(app,/ensureCardMayChange/);
assert.match(app,/accountBalance\(d,v.from,v.date\)<amount/);
const sheet=read('js/bottom-sheet.js');
for(const kind of ['icon','goal','partner','expense-category','category-icon'])
 assert(sheet.includes("'"+kind+"'"),'Missing bottom sheet kind '+kind);
const css=read('visual-300.css'),html=read('index.html'),sw=read('sw.js');
assert(css.includes('dialog#gb-picker-sheet[data-snap="expanded"]'));
assert(css.includes('#modal.gb30-finance-modal'));
assert(css.includes('min-width:900px'));
assert(html.includes('visual-300.css?v=20261109-3000'));
assert(html.includes('app.js?v=20261109-3000'));
assert(html.includes('gbplus-version" content="3.0.0"'));
assert(sw.includes("gb-plus-shell-v3000"));
const version=JSON.parse(read('version.json'));
assert.equal(version.version,'3.0.0');
assert.equal(version.build,3000);
assert.equal(version.published_at,null);
assert(version.assets.includes('./js/finance-picker-300.js'));
assert(version.assets.includes('./visual-300.css'));
console.log('GB+ 3.0.0: seletores, formulários, contas, cartões, metas, assets e interface passaram em regressão isolada.');
