// Regressão histórica GB+ 2.8.7: 7 lojas e IDs preservados após retirar o atlas.
// Executar: node gbplus/tests/gbplus-287-service-icons-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const strip=s=>s.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const load=(file,names)=>Function(strip(readFileSync(resolve(root,file),'utf8'))+';return {'+names.join(',')+'};')();
const {SERVICE_CATALOG,searchServices,serviceById}=load('js/service-catalog.js',['SERVICE_CATALOG','searchServices','serviceById']);
assert.equal(SERVICE_CATALOG.length,56);
assert.equal(new Set(SERVICE_CATALOG.map(s=>s.id)).size,56);
const shops={
 'shopping-tiktokshop':'TikTok Shop',
 'shopping-shopee':'Shopee',
 'shopping-mercadolivre':'Mercado Livre',
 'shopping-magalu':'Magalu',
 'shopping-casasbahia':'Casas Bahia',
 'shopping-temu':'Temu',
 'shopping-shein':'SHEIN'
};
for(const [id,name] of Object.entries(shops)){
 const item=serviceById(id);
 assert(item&&item.name===name&&item.group==='shopping','Novo serviço de compras deve permanecer: '+id);
 assert.equal(searchServices(name,'shopping').length,1,'Busca de '+name);
 assert(item.logoPath?.startsWith('./assets/service-icons/'),'Logotipo local de '+id);
}
for(const id of ['streaming-hbomax','delivery-99food','streaming-primevideo',
 'social-whatsapp','social-telegram','music-spotify']){
 assert(serviceById(id),'Identificador anterior perdido: '+id);
}
console.log('Regressão 2.8.7: sete lojas, seis IDs existentes e 56 serviços preservados.');
