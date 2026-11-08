// GB+ 2.6.0 — catalog visibility, persistence, XSS fallbacks and no financial side-effects.
// Run: node gbplus/tests/services-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const src=name=>readFileSync(resolve(here,'../js/'+name+'.js'),'utf8');
const load=(name,deps,exports)=>Function(...Object.keys(deps),
 src(name).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+
 ';return {'+exports.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const logos=load('service-brand-paths',{},['SERVICE_BRAND_PATHS']).SERVICE_BRAND_PATHS;
const accents=load('service-brand-colors',{},['SERVICE_BRAND_COLORS']).SERVICE_BRAND_COLORS;
const extra=load('service-extra-brand-paths',{},['SERVICE_EXTRA_BRAND_PATHS']).SERVICE_EXTRA_BRAND_PATHS;
const catalog=load('service-catalog',{},['SERVICE_CATALOG','SERVICE_GROUPS','serviceById','searchServices','serviceSearchKey']);
assert.equal(catalog.SERVICE_CATALOG.length,49);
assert.equal(new Set(catalog.SERVICE_CATALOG.map(s=>s.id)).size,49);
assert.equal(Object.keys(catalog.SERVICE_GROUPS).length,8);
assert.equal(Object.keys(logos).length,13);
assert.equal(Object.keys(extra).length,26);
assert.equal(catalog.searchServices('netflix').length,1);
assert.equal(catalog.searchServices('ifood').length,1);
assert.equal(catalog.searchServices('','delivery').length,5);
assert(catalog.SERVICE_CATALOG.some(s=>s.name==='Plus Delivery'));
assert(catalog.SERVICE_CATALOG.some(s=>s.name==='ChatGPT'));
assert.equal(catalog.serviceSearchKey('Música + Vídeo'),'musicavideo');
for(const [id,mark]of Object.entries(extra)){
 assert(catalog.serviceById(id),'Extra icon has an unknown service '+id);
 assert(Array.isArray(mark)&&mark.length===3&&mark[0]>0&&mark[1]>0&&
  typeof mark[2]==='string'&&mark[2].length>20,'Malformed local vector mark for '+id);
}
assert.equal(catalog.SERVICE_CATALOG.filter(s=>Boolean(logos[s.id]||extra[s.id])).length,39);
for(const [id,paths]of Object.entries(logos)){
 assert(catalog.serviceById(id),'Icon references unknown service '+id);
 assert(paths.length>0&&paths.every(p=>typeof p==='string'&&p.length>5),'Missing logo path');
}
const serviceUI=load('service-ui',{
 SERVICE_CATALOG:catalog.SERVICE_CATALOG,SERVICE_GROUPS:catalog.SERVICE_GROUPS,
 serviceById:catalog.serviceById,serviceSearchKey:catalog.serviceSearchKey,
 SERVICE_BRAND_PATHS:logos,SERVICE_EXTRA_BRAND_PATHS:extra,SERVICE_BRAND_COLORS:accents,esc
},['servicePickerMarkup','serviceIconMarkup','serviceIdentityMarkup','serviceDisplayName']);
const page=serviceUI.servicePickerMarkup();
for(const word of ['name="serviceId"','name="serviceName"','gb-service-field-compact',
 'gb-service-compact','aria-haspopup="dialog"','aria-controls="gb-picker-sheet"','data-action="title-service-toggle"']){
 assert(page.includes(word),'Missing '+word);
}
assert(!page.includes('gb-service-options'),'Service options belong to the full-height sheet');
assert(!page.includes('Qual serviço?'),'The large service-question field must be removed');
assert(!page.includes('gb-service-heading'),'No large heading is displayed in the first step');
assert(src('bottom-sheet').includes('SERVICE_CATALOG.filter'),'The full catalog must be in the sheet');
const chosen=serviceUI.servicePickerMarkup({serviceId:'streaming-netflix'});
assert(chosen.includes('value="streaming-netflix"'));
const other=serviceUI.servicePickerMarkup({serviceId:'custom',serviceName:'Local <img onerror=alert(1)>'});
assert(!other.includes('<img onerror'));
assert(other.includes('&lt;img'));
assert(serviceUI.serviceIdentityMarkup('streaming-netflix').includes('<svg'));
assert(serviceUI.serviceIconMarkup('streaming-netflix').includes('#E50914'));
assert(serviceUI.serviceIconMarkup('streaming-youtube').includes('viewBox="0 0 576 512"'));
assert(serviceUI.serviceIconMarkup('social-whatsapp').includes('<svg'));
assert(serviceUI.serviceIconMarkup('digital-microsoft365').includes('<svg'));
assert(serviceUI.serviceIconMarkup('digital-googleone').includes('<svg'));
assert(serviceUI.serviceIconMarkup('delivery-plusdelivery').includes('PD'));
assert(!serviceUI.serviceIconMarkup('social-instagram').includes('<img'));
assert(catalog.searchServices('whatsapp').length===1);
assert(catalog.searchServices('steam').length===1);
assert(catalog.searchServices('','social').length===6);
assert(serviceUI.serviceIconMarkup('music-spotify').includes('#1ED760'));
assert(serviceUI.serviceIconMarkup('music-spotify').includes('--gb-service-fg:#151515'),'Spotify mark must contrast on its original green');
assert(serviceUI.serviceIconMarkup('streaming-netflix').includes('--gb-service-fg:#ffffff'),'Netflix mark must contrast on red');
assert.equal(serviceUI.serviceDisplayName('streaming-netflix','','outro'),'Netflix');
assert.equal(serviceUI.serviceDisplayName('custom','Serviço local','outro'),'Serviço local');
assert(serviceUI.serviceIdentityMarkup('delivery-plusdelivery').includes('PD'));
let seq=0;
const store=load('store',{
 uid:()=> 'id'+(++seq), validDate:d=>/^\d{4}-\d\d-\d\d$/.test(d),
 paid:()=>0,today:()=> '2026-11-06',CATEGORY_ICON_OPTIONS:[],BANKS:[]
},['emptyDatabase','validateDatabase']);
const db=store.emptyDatabase();
const initial=JSON.stringify(db);
serviceUI.servicePickerMarkup();
assert.equal(JSON.stringify(db),initial,'Picker cannot create financial data');
const t={id:'title1',description:'Netflix',document:'',notes:'',type:'expense',
 amount:3990,issue:'2026-11-06',due:'2026-11-06',cancelled:false,
 accountId:'',partnerId:'',categoryId:db.categories[0].id,mode:'single',
 sequence:1,count:1,groupId:null,serviceId:'streaming-netflix',serviceName:''};
db.titles.push(t);
assert.equal(store.validateDatabase(db),db);
assert.equal(store.validateDatabase(JSON.parse(JSON.stringify(db))).titles[0].serviceId,'streaming-netflix');
const saved=JSON.parse(JSON.stringify(db));
assert.equal(saved.titles[0].serviceId,'streaming-netflix','Backup must preserve service ID');
t.serviceId='custom';t.serviceName='Lavanderia da cidade';
assert.equal(store.validateDatabase(db),db,'Custom service must remain valid');
t.serviceName='';
assert.throws(()=>store.validateDatabase(db),/nome do serviço/);
t.serviceId='streaming-netflix';t.serviceName='';t.type='income';t.categoryId=db.categories.find(c=>c.type==='income').id;
assert.throws(()=>store.validateDatabase(db),/serviço associado/);
const formSource=src('forms');
assert(formSource.includes('servicePickerMarkup(t)'), 'New and edit title must show picker');
assert(formSource.includes('serviceIdentityMarkup(t.serviceId,t.serviceName)'),'Details must show service');
const app=src('app');
assert(app.includes("serviceId,serviceName"),'Form save must include service metadata');
assert(app.includes("serviceById(serviceId)"),'Unknown service IDs must be rejected');
assert(app.includes("kind:'service',selected:form.elements.serviceId"),'Service must open the separate sheet');
assert(src('bottom-sheet').includes('data-sheet-choice=""'),'User must be able to clear service in the sheet');
assert(app.includes('description.value=serviceDisplayName(hidden.value,name.value'), 'Selected service defines description');
assert(app.includes('description.readOnly=true'),'PF service descriptions are read-only while selected');
assert(app.includes('const description=serviceId?serviceDisplayName(serviceId,serviceName'), 'Saved title uses canonical service name');
console.log('GB+ 2.8.6 candidata: catálogo de 49 serviços, 39 marcas locais, fallback e integridade financeira verificados.');
