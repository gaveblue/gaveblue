// GB+ 2.6.3 — PF entry: centered amount, hidden partner, nested service category.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const source=name=>readFileSync(resolve(here,'../js/'+name+'.js'),'utf8');
const load=(name,deps,exports)=>Function(...Object.keys(deps),source(name)
 .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';return {'+exports.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
const {isServiceExpenseCategory}=load('service-catalog',{},['isServiceExpenseCategory']);
assert(isServiceExpenseCategory({type:'expense',name:'Serviços'}));
assert(isServiceExpenseCategory({type:'expense',name:'Assinaturas digitais'}));
assert(isServiceExpenseCategory({type:'expense',name:'Streaming'}));
assert(isServiceExpenseCategory({type:'expense',name:'Aplicativos'}));
assert(!isServiceExpenseCategory({type:'income',name:'Prestação de serviços'}));
assert(!isServiceExpenseCategory({type:'expense',name:'Água'}));
assert(!isServiceExpenseCategory({type:'expense',name:'Internet'}));
const titleUI=load('forms',{
 esc,field:(label,name,value='',type='text',attrs='')=>'<label>'+label+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>',
 entrySelect:(label,name,options,value,id)=>'<div class="entry-'+name+'">'+label+'<select id="'+id+'" name="'+name+'">'+options.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join('')+'</select></div>',
 today:()=> '2026-11-06',money:n=>'R$ '+(n/100).toFixed(2),
 icon:()=>'<svg aria-hidden="true"></svg>',servicePickerMarkup:()=>'<section class="gb-service-field">Serviço ou aplicativo</section>',
 serviceDisplayName:(id,name,fallback)=>id==='streaming-netflix'?'Netflix':id==='custom'?name:fallback,
 textarea:(label,name,value)=>'<label>'+label+'<textarea name="'+name+'">'+esc(value||'')+'</textarea></label>',
 categoryIconFor:()=> 'calendar',isServiceExpenseCategory,
},['titleForm']);
const db={
 categories:[{id:'c1',name:'Serviços',type:'expense'},{id:'c3',name:'Água',type:'expense'},{id:'c2',name:'Vendas',type:'income'}],
 partners:[{id:'old',name:'Parceiro legado',active:true}],cards:[]
};
const html=titleUI.titleForm(db);
for(const phrase of ['gb-entry-flow-switch','entry-type-pick','id="entry-type"',
 'id="entry-amount"','name="amount"','gb-entry-category-block',
 'type="hidden" name="partnerId"','name="description"','gb-service-field']){
 assert(html.includes(phrase),'Missing '+phrase);
}
assert(html.indexOf('id="entry-type"')<html.indexOf('id="entry-amount"'));
assert(html.indexOf('id="entry-amount"')<html.indexOf('Categoria'));
assert(html.indexOf('id="entry-amount"')<html.indexOf('id="gb-entry-step-two"'));
assert(!html.includes('id="entry-partner"'),'Partner chooser must be hidden for PF');
assert(!html.includes('gb-entry-partner-disabled'),'No disabled partner placeholder in PF');
assert(!html.includes('Parceiro <small>'),'PF partner label must be completely hidden');
assert(html.indexOf('entry-categoryId')<html.indexOf('gb-service-area'),'Service selection must be nested after category');
assert(html.indexOf('gb-service-area')<html.indexOf('name="description"'),'Service selection must precede description');
assert(html.includes('gb-service-area" >'),'Service picker visible when category is Serviços');
assert(html.includes('data-entry-footer="2" hidden'),'Keep review/periodicity step');
const income=titleUI.titleForm(db,null,'income');
assert(income.includes('value="income" selected'),'Income must be initially selected');
assert(income.includes('gb-service-area" hidden'),'Service picker hidden for income');
const water=titleUI.titleForm(db,{type:'expense',categoryId:'c3',description:'Conta de água',partnerId:'',serviceId:'',amount:2500,
 issue:'2026-11-06',due:'2026-11-06',mode:'single',sequence:1,count:1,cancelled:false});
assert(water.includes('gb-service-area" hidden'),'Service picker hidden for category Água');
const edited=titleUI.titleForm(db,{
 id:'t1',type:'expense',description:'Texto anterior',categoryId:'c1',partnerId:'old',
 serviceId:'streaming-netflix',serviceName:'',amount:3990,issue:'2026-11-06',due:'2026-11-06',
 mode:'single',sequence:1,count:1,cancelled:false,accountId:'',document:'',notes:''
});
assert(edited.includes('value="Netflix"'),'Service must replace old title with canonical name');
assert(edited.includes('name="description" type="text" value="Netflix"')&&edited.includes('readonly'),
 'Canonical service description must be readonly');
assert(edited.includes('name="partnerId" value="old"'),'Legacy partner linkage must not be erased');
const app=source('app');
assert(app.includes("'entry-type-pick':el=>"),'Selector must dispatch type change');
assert(app.includes("select.dispatchEvent(new Event('change',{bubbles:true}))"),'Existing category change rules must remain');
assert(app.includes("if(cents(form.elements.amount?.value||'0')<1)"),'Amount must be validated before step two');
assert(app.includes("const description=serviceId?serviceDisplayName(serviceId,serviceName"),'Saved title must use service name');
assert(app.includes("description.readOnly=true"),'Description of selected service must be locked');
assert(app.includes("e.target.name==='serviceName'"),'Custom service name should update description');
const launches=source('launches-view');
assert(launches.includes('serviceIconMarkup(t.serviceId)'),'The launch list shows a service logo');
assert(launches.includes('serviceDisplayName(t.serviceId,t.serviceName,t.description)'),
 'The launch list shows a single canonical name');
const css=readFileSync(resolve(here,'../gb-entry-wizard.css'),'utf8');
assert(css.includes('.gb-entry-amount-hero')&&css.includes('.gb-entry-flow-switch'));
assert(css.includes('.gb-service-branded')&&css.includes('.gb-entry-category-block'));
assert(css.includes('.gb-entry-amount-control input{')&&css.includes('text-align:center!important'),'Amount must be truly centered');
assert(css.includes('.gb-entry-wizard .gb-entry-amount-hero{border:0!important'),'Remove amount divider line');
const routine=app.match(/function syncEntryServiceCategory\(form\)\{([\s\S]*?)\n\}\nfunction filterServicesInForm/);
assert(routine,'Category sync function missing');
const createSync=new Function('db','isServiceExpenseCategory','updateServicePicker',
 'function syncEntryServiceCategory(form){'+routine[1]+'}\nreturn syncEntryServiceCategory;');
let resetCount=0;
const sync=createSync(db,isServiceExpenseCategory,()=>{resetCount++});
const area={hidden:true};
const categoryForm={id:'title-form',elements:{type:{value:'expense'},categoryId:{value:'c1'},serviceId:{value:''}},
 querySelector:selector=>selector==='.gb-service-area'?area:null};
sync(categoryForm);assert.equal(area.hidden,false,'Service category reveals service choice');
categoryForm.elements.categoryId.value='c3';categoryForm.elements.serviceId.value='streaming-netflix';
sync(categoryForm);assert.equal(area.hidden,true,'Other categories hide service choice');
assert.equal(resetCount,1,'Old service is cleared on explicit category change');
categoryForm.elements.type.value='income';categoryForm.elements.categoryId.value='c1';sync(categoryForm);
assert.equal(area.hidden,true,'Income cannot show expense-service options');
console.log('GB+ 2.6.3: valor centralizado, Parceiro oculto e serviço por categoria verificados.');
