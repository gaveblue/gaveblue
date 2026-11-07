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
const catalog=load('service-catalog',{},['SERVICE_CATALOG','SERVICE_GROUPS','serviceById','searchServices','serviceSearchKey']);
assert.equal(catalog.SERVICE_CATALOG.length,26);
assert.equal(new Set(catalog.SERVICE_CATALOG.map(s=>s.id)).size,26);
assert.equal(Object.keys(catalog.SERVICE_GROUPS).length,5);
assert.equal(Object.keys(logos).length,13);
assert.equal(catalog.searchServices('netflix').length,1);
assert.equal(catalog.searchServices('ifood').length,1);
assert.equal(catalog.searchServices('','delivery').length,5);
assert(catalog.SERVICE_CATALOG.some(s=>s.name==='Plus Delivery'));
assert(catalog.SERVICE_CATALOG.some(s=>s.name==='ChatGPT'));
assert.equal(catalog.serviceSearchKey('Música + Vídeo'),'musicavideo');
for(const [id,paths]of Object.entries(logos)){
 assert(catalog.serviceById(id),'Icon references unknown service '+id);
 assert(paths.length>0&&paths.every(p=>typeof p==='string'&&p.length>5),'Missing logo path');
}
const serviceUI=load('service-ui',{
 SERVICE_CATALOG:catalog.SERVICE_CATALOG,SERVICE_GROUPS:catalog.SERVICE_GROUPS,
 serviceById:catalog.serviceById,serviceSearchKey:catalog.serviceSearchKey,
 SERVICE_BRAND_PATHS:logos,esc
},['servicePickerMarkup','serviceIconMarkup','serviceIdentityMarkup']);
const page=serviceUI.servicePickerMarkup();
for(const word of ['name="serviceId"','name="serviceName"','Netflix','HBO Max','iFood','Plus Delivery',
 'Outro serviço','id="gb-service-options" hidden','data-action="title-service-pick"'])assert(page.includes(word),'Missing '+word);
const chosen=serviceUI.servicePickerMarkup({serviceId:'streaming-netflix'});
assert(chosen.includes('value="streaming-netflix"'));
const other=serviceUI.servicePickerMarkup({serviceId:'custom',serviceName:'Local <img onerror=alert(1)>'});
assert(!other.includes('<img onerror'));
assert(other.includes('&lt;img'));
assert(serviceUI.serviceIdentityMarkup('streaming-netflix').includes('<svg'));
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
t.serviceId='streaming-netflix';t.serviceName='';t.type='income';
assert.throws(()=>store.validateDatabase(db),/serviço associado/);
const formSource=src('forms');
assert(formSource.includes('servicePickerMarkup(t)'), 'New and edit title must show picker');
assert(formSource.includes('serviceIdentityMarkup(t.serviceId,t.serviceName)'),'Details must show service');
const app=src('app');
assert(app.includes("serviceId,serviceName"),'Form save must include service metadata');
assert(app.includes("serviceById(serviceId)"),'Unknown service IDs must be rejected');
assert(app.includes('title-service-clear'),'User must be able to clear service');
assert(app.includes("if(service&&!form.elements.description.value.trim())"),'Do not override existing descriptions');
console.log('GB+ 2.6.0: 26 serviços, 13 ícones locais, validação, edição e segurança OK.');
