// GB+ 2.7.7 — full-height selectors, Servicios first, financial options and swipe-to-half.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const source=readFileSync(resolve(here,'../js/bottom-sheet.js'),'utf8');
const css=readFileSync(resolve(here,'../bottom-sheet.css'),'utf8');
const form=readFileSync(resolve(here,'../js/forms.js'),'utf8');
const wizard=readFileSync(resolve(here,'../gb-entry-wizard.css'),'utf8');
const app=readFileSync(resolve(here,'../js/app.js'),'utf8');
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[ch]);
const handle={attributes:{},setAttribute(k,v){this.attributes[k]=v},focus(){},setPointerCapture(){}};
const closeButton={focus(){}};
const root={
 open:false,dataset:{},listeners:{},innerHTML:'',
 querySelector(s){return ['[data-sheet-grab]','.gb-sheet-grab'].includes(s)?handle:s==='[data-sheet-close]'?closeButton:null},
 addEventListener(event,fn){this.listeners[event]=fn},
 showModal(){this.open=true},
 close(){this.open=false;this.listeners.close?.()}
};
const document={
 activeElement:{isConnected:false},
 querySelector(s){assert.equal(s,'#gb-picker-sheet');return root}
};
const serviceCatalog=[{id:'streaming-netflix',name:'Netflix',group:'streaming'}];
const lib=Function('document','esc','icon','gbIcon','categoryIconFor','SERVICE_CATALOG',
 'SERVICE_GROUPS','serviceSearchKey','isServiceExpenseCategory',
 'serviceIconMarkup','serviceCategoryPreviewMarkup','setTimeout',
 source.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+
 ';return {openGbPickerSheet,installGbPickerSheet};')(
 document,esc,(name)=>'<svg data-icon="'+esc(name)+'"></svg>',()=>'<svg></svg>',
 ()=> 'drop',serviceCatalog,{streaming:'Streaming'},x=>x,
 category=>String(category?.name||'').toLowerCase().includes('servi'),
 ()=>'<span>Logo</span>',()=>'<span>Serviços</span>',()=>{});
const reset=()=>{
 if(root.open)root.close();
 root.dataset={};root.innerHTML='';root.open=false;
};
lib.installGbPickerSheet();
reset();
assert(lib.openGbPickerSheet({kind:'category',items:[
 {id:'agua',name:'Água'},{id:'aluguel',name:'Aluguel'},
 {id:'service',name:'Serviços'}],selected:'agua',onPick:()=>{}}));
assert.equal(root.dataset.snap,'expanded','Category should open fully expanded');
assert.equal(handle.attributes['aria-expanded'],'true');
assert(root.innerHTML.indexOf('data-sheet-choice="service"')<
 root.innerHTML.indexOf('data-sheet-choice="agua"'),'Serviços must appear before Água');
assert(root.innerHTML.includes('Arraste a barra para baixo'));
reset();
assert(lib.openGbPickerSheet({kind:'service',selected:'',onPick:()=>{}}));
assert.equal(root.dataset.snap,'expanded','Service panel should open fully expanded');
assert(root.innerHTML.includes('Netflix'));
reset();
let selected='';
assert(lib.openGbPickerSheet({kind:'account',items:[
 {id:'acct',name:'Conta principal',subtitle:'Saldo disponível · R$ 1.200,00',
  badgeMarkup:'<span>Banco</span>'}],selected:'',onPick:id=>{selected=id}}));
assert.equal(root.dataset.snap,'expanded','Account panel should open fully expanded');
assert(root.innerHTML.includes('Saldo disponível · R$ 1.200,00'));
assert(root.innerHTML.includes('<span>Banco</span>'));
const choice={dataset:{sheetChoice:'acct'},closest(s){return s==='[data-sheet-choice]'?this:null}};
root.listeners.click({target:choice});
assert.equal(selected,'acct','Choosing an account should deliver its id');
assert.equal(root.open,false,'Sheet should close after selection');
reset();
assert(lib.openGbPickerSheet({kind:'card',items:[
 {id:'c1',name:'Cartão & teste',subtitle:'Limite disponível · R$ 500,00',
  badgeMarkup:'<span>Cartão</span>'}],selected:'c1',onPick:()=>{}}));
assert.equal(root.dataset.snap,'expanded');
assert(root.innerHTML.includes('Limite disponível · R$ 500,00'));
assert(root.innerHTML.includes('Cartão &amp; teste'));
root.listeners.pointerdown({target:{closest:s=>s==='[data-sheet-grab]'?handle:null},
 button:0,pointerId:1,clientY:50});
root.listeners.pointerup({pointerId:1,clientY:135});
assert.equal(root.dataset.snap,'partial','Downward drag should collapse to half screen');
assert(css.includes('height:52dvh'),'Half-height snap should be about half the viewport');
assert(form.includes('data-finance-kind="account"')&&form.includes('data-finance-kind="card"'));
assert(app.includes("'title-finance-picker':el=>"));
assert(app.includes('accountBalance(db,row.id,today())'));
assert(app.includes('cardAvailable(db,row)'));
assert(app.includes("source.dispatchEvent(new Event('change',{bubbles:true}))"));
assert(app.includes('syncEntryFinanceChoice(form,\'account\')'));
assert(wizard.includes('.gb-entry-amount-control:focus-within'));
assert(wizard.includes('border-bottom:0!important;outline:0!important'));
const titleFormSection=form.split('export function titleForm(db,t,type=\'expense\'){')[1]
 .split('export function partnerForm(')[0];
assert(!titleFormSection.includes('<div class="form-error"'),
 'Persistent warning under the value/description must not be rendered');
console.log('GB+ 2.7.7: categoria/serviços no topo, altura, contas/cartões, saldos, gesto e valor limpo OK.');
