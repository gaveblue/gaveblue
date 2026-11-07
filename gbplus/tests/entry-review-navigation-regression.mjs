// GB+ 2.7.8 — go from step 3 to review and back without losing fixed footers.
// Run: node gbplus/tests/entry-review-navigation-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const app=readFileSync(resolve(here,'../js/app.js'),'utf8');
const forms=readFileSync(resolve(here,'../js/forms.js'),'utf8');
const css=readFileSync(resolve(here,'../bottom-sheet.css'),'utf8');
const source=(start,end)=>{
 const a=app.indexOf(start),b=app.indexOf(end,a);
 assert(a>=0&&b>a,'Cannot find function '+start);
 return app.slice(a,b);
};
const serializeSource=source('function serializeEntryFormForReview(form){','function closeModal(){');
const mountSource=source('function mountEntryBottomActions(){','/** Serialize the form together');
const stepSource=source('function toggleEntryStep(form,step){','function refreshEntrySchedule(form){');

function fakeFooter(number,hidden=number!==3){
 const next={action:'title-next',textContent:'',setAttribute(){}};
 const back={action:'title-back',textContent:'',setAttribute(){}};
 const submit={action:'submit',textContent:'',setAttribute(name,value){this[name]=value}};
 const close={action:'close',textContent:'',remove(){this.removed=true}};
 return {
  number,hidden,next,back,submit,close,
  cloneNode(){return fakeFooter(number,this.hidden)},
  querySelector(s){
   if(s==='[type="submit"]')return number===3?this.submit:null;
   const name=(s.match(/data-action="([^"]+)"/)||[])[1];
   if(name==='title-next')return number<3?this.next:null;
   if(name==='title-back')return number>1?this.back:null;
   if(name==='close')return number===1?this.close:null;
   return null;
  }
 };
}
const originals=[
 {tagName:'INPUT',type:'text',value:'145.50',checked:false},
 {tagName:'INPUT',type:'radio',value:'pending',checked:false},
 {tagName:'INPUT',type:'radio',value:'paid',checked:true},
 {tagName:'INPUT',type:'checkbox',value:'true',checked:true},
 {tagName:'SELECT',type:'select-one',value:'acc-42'},
 {tagName:'TEXTAREA',type:'textarea',value:'Observação mantida'}
];
const copies=originals.map(field=>({
 ...field,value:'',checked:false,textContent:'',
 options:field.tagName==='SELECT'?[{value:''},{value:'acc-42'},{value:'acc-other'}]:[],
 attributes:{},
 setAttribute(name,value){this.attributes[name]=value},
 toggleAttribute(name,value){this.attributes[name]=Boolean(value)}
}));
const liveFooters=[fakeFooter(1,true),fakeFooter(2,true),fakeFooter(3,false)];
const clone={
 id:'title-form',dataset:{step:'3'},footers:[],fields:copies,
 querySelectorAll(s){
  if(s==='input,select,textarea')return this.fields;
  if(s==='[data-entry-footer]')return this.footers;
  throw Error('Unexpected clone selector: '+s);
 },
 appendChild(child){this.footers.push(child)},
 get outerHTML(){
  return '<form id="title-form" data-step="3" data-footers="'+this.footers.length+
   '" data-amount="'+this.fields[0].attributes.value+
   '" data-account="'+this.fields[4].options.find(x=>x.attributes?.selected)?.value+
   '">'+this.footers.map(x=>'<div data-entry-footer="'+x.number+'"'+(x.hidden?' hidden':'')+'></div>').join('')+'</form>';
 }
};
for(const option of copies[4].options){
 option.attributes={};
 option.toggleAttribute=function(key,val){this.attributes[key]=val};
}
const entryForm={
 id:'title-form',
 querySelectorAll(s){
  if(s==='input,select,textarea')return originals;
  throw Error('Unexpected live form selector: '+s);
 },
 cloneNode(flag){assert.equal(flag,true);return clone}
};
const nav={
 footers:liveFooters,
 querySelectorAll(s){assert.equal(s,'[data-entry-footer]');return this.footers},
 appendChild(footer){this.footers.push(footer)}
};
const modal={dataset:{},querySelector(s){
 if(s==='.gb-entry-bottom-nav')return nav;
 if(s==='#title-form')return entryForm;
 if(s.startsWith('[data-entry-footer='))return nav.footers.find(x=>String(x.number)===s.match(/\d+/)?.[0])||null;
 if(s==='.modal-body')return {scrollTo(){}};
 return null;
}};
const serialize=Function('modal',serializeSource+';return serializeEntryFormForReview;')(modal);
const stored=serialize(entryForm);
assert(stored.includes('data-footers="3"'),'Review snapshot must contain all detached footers');
for(const index of [1,2,3])assert(stored.includes('data-entry-footer="'+index+'"'));
assert(stored.includes('data-amount="145.50"'));
assert(stored.includes('data-account="acc-42"'));
assert.equal(copies[1].attributes.checked,false,'Unchecked radio must remain unchecked');
assert.equal(copies[2].attributes.checked,true,'Chosen settlement must survive review');
assert.equal(copies[3].attributes.checked,true,'Business-days flag must survive review');
assert.equal(copies[5].textContent,'Observação mantida');

