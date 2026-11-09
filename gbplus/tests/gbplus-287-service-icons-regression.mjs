// GB+ 2.8.8 — regressão do catálogo após eliminação do atlas de 64px.
// Run: node gbplus/tests/gbplus-287-service-icons-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const load=(path,keys,deps={})=>Function(...Object.keys(deps),
 read(path).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';return {'+keys.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalog=load('js/service-catalog.js',['SERVICE_CATALOG','searchServices','serviceById']);
assert.equal(catalog.SERVICE_CATALOG.length,56);
assert.equal(new Set(catalog.SERVICE_CATALOG.map(s=>s.id)).size,56);
const upgraded={
 'streaming-hbomax':'hbo-max',
 'delivery-99food':'99food',
 'streaming-primevideo':'prime-video',
 'shopping-tiktokshop':'tiktok-shop',
 'social-whatsapp':'whatsapp',
 'shopping-shopee':'shopee',
 'shopping-mercadolivre':'mercado-livre',
 'social-telegram':'telegram',
 'music-spotify':'spotify',
 'shopping-magalu':'magalu',
 'shopping-casasbahia':'casas-bahia',
 'shopping-temu':'temu',
 'shopping-shein':'shein'
};
const old=load('js/service-brand-paths.js',['SERVICE_BRAND_PATHS']);
const extra=load('js/service-extra-brand-paths.js',['SERVICE_EXTRA_BRAND_PATHS']);
const accents=load('js/service-brand-colors.js',['SERVICE_BRAND_COLORS']);
const ui=load('js/service-ui.js',['serviceIconMarkup'],{
 serviceById:catalog.serviceById,
 SERVICE_BRAND_PATHS:old.SERVICE_BRAND_PATHS,
 SERVICE_EXTRA_BRAND_PATHS:extra.SERVICE_EXTRA_BRAND_PATHS,
 SERVICE_BRAND_COLORS:accents.SERVICE_BRAND_COLORS,esc
});
for(const [id,name] of Object.entries(upgraded)){
 const item=catalog.serviceById(id);
 const path='./assets/service-icons/hq-'+name+'.webp';
 assert(item&&item.logoVerified,'Logo missing for '+id);
 assert.equal(item.logoPath,path,'Wrong local file for '+id);
 assert(!item.sprite,'Old sprite must no longer be used by '+id);
 const buffer=readFileSync(resolve(root,path));
 assert(buffer.length>1000,'Missing image data: '+id);
 assert.equal(buffer.toString('ascii',0,4),'RIFF');
 assert.equal(buffer.toString('ascii',8,12),'WEBP');
 assert.equal(buffer.toString('ascii',12,16),'VP8 ');
 assert.equal(buffer.readUInt16LE(26)&0x3fff,320,'Width should be 320: '+id);
 assert.equal(buffer.readUInt16LE(28)&0x3fff,320,'Height should be 320: '+id);
 const markup=ui.serviceIconMarkup(id);
 assert(markup.includes('src="'+path+'"'),'Renderer must use individual file: '+id);
 assert(!markup.includes('gb-service-sprite'),'Old renderer still active: '+id);
 assert(markup.includes('gb-service-asset-fallback'),'Missing fallback: '+id);
}
for(const name of ['TikTok Shop','Shopee','Mercado Livre','Magalu','Casas Bahia','Temu','SHEIN']){
 const hits=catalog.searchServices(name,'shopping');
 assert.equal(hits.length,1,'Shop not searchable: '+name);
 assert.equal(hits[0].group,'shopping');
}
assert.equal(catalog.SERVICE_CATALOG.filter(s=>Boolean(s.logoPath)).length,21);
assert.equal(catalog.SERVICE_CATALOG.filter(s=>s.logoPath||old.SERVICE_BRAND_PATHS[s.id]||extra.SERVICE_EXTRA_BRAND_PATHS[s.id]).length,56);
const css=read('gb-entry-wizard.css');
assert(css.includes('object-fit:contain')&&css.includes('image-rendering:auto'));
assert(!css.includes('.gb-service-sprite'),'Old atlas CSS must be gone');
assert(!read('js/service-ui.js').includes('SERVICE_SPRITE_URL'));
assert(!read('js/service-catalog.js').includes('LOCAL_SERVICE_SPRITES'));
const version=JSON.parse(read('version.json'));
assert.equal(version.version,'2.8.8');
assert.equal(version.build,2880);
assert(!version.assets.includes('./assets/service-icons/service-brands-287.webp'));
for(const name of Object.values(upgraded))assert(version.assets.includes('./assets/service-icons/hq-'+name+'.webp'));
assert(read('sw.js').includes('gb-plus-shell-v2880'));
assert(read('index.html').includes('gbplus-version" content="2.8.8"'));
assert(read('index.html').includes('app.js?v=20261108-2880'));
assert(read('js/app.js').includes('installServiceIconRecovery(document)'));
console.log('GB+ 2.8.8: 56 serviços, 13 ícones 320x320 individuais, CSS sem atlas e PWA 2880 validados.');
