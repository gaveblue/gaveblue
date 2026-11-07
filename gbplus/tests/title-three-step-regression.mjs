// GB+ 2.7.1 — three-step entry and atomic immediate settlement regression.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const src=name=>readFileSync(resolve(here,'../js/'+name+'.js'),'utf8');
const load=(name,deps,keys)=>Function(...Object.keys(deps),src(name)
 .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';return {'+keys.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[ch]);
const todayString='2026-11-06',money=n=>'R$ '+(n/100).toFixed(2);
const {isServiceExpenseCategory}=load('service-catalog',{},['isServiceExpenseCategory']);
const dummy={
 categories:[{id:'service',name:'Serviços',type:'expense'},
 {id:'water',name:'Água',type:'expense'},
 {id:'income',name:'Reembolsos',type:'income'}],
 accounts:[{id:'bank1',name:'Conta principal',active:true}],
 cards:[{id:'card1',active:true}],partners:[]
};
const form=load('forms',{
 esc,today:()=>todayString,money,paid:()=>0,pending:()=>0,
 field:(label,name,value='',type='text',attrs='')=>'<label class="field">'+label+
  '<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>',
 select:(label,name,options,value='')=>'<label>'+esc(label)+'<select name="'+name+'">'+options.map(o=>'<option value="'+esc(o[0])+'"'+(o[0]===value?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select></label>',
 entrySelect:(label,name,options)=>'<div class="entry-'+name+'">'+label+
  '<select name="'+name+'">'+options.map(o=>'<option>'+o[1]+'</option>').join('')+'</select></div>',
 servicePickerMarkup:()=>'<div class="service-picker">Qual serviço?</div>',
 serviceDisplayName:(id,name,description)=>id==='streaming-netflix'?'Netflix':description,
 categoryIconFor:()=> 'tag',isServiceExpenseCategory,
 icon:()=>'<svg></svg>',
 textarea:(label,name,value)=>'<label>'+esc(label)+'<textarea name="'+name+'">'+esc(value||'')+'</textarea></label>'
},['titleForm']);
const html=form.titleForm(dummy);
assert(html.includes('Etapa 1 de 3'),'Three-step form needs progress');
for(let i=1;i<=3;i++){
 const word=['','one','two','three'][i];
 assert(html.includes('id="gb-entry-step-'+word+'"'),'Missing stage '+i);
 assert(html.includes('data-entry-footer="'+i+'"'),'Missing footer '+i);
}
const first=html.split('id="gb-entry-step-one"')[1].split('id="gb-entry-step-two"')[0];
const second=html.split('id="gb-entry-step-two"')[1].split('id="gb-entry-step-three"')[0];
const third=html.split('id="gb-entry-step-three"')[1].split('type="hidden" name="accountId"')[0];
for(const name of ['entry-amount','gb-entry-category-block','name="description"'])assert(first.includes(name),'Stage 1 must include '+name);
for(const word of ['Emissão','Vencimento','gb-credit-entry-link','settlement'])assert(!first.includes(word),'Stage 1 should not include '+word);
for(const word of ['Periodicidade','Observações','Documento'])assert(second.includes(word),'Stage 2 missing '+word);
assert(!second.includes('Forma de movimentação')&&!second.includes('Cartão de débito')&&!second.includes('gb-credit-entry-link'),'Stage 2 must stay compact');
assert(!second.includes('Emissão')&&!second.includes('Vencimento'));
for(const word of ['Emissão','Vencimento','Deixar pendente','Baixar em uma conta','Lançar no cartão de crédito','Conta da baixa','Data da baixa','gb-entry-installments','title-schedule-detail','settleCardId'])assert(third.includes(word),'Stage 3 missing '+word);
assert(!html.includes('name="paymentMethod" value="debit"'),'Remove payment channel from step 2');
assert(!first.includes('required maxlength="300"'),'Description must be optional');
assert(html.includes('name="settleAccountId"')&&html.includes('value="bank1"'));
assert(html.includes('value="pending" checked'),'New titles should remain pending by default');
assert(html.includes('value="paid"'));
assert(html.includes('data-action="title-next"')&&html.includes('data-action="title-back"'));
const income=form.titleForm(dummy,null,'income');
assert(!income.split('id="gb-entry-step-one"')[1].split('id="gb-entry-step-two"')[0].includes('gb-credit-entry-link'),'Income first stage equal height');
assert(income.includes('Cartão relacionado ao reembolso'));
assert(income.includes('Vínculo apenas informativo'));
assert(income.includes('name="relatedCardId"'));
assert(src('app').includes('relatedCardId=v.type===\'income\''),'Card reference must be valid only for income');
const edit=form.titleForm(dummy,{id:'old',type:'expense',description:'Netflix',categoryId:'service',amount:2990,
 issue:todayString,due:todayString,document:'',notes:'',partnerId:'',accountId:'',
 mode:'single',count:1,sequence:1,cancelled:false,serviceId:'streaming-netflix'});
assert(edit.includes('use Detalhes do lançamento'));
assert(!edit.includes('name="settlement"'),'Editing cannot record another payment');

const app=src('app');
assert(app.includes("form.dataset.step!=='3'"),'Save must require stage three');
assert(app.includes('validateEntryStepThree(form)'));
assert(app.includes('syncEntrySettlement(form)'));
assert(app.includes('const generated=generateTitles(input'));
assert(app.includes('if(isPaid)generated.settlement='));
assert(app.includes('d.titles.push(...generated)'));
assert(app.includes('addPayment(d,{titleId:generated[0].id'),'Payment must be added in same draft as title');
assert(app.includes("generated.length!==1||generated[0].mode!=='single'"),'Series cannot be paid all at once');

let id=0;
const crypto={randomUUID:()=> 'generated'+(++id)};
const domain=load('domain',{
 crypto,parseMoneyCentavos:value=>Math.round(Number(value)*100),
 expectedDates:(date)=>[{index:1,date,nominal:date,shifted:false}],
 nextBusinessDay:date=>date,recurrenceAnchor:date=>date
},['today','validDate','generateTitles','addPayment','accountBalance']);
const realDay=domain.today();
const amount=2990,bankId='bank1',titleId='title1';
const draft={accounts:[{id:bankId,name:'Conta principal',initial:10000,active:true}],
 titles:[{id:titleId,type:'expense',amount,issue:realDay,due:realDay,
  cancelled:false,mode:'single',sequence:1,count:1,groupId:null,
  categoryId:'service',description:'Netflix',accountId:bankId,paymentMethod:'debit'}],
 payments:[],transfers:[]};
domain.addPayment(draft,{titleId,accountId:bankId,date:realDay,amount});
assert.equal(draft.payments.length,1);
assert.equal(domain.accountBalance(draft,bankId),7010,'Immediate debit should change bank exactly once');
assert.throws(()=>domain.addPayment(draft,{titleId,accountId:bankId,date:realDay,amount}),/Confira o valor pendente/);
const unsupported={...draft,accounts:[],payments:[]};
assert.throws(()=>domain.addPayment(unsupported,{titleId,accountId:bankId,date:realDay,amount}),/conta ativa/);
const sheetSrc=src('service-ui');
assert(sheetSrc.includes("'streaming-netflix','music-spotify','delivery-ifood'"));
const bottom=src('bottom-sheet');
assert(bottom.includes('serviceCategoryPreviewMarkup()'));
const entry=src('entry-select');
assert(entry.includes("serviceCategoryPreviewMarkup()"));
const css=readFileSync(resolve(here,'../gb-entry-wizard.css'),'utf8');
assert(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
assert(css.includes('.gb-service-category-preview-item:not(:first-child){margin-left:-9px}'));
console.log('GB+ 2.7.6: três etapas, cartão/conta/pendente, baixa atômica e mini-logos verificados.');
