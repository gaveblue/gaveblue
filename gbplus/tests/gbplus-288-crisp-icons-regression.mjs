// GB+ 2.8.8: nitidez, assets locais e preservação dos 56 serviços.
// Executar: node gbplus/tests/gbplus-288-crisp-icons-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const load=(path,names,deps={})=>Function(...Object.keys(deps),
 read(path).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';return {'+names.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {SERVICE_CATALOG,serviceById,searchServices}=load('js/service-catalog.js',['SERVICE_CATALOG','serviceById','searchServices']);
const {SERVICE_BRAND_PATHS}=load('js/service-brand-paths.js',['SERVICE_BRAND_PATHS']);
const {SERVICE_EXTRA_BRAND_PATHS}=load('js/service-extra-brand-paths.js',['SERVICE_EXTRA_BRAND_PATHS']);
const {SERVICE_BRAND_COLORS}=load('js/service-brand-colors.js',['SERVICE_BRAND_COLORS']);
const {serviceIconMarkup,serviceIdentityMarkup}=load('js/service-ui.js',['serviceIconMarkup','serviceIdentityMarkup'],{
 serviceById,SERVICE_BRAND_PATHS,SERVICE_EXTRA_BRAND_PATHS,SERVICE_BRAND_COLORS,esc
});
const ids={
 'streaming-hbomax':'hbo-max.webp','delivery-99food':'99food.webp',
 'streaming-primevideo':'prime-video.webp','shopping-tiktokshop':'tiktok-shop.webp',
 'social-whatsapp':'whatsapp.webp','shopping-shopee':'shopee.webp',
 'shopping-mercadolivre':'mercado-livre.webp','social-telegram':'telegram.webp',
 'music-spotify':'spotify.webp','shopping-magalu':'magalu.webp',
 'shopping-casasbahia':'casas-bahia.webp','shopping-temu':'temu.webp',
 'shopping-shein':'shein.webp'
};
assert.equal(SERVICE_CATALOG.length,56,'O catálogo deve preservar os 56 serviços');
assert.equal(new Set(SERVICE_CATALOG.map(s=>s.id)).size,56,'IDs duplicados');
assert.equal(SERVICE_CATALOG.filter(s=>s.logoPath).length,21,'21 arquivos locais, incluindo os 13 aprimorados');
assert(!read('js/service-catalog.js').includes('LOCAL_SERVICE_SPRITES'),'Não usar o atlas antigo');
assert(!read('js/service-ui.js').includes('gb-service-sprite-image'),'Não renderizar a grade');
for(const [id,filename] of Object.entries(ids)){
 const path='./assets/service-icons/'+filename;
 const item=serviceById(id);
 assert(item,'Aplicativo ausente: '+id);
 assert.equal(item.logoPath,path,'Arquivo errado: '+id);
 assert.equal(item.logoVerified,true,'Ícone deve estar disponível: '+id);
 assert(!item.sprite,'Atlas não deve prevalecer: '+id);
 const bytes=readFileSync(resolve(root,path));
 assert.equal(bytes.toString('ascii',0,4),'RIFF','Arquivo RIFF: '+id);
 assert.equal(bytes.toString('ascii',8,12),'WEBP','Arquivo WebP: '+id);
 assert.equal(bytes.toString('ascii',12,16),'VP8 ','Codec WebP esperado: '+id);
 assert.equal(bytes.readUInt16LE(26)&0x3fff,320,'Largura 320: '+id);
 assert.equal(bytes.readUInt16LE(28)&0x3fff,320,'Altura 320: '+id);
 assert(bytes.length>1000,'Arquivo inesperadamente pequeno: '+id);
 const html=serviceIconMarkup(id);
 assert(html.includes('src="'+path+'"'),'Identidade visual local de '+id);
 assert(html.includes('gb-service-image-hq'),'Renderer HD de '+id);
 assert(html.includes('gb-service-asset-fallback'),'Fallback de '+id);
 assert(!html.includes('service-brands-287.webp'),'Atlas não deve ser requisitado');
 assert(serviceIdentityMarkup(id).includes(path),'Lançamentos também usam ícone nítido');
}
for(const name of ['TikTok Shop','Shopee','Mercado Livre','Magalu','Casas Bahia','Temu','SHEIN']){
 assert.equal(searchServices(name,'shopping').length,1,'Busca de '+name);
}
assert.equal(SERVICE_CATALOG.filter(s=>s.logoPath||SERVICE_BRAND_PATHS[s.id]||SERVICE_EXTRA_BRAND_PATHS[s.id]).length,56);
const css=read('gb-entry-wizard.css');
assert(css.includes('object-fit:contain!important'),'Não distorcer logos');
assert(css.includes('image-rendering:auto'),'Renderização suave de alta resolução');
assert(!css.includes('width:400%!important'),'A ampliação do atlas deve ser eliminada');
const version=JSON.parse(read('version.json'));
assert.equal(version.version,'2.8.8');
assert.equal(version.build,2880);
for(const filename of Object.values(ids)) assert(version.assets.includes('./assets/service-icons/'+filename));
assert(!version.assets.includes('./assets/service-icons/service-brands-287.webp'));
assert(read('index.html').includes('gbplus-version" content="2.8.8"'));
assert(read('index.html').includes('app.js?v=20261108-2880'));
assert(read('sw.js').includes('gb-plus-shell-v2880'));
assert(read('js/app.js').includes('installServiceIconRecovery(document)'));
console.log('GB+ 2.8.8: 13 ícones individuais 320 px, 56 serviços, busca, fallback e PWA verificados.');