// Simulate the rehydrated form and its new modal after returning from preview.
const restoredFooters=clone.footers;
const restoredNav={footers:[],appendChild(footer){this.footers.push(footer)}};
const stage={1:{},2:{},3:{}};
const progress={children:[1,2,3].map(()=>({classList:{toggle(name,value){this.active=value}}})),
 setAttribute(name,value){this[name]=value}};
const form={
 id:'title-form',dataset:{step:'3',id:''},
 elements:{amount:{value:'145.50',focus(){}},document:{focus(){}},issue:{focus(){}}},
 querySelectorAll(s){
  assert.equal(s,'[data-entry-footer]');
  return restoredFooters;
 },
 querySelector(s){
  if(s==='.gb-entry-progress')return progress;
  if(s==='.form-error')return {textContent:''};
  if(s==='.gb-entry-amount-recap strong')return {textContent:''};
  if(s.includes('#gb-entry-step-two .gb-entry-trigger'))return null;
  if(s.includes('#gb-entry-step-')){
   const id=s.includes('-one')?1:s.includes('-two')?2:3;
   return stage[id];
  }
  return null;
 }
};
const backModal={dataset:{},querySelector(s){
 if(s==='#title-form')return form;
 if(s==='.gb-entry-bottom-nav')return restoredNav;
 if(s.startsWith('[data-entry-footer='))return restoredNav.footers.find(x=>Number(s.match(/\d+/)[0])===x.number)||null;
 if(s==='.modal-body')return {scrollTo(){}};
 return null;
}};
const mount=Function('modal',mountSource+';return mountEntryBottomActions;')(backModal);
mount();
assert.equal(restoredNav.footers.length,3,'Restored modal must mount three footer toolbars');
assert.equal(restoredNav.footers[2].submit.form,'title-form');
const noOp=()=>{};
const toggle=Function('modal','money','cents','validateEntryStepOne','validateEntryStepTwo',
 'syncEntrySettlement','refreshEntrySchedule','requestAnimationFrame',stepSource+
 ';return toggleEntryStep;')(backModal,x=>String(x),x=>Number(x),noOp,noOp,noOp,noOp,cb=>cb());
for(const number of [3,2,1,2,3,2,3]){
 toggle(form,number);
 assert.equal(form.dataset.step,String(number));
 for(const footer of restoredNav.footers)
  assert.equal(footer.hidden,footer.number!==number,
   'Only footer '+number+' should show after step navigation');
 for(const key of [1,2,3])
  assert.equal(stage[key].hidden,key!==number);
}
assert(css.includes('.gb-entry-bottom-nav .gb-entry-wizard-footer[hidden]'));
assert(app.includes("pendingGeneration={cardPurchase:draft,formHTML:serializeEntryFormForReview(form)}"));
assert(app.includes("generated.formHTML=serializeEntryFormForReview(form)"));
assert(app.includes('if(form)toggleEntryStep(form,Number(form.dataset.step)||3)'));
assert(forms.includes('data-entry-footer="1"')&&forms.includes('data-entry-footer="2"')&&forms.includes('data-entry-footer="3"'));
console.log('GB+ 2.7.8: prévia, retorno, radios, valores e navegação 3→2→1→2→3 verificados.');
