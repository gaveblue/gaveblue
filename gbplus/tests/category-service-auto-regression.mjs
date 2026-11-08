// GB+ 2.7.2 — explicit category selection opens service sheet immediately.
// Run: node gbplus/tests/category-service-auto-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const source=name=>readFileSync(resolve(here,'../js/'+name+'.js'),'utf8');
const app=source('app'), serviceUI=source('service-ui'), sheet=source('bottom-sheet');
const forms=source('forms'), css=readFileSync(resolve(here,'../bottom-sheet.css'),'utf8');
const load=(name,deps,keys)=>Function(...Object.keys(deps),source(name)
 .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';return {'+keys.join(',')+'};')(...Object.values(deps));
const {isServiceExpenseCategory}=load('service-catalog',{},['isServiceExpenseCategory']);
const {isSelectableExpenseCategory}=load('category-library',{},['isSelectableExpenseCategory']);
const db={categories:[
 {id:'water',name:'Água',type:'expense'},
 {id:'service',name:'Serviços',type:'expense'},
 {id:'custom',name:'Assinaturas digitais',type:'expense'},
 {id:'income',name:'Prestação de serviços',type:'income'}
]};
const launched=[],calls={sync:0,focus:0,pick:0};
const sheetOpen=opts=>{launched.push(opts);return true;};
const modal={open:true};
const trigger={attrs:{},focus(){calls.focus++},setAttribute(k,v){this.attrs[k]=v;}};
const area={hidden:true};
const select={
 value:'water',options:[{value:'water'},{value:'service'},{value:'custom'}],
 dispatchEvent(e){
  assert.equal(e.type,'change');
  form.elements.categoryId.value=this.value;
  area.hidden=!isServiceExpenseCategory(db.categories.find(c=>c.id===this.value));
 }
};
const form={
 id:'title-form',isConnected:true,
 elements:{type:{value:'expense'},categoryId:{value:'water'},serviceId:{value:''}},
 querySelector(selector){
  return {'#entry-category':select,'.gb-service-area':area,
   '[data-action="title-service-toggle"]':trigger}[selector]||null;
 }
};
const helper=app.match(/function openEntryServiceSheet\(form\)\{([\s\S]*?)\n\}\nfunction filterServicesInForm/);
assert(helper,'Shared service panel helper must be present');
const openEntryServiceSheet=Function('modal','openGbPickerSheet','updateServicePicker',
 'return function openEntryServiceSheet(form){'+helper[1]+'\n}')(modal,sheetOpen,()=>{calls.pick++});
const action=app.match(/  'entry-toggle':el=>\{([\s\S]*?)\n  \},\n  'entry-option':/);
assert(action,'Category entry-toggle action missing');
const entryToggle=Function('db','closeEntryMenus','openGbPickerSheet','syncEntrySelect',
 'Event','isServiceExpenseCategory','isSelectableExpenseCategory','openEntryServiceSheet','toggleEntryMenu',
 'return function(el){'+action[1]+'\n}')(db,()=>{},sheetOpen,()=>{calls.sync++},
 class Event{constructor(type){this.type=type}},isServiceExpenseCategory,isSelectableExpenseCategory,
 openEntryServiceSheet,()=>{throw Error('Unexpected fallback')});
const button={closest:selector=>selector==='.gb-entry-select'?{dataset:{entryName:'categoryId'}}:
 selector==='#title-form'?form:null,setAttribute(){}};
entryToggle(button);
assert.equal(launched.length,1);
assert.equal(launched[0].kind,'category');
launched[0].onPick('water'); // ordinary category => never open service picker
assert.equal(launched.length,1);
entryToggle(button);
launched[1].onPick('service');
assert.equal(launched.length,3,'Choosing Serviços opens the next panel directly');
assert.equal(launched[2].kind,'service');
assert.equal(launched[2].selected,'');
assert(calls.focus>0,'New sheet has an accessible focus origin');
assert.equal(trigger.attrs['aria-expanded'],'true');
launched[2].onPick('streaming-netflix');
assert.equal(calls.pick,1);
form.elements.serviceId.value='streaming-netflix';
entryToggle(button);
launched[3].onPick('service'); // choosing same category should allow change
assert.equal(launched[4].kind,'service');
assert.equal(launched[4].selected,'streaming-netflix');
entryToggle(button); // cancel must NOT force an extra service picker
assert.equal(launched.length,6);
form.elements.type.value='income';
assert.equal(openEntryServiceSheet(form),false,'Service sheet must not open for income');
assert.equal(launched.length,6);
assert(!isServiceExpenseCategory(db.categories.find(c=>c.id==='income')));
form.isConnected=false;
form.elements.type.value='expense';
assert.equal(openEntryServiceSheet(form),false,'Detached form must never open service picker');

assert(!serviceUI.includes('<strong>Qual serviço?</strong>'),
 'Large second question field must be eliminated');
assert(serviceUI.includes('gb-service-field-compact')&&serviceUI.includes('gb-service-compact'));
assert(serviceUI.includes('Selecionar aplicativo'));
assert(serviceUI.includes('name="serviceId"')||serviceUI.includes('name=\\\"serviceId\\\"'));
assert(forms.includes('data-has-service='));
assert(forms.includes('gb-entry-description-field'));
assert(app.includes("form.dataset.hasService=String(Boolean(id))"));
assert(css.includes('[data-has-service="true"] #gb-entry-step-one .gb-entry-description-field'),
 'The redundant description must be visually hidden when service identifies the title');
assert(css.includes('height:min(535px,84dvh)'));
assert(css.includes('min-height:38px;max-height:46px'));
assert(sheet.includes('selectionAfterClose')&&sheet.includes('if(selection)selection.callback(selection.value)'),
 'The next modal should open only after the previous native dialog closes');
const selected=load('service-ui',{
 serviceById:id=>id==='streaming-netflix'?{id,name:'Netflix'}:null,
 SERVICE_BRAND_PATHS:{},SERVICE_EXTRA_BRAND_PATHS:{},SERVICE_BRAND_COLORS:{},
 esc:s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
},['servicePickerMarkup']);
const html=selected.servicePickerMarkup({serviceId:'streaming-netflix'});
assert(html.includes('Netflix')&&html.includes('is-chosen'));
assert(!html.includes('gb-service-heading'));
console.log('GB+ 2.7.2: categoria abre serviços, seletor compacto e primeira etapa reduzida OK.');
