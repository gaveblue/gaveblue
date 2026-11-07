// GB+ 2.7.0 — data-safe category/service sheets, gestures and theme assets.
// Run: node gbplus/tests/bottom-sheet-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const source=name=>readFileSync(resolve(root,'../js/'+name+'.js'),'utf8');
const load=(name,deps,keys)=>Function(...Object.keys(deps),source(name)
 .replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';return {'+keys.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
const catalog=load('service-catalog',{},['SERVICE_CATALOG','SERVICE_GROUPS','serviceSearchKey']);
const calls={};
const handle={attributes:{},focus(){},setAttribute(k,v){this.attributes[k]=v;},setPointerCapture(){}};
const focus={isConnected:true,attributes:{},setAttribute(k,v){this.attributes[k]=v;},focus(){calls.focus=(calls.focus||0)+1;}};
const listeners={};
const fakeDialog={
 innerHTML:'',dataset:{},open:false,
 showModal(){this.open=true;},
 close(){this.open=false;listeners.close?.();},
 querySelector(selector){return ['[data-sheet-grab]','.gb-sheet-grab'].includes(selector)?handle:null;},
 addEventListener(type,fn){listeners[type]=fn;},
 querySelectorAll(){return [];}
};
const document={querySelector:selector=>selector==='#gb-picker-sheet'?fakeDialog:null,
 activeElement:focus};
const sheet=load('bottom-sheet',{
 document,esc,icon:()=>'<svg></svg>',gbIcon:()=>'<svg class="gb-symbol"></svg>',
 categoryIconFor:()=> 'tag',
 SERVICE_CATALOG:catalog.SERVICE_CATALOG,
 SERVICE_GROUPS:catalog.SERVICE_GROUPS,
 serviceSearchKey:catalog.serviceSearchKey,
 isServiceExpenseCategory:item=>item?.type==='expense'&&/serviç/i.test(item?.name||''),
 serviceCategoryPreviewMarkup:()=>'<span class="gb-service-category-preview">Netflix Spotify iFood</span>',
 serviceIconMarkup:()=>'<span class="gb-service-logo">Marca</span>'
},['openGbPickerSheet','filterGbPickerSheet','sheetGroupsCount','installGbPickerSheet','installEntryFormDrag']);
assert.equal(catalog.SERVICE_CATALOG.length,26);
assert.equal(Object.keys(catalog.SERVICE_GROUPS).length,5);
assert.equal(sheet.sheetGroupsCount([{items:[1,2]},{items:[3]}]),3);
sheet.installGbPickerSheet();
assert.equal(fakeDialog.dataset.gbReady,'true');
let picked;
assert(sheet.openGbPickerSheet({kind:'service',selected:'streaming-netflix',onPick:value=>picked=value}));
assert(fakeDialog.open);
assert.equal((fakeDialog.innerHTML.match(/data-sheet-choice="(?:streaming|music|delivery|mobility|digital)-/g)||[]).length,26);
for(const service of ['Netflix','HBO Max','Spotify','iFood','Plus Delivery','ChatGPT']){
 assert(fakeDialog.innerHTML.includes(service),'Missing service '+service);
}
assert(fakeDialog.innerHTML.includes('data-sheet-choice=""'),'Allow leaving the service unselected');
assert(fakeDialog.innerHTML.includes('data-sheet-choice="custom"'),'Allow custom services');
assert(fakeDialog.innerHTML.includes('role="listbox"'));
assert.equal(fakeDialog.dataset.snap,'partial');
assert.equal(handle.attributes['aria-expanded'],'false');
const fakeItem={dataset:{sheetChoice:'music-spotify'}};
listeners.click({target:{closest:selector=>selector==='[data-sheet-choice]'?fakeItem:null}});
assert.equal(picked,'music-spotify');
assert(!fakeDialog.open,'Selection closes only the picker');
assert.equal(focus.attributes['aria-expanded'],'false','Focus origin must be reset');
assert(calls.focus>=1);

const categories=[{id:'agua',name:'Água',type:'expense'},
 {id:'servicos',name:'Serviços',type:'expense'},
 {id:'injection',name:'<img src=x onerror=alert(1)>',type:'expense'}];
assert(sheet.openGbPickerSheet({kind:'category',items:categories,selected:'servicos',onPick:value=>picked=value}));
assert(fakeDialog.innerHTML.includes('data-sheet-choice="agua"'));
assert(fakeDialog.innerHTML.includes('data-sheet-choice="servicos"'));
assert(fakeDialog.innerHTML.includes('gb-service-category-preview'),'Service category must show overlapping service examples');
assert(!fakeDialog.innerHTML.includes('<img src=x'),'Untrusted category names must be escaped');
assert(fakeDialog.innerHTML.includes('&lt;img'));
assert(fakeDialog.innerHTML.includes('aria-selected="true"'));
const listItems=[
 {dataset:{sheetSearch:'agua'},hidden:false},
 {dataset:{sheetSearch:'servicos'},hidden:false},
 {dataset:{sheetSearch:'assinaturas'},hidden:false}
];
const group={hidden:false,querySelectorAll:()=>listItems};
const status={textContent:''},empty={hidden:true};
const filterRoot={
 querySelectorAll:()=>[group],
 querySelector:selector=>selector==='.gb-sheet-empty'?empty:selector==='.gb-sheet-count'?status:null
};
assert.equal(sheet.filterGbPickerSheet(filterRoot,'SERVIÇOS'),1);
assert(listItems[0].hidden&&listItems[2].hidden&&!listItems[1].hidden);
assert.equal(sheet.filterGbPickerSheet(filterRoot,'não tem'),0);
assert(!empty.hidden&&group.hidden);
assert.equal(sheet.filterGbPickerSheet(filterRoot,''),3);
assert(empty.hidden&&!group.hidden);
fakeDialog.close();

// Form gesture controller modifies only layout state, not form data.
const formHandlers={};
const formHandle={attrs:{},setAttribute(k,v){this.attrs[k]=v;},setPointerCapture(){}};
const formModal={
 dataset:{gbSnap:'partial'},classList:{contains:()=>true},
 addEventListener(type,fn){formHandlers[type]=fn;},
 querySelector:selector=>selector==='[data-entry-sheet-grab]'?formHandle:null
};
sheet.installEntryFormDrag(formModal);
const event=(type,y)=>({pointerId:7,clientY:y,button:0,
 target:{closest:selector=>selector==='[data-entry-sheet-grab]'?formHandle:null}});
formHandlers.pointerdown(event('start',400));
formHandlers.pointerup(event('end',280));
assert.equal(formModal.dataset.gbSnap,'expanded');
formHandlers.pointerdown(event('start',250));
formHandlers.pointerup(event('end',345));
assert.equal(formModal.dataset.gbSnap,'partial');
formHandlers.pointerdown(event('start',250));
formHandlers.pointerup(event('end',360));
assert.equal(formModal.dataset.gbSnap,'compact');
const css=readFileSync(resolve(root,'../bottom-sheet.css'),'utf8');
assert(css.includes('touch-action:none'),'Grab handles must not scroll lists');
assert(css.includes('overscroll-behavior:contain'),'List scrolling should not dismiss sheet');
assert(css.includes('data-snap="expanded"'),'Picker expansion must be supported');
assert(css.includes('data-gb-snap="expanded"'),'Form expansion must be supported');
assert(css.includes('background:#fff!important'),'Bank logos must be legible in dark mode');
assert(css.includes('--gb-service-fg'),'Service logo must contrast against brand color');
const app=source('app');
assert(app.includes("kind:'category'")&&app.includes("kind:'service'"));
assert(app.includes("source.dispatchEvent(new Event('change',{bubbles:true}))"),
 'Choosing category must retain original category/form event rules');
const html=readFileSync(resolve(root,'../index.html'),'utf8');
assert(html.includes('id="gb-picker-sheet"')&&html.includes('bottom-sheet.css'));
console.log('GB+ 2.7.0: 26 serviços, categorias, busca, gesto, foco, proteção do formulário e ícones OK.');
