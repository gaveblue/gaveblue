// GB+ 2.7.5 — footer navigation is always outside the scrollable form.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const app=readFileSync(resolve(here,'../js/app.js'),'utf8');
const css=readFileSync(resolve(here,'../bottom-sheet.css'),'utf8');
const forms=readFileSync(resolve(here,'../js/forms.js'),'utf8');

assert(app.includes("'<div class=\"modal-body\">'+content+'</div>'+"),'The form must remain inside the scrollable area');
assert(app.includes('class="gb-entry-bottom-nav"'),'Navigation must be a sibling of the scrollable modal body');
assert(app.includes("if(isEntry)mountEntryBottomActions();"));
assert(!app.includes('mountEntryHeaderActions()'),'Navigation must no longer be moved to the header');
assert(css.includes('height:min(575px,88dvh)'),'Keep the previously approved compact sheet height');
assert(css.includes('.gb-entry-bottom-nav .gb-entry-wizard-footer[hidden]'),'Hide controls for inactive stages');
assert(css.includes('flex:1;min-height:0;overflow-y:auto'),'Only the form body should scroll');
for(let step=1;step<=3;step++)assert(forms.includes('data-entry-footer="'+step+'"'),'Missing footer for step '+step);
assert(app.includes('const footer=modal.querySelector('),'Stage selection must address the moved footer');
assert(app.includes("el.closest('#title-form')||modal.querySelector('#title-form')"),
 'Next/back handlers must find the form when buttons are outside it');

const start=app.indexOf('function mountEntryBottomActions(){');
const end=app.indexOf('\nfunction closeModal()',start);
assert(start>=0&&end>start,'Bottom-nav initializer missing');
const mountSource=app.slice(start,end);

function makeMock(isEdit=false){
 const button=(action)=>({
  action,textContent:action==='close'?'Cancelar':'',
  attributes:{},removed:false,
  setAttribute(name,value){this.attributes[name]=value;},
  remove(){this.removed=true;}
 });
 const footers=[
  {close:button('close'),next:button('title-next')},
  {back:button('title-back'),next:button('title-next')},
  {back:button('title-back'),submit:button('submit')}
 ].map((buttons,i)=>({
  hidden:i!==0,buttons,
  querySelector(selector){
   const key=selector==='[type="submit"]'?'submit':
    (selector.match(/data-action="([^"]+)"/)||[])[1];
   return Object.values(buttons).find(item=>item.action===key)||null;
  }
 }));
 const nav={children:[],appendChild(item){this.children.push(item);}};
 const form={id:'title-form',dataset:{id:isEdit?'existing-title':''},
  querySelectorAll(selector){
   assert.equal(selector,'[data-entry-footer]');
   return footers;
  }};
 const modal={querySelector(selector){
  return selector==='#title-form'?form:selector==='.gb-entry-bottom-nav'?nav:null;
 }};
 return {modal,form,nav,footers};
}
for(const isEdit of [false,true]){
 const mock=makeMock(isEdit);
 const mount=Function('modal',mountSource+';return mountEntryBottomActions;')(mock.modal);
 mount();
 assert.equal(mock.nav.children.length,3,'All three stages need footer buttons');
 assert(mock.footers[0].buttons.close.removed,'Header X replaces duplicate Cancelar button');
 assert.equal(mock.footers[0].buttons.next.textContent,'Próximo');
 assert.equal(mock.footers[1].buttons.back.textContent,'Voltar');
 assert.equal(mock.footers[2].buttons.back.textContent,'Voltar');
 assert.equal(mock.footers[2].buttons.submit.attributes.form,'title-form',
  'Review/Save remains associated with the original form after moving to footer');
 assert.equal(mock.footers[2].buttons.submit.textContent,isEdit?'Salvar':'Revisar');
 assert(mock.footers[1].hidden&&mock.footers[2].hidden,'Inactive buttons must remain hidden');
}
console.log('GB+ 2.7.5: sticky bottom navigation, three stages, form ownership and compact height OK.');
