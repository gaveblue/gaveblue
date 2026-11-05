'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const file=p=>fs.readFileSync(path.join(root,p),'utf8');
const strip=s=>s.replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name)=>'<svg data-icon="'+name+'"></svg>';
const selectMarkup=new Function('esc','icon',strip(file('js/entry-select.js'))+';return entrySelect;')(esc,icon);
const field=(label,name,value='',type='text',attrs='')=>'<label class="field">'+label+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>';
const textarea=(label,name,value='')=>'<label class="field full">'+label+'<textarea name="'+name+'">'+esc(value)+'</textarea></label>';
const footer=label=>'<div class="form-error"></div><div class="form-footer"><button type="button">Cancelar</button><button type="submit">'+label+'</button></div>';
const render=new Function('today','money','dateLabel','pending','paid','accountBalance','esc','field','select','textarea','formFooter','button','icon','titleTable','empty','INDICATORS','entrySelect',
  strip(file('js/forms.js'))+';return titleForm;')(
 ()=> '2026-11-04', n=>String(n),()=>'',()=>0,()=>0,()=>0,esc,field,()=>'',textarea,footer,()=>'',icon,()=>'',()=>'',{},selectMarkup);
const db={categories:[{id:'c-exp',name:'Água',type:'expense'},{id:'c-inc',name:'Venda',type:'income'}],
 partners:[{id:'p1',name:'Cliente A',active:true}],accounts:[{id:'a1',name:'Banco',active:true}]};
test('new launch resembles reference and shows correct field hierarchy',()=>{
 const html=render(db,null,'expense');
 for(const s of ['Tipo','Categoria','Descrição','Parceiro','Documento','Emissão','Vencimento','Valor (R$)','Periodicidade','Observações','Revisar lançamento'])assert.ok(html.includes(s),s);
 for(const s of ['name="description"','name="partnerId"','name="document"','name="issue"','name="due"','name="amount"','name="notes"'])assert.ok(html.includes(s),s);
 assert.ok(html.includes('class="gb-entry-form"'));
 assert.ok(html.includes('name="accountId" value=""'));
 assert.ok(!html.includes('Conta prevista'));
});
test('all launch dropdowns are custom and use colored arrows',()=>{
 const html=render(db,null,'expense');
 for(const n of ['type','categoryId','partnerId','mode'])assert.ok(html.includes('data-entry-name="'+n+'"'),n);
 assert.ok(html.includes('data-action="entry-toggle"'));
 assert.ok(html.includes('data-action="entry-option"'));
 assert.ok(html.includes('gb-entry-direction expense'));
 assert.ok(html.includes('gb-entry-direction income'));
 assert.ok(!html.includes('<select name="type"'));
 const css=file('entry-form.css');
 assert.ok(css.includes('.gb-entry-source{display:none!important}'));
 assert.ok(css.includes('html[data-theme=dark]'));
});
test('only correct categories appear for selected type',()=>{
 const expenses=render(db,null,'expense');
 const incomes=render(db,null,'income');
 assert.ok(expenses.includes('value="c-exp"'));
 assert.ok(!expenses.includes('value="c-inc"'));
 assert.ok(incomes.includes('value="c-inc"'));
 assert.ok(!incomes.includes('value="c-exp"'));
});
test('editing keeps financial values, linked account and cancel state',()=>{
 const item={id:'t1',type:'income',description:'Venda A',categoryId:'c-inc',partnerId:'p1',document:'N123',
 issue:'2026-10-31',due:'2026-11-10',amount:129999,accountId:'a1',notes:'Teste',cancelled:false,mode:'single'};
 const html=render(db,item);
 assert.ok(html.includes('name="accountId" value="a1"'));
 assert.ok(html.includes('Venda A'));
 assert.ok(html.includes('name="cancelled"'));
 assert.ok(html.includes('Salvar alterações'));
 assert.ok(!html.includes('name="mode"'));
});
test('custom selected type keeps existing submit and category switch behavior',()=>{
 const app=file('js/app.js');
 assert.ok(app.includes("'entry-option':el=>chooseEntryOption(el)"));
 assert.ok(app.includes("syncEntrySelect(select);"));
 assert.ok(app.includes("source.dispatchEvent(new Event('change',{bubbles:true}))")===false);
 assert.ok(file('js/entry-select.js').includes("source.dispatchEvent(new Event('change',{bubbles:true}))"));
 assert.ok(app.includes("if(form.id==='title-form')"));
 assert.ok(app.includes("!db.categories.some(c=>c.id===v.categoryId&&c.type===v.type)"));
 assert.ok(app.includes("'back-generation':"));
});
test('custom modal retains accessible keyboard/dismiss behavior',()=>{
 const app=file('js/app.js'),entry=file('js/entry-select.js');
 assert.ok(entry.includes('aria-haspopup="listbox"'));
 assert.ok(entry.includes('aria-expanded="false"'));
 assert.ok(entry.includes('aria-selected='));
 assert.ok(app.includes("e.key!=='Escape'"));
 assert.ok(app.includes('toggleEntryMenu(trigger)'));
 assert.ok(entry.includes('closeEntryMenus();'));
});
