// GB+ 2.8.7 — catálogo e ícones locais (sem mudanças em dados financeiros).
// Executar: node gbplus/tests/gbplus-287-service-icons-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const load=(path,keys,deps={})=>Function(...Object.keys(deps),
 read(path).replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+';return {'+keys.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const catalog=load('js/service-catalog.js',['SERVICE_CATALOG','SERVICE_SPRITE_URL','searchServices','serviceById']);
assert.equal(catalog.SERVICE_CATALOG.length,56);
assert.equal(new Set(catalog.SERVICE_CATALOG.map(s=>s.id)).size,56);
const icons={
 'streaming-hbomax':[0,0],'delivery-99food':[1,0],'streaming-primevideo':[2,0],
 'shopping-tiktokshop':[3,0],'social-whatsapp':[0,1],'shopping-shopee':[1,1],
 'shopping-mercadolivre':[2,1],'social-telegram':[3,1],
 'music-spotify':[0,2],'shopping-magalu':[1,2],'shopping-casasbahia':[2,2],
 'shopping-temu':[3,2],'shopping-shein':[0,3]
};
for(const [id,position] of Object.entries(icons)){
 const found=catalog.serviceById(id);
 assert(found,'Missing service '+id);
 assert.deepEqual(found.sprite,position,'Wrong sprite tile for '+id);
 assert(found.logoVerified,'Brand art must be marked available for '+id);
}
assert.equal(catalog.SERVICE_CATALOG.filter(s=>s.sprite).length,13);
for(const name of ['TikTok Shop','Shopee','Mercado Livre','Magalu','Casas Bahia','Temu','SHEIN']){
 const hits=catalog.searchServices(name,'shopping');
 assert.equal(hits.length,1,'New shop must be searchable: '+name);
 assert.equal(hits[0].group,'shopping');
}
for(const id of ['streaming-hbomax','delivery-99food','streaming-primevideo','social-whatsapp','social-telegram','music-spotify']){
 assert(catalog.serviceById(id).sprite,'Existing ID lost its updated art: '+id);
}
const original=load('js/service-brand-paths.js',['SERVICE_BRAND_PATHS']);
const extra=load('js/service-extra-brand-paths.js',['SERVICE_EXTRA_BRAND_PATHS']);
assert.equal(catalog.SERVICE_CATALOG.filter(s=>s.sprite||s.logoPath||original.SERVICE_BRAND_PATHS[s.id]||extra.SERVICE_EXTRA_BRAND_PATHS[s.id]).length,56);
const colors=load('js/service-brand-colors.js',['SERVICE_BRAND_COLORS']);
const ui=load('js/service-ui.js',['serviceIconMarkup'],{
 serviceById:catalog.serviceById,SERVICE_SPRITE_URL:catalog.SERVICE_SPRITE_URL,
 SERVICE_BRAND_PATHS:original.SERVICE_BRAND_PATHS,
 SERVICE_EXTRA_BRAND_PATHS:extra.SERVICE_EXTRA_BRAND_PATHS,
 SERVICE_BRAND_COLORS:colors.SERVICE_BRAND_COLORS,esc
});
for(const [id,[col,row]] of Object.entries(icons)){
 const markup=ui.serviceIconMarkup(id);
 assert(markup.includes('src="'+catalog.SERVICE_SPRITE_URL+'"'),'Must use local atlas for '+id);
 assert(markup.includes('left:-'+(col*100)+'%!important;top:-'+(row*100)+'%!important'),'Incorrect tile transform '+id);
 assert(markup.includes('gb-service-asset-fallback'),'No fallback for '+id);
}
const bytes=readFileSync(resolve(root,catalog.SERVICE_SPRITE_URL));
assert.equal(bytes.toString('ascii',0,4),'RIFF');
assert.equal(bytes.toString('ascii',8,12),'WEBP');
assert(bytes.length>3000&&bytes.length<50000,'Atlas must be a compact local image');
const css=read('gb-entry-wizard.css');
assert(css.includes('.gb-service-logo.gb-service-sprite')&&css.includes('width:400%!important')&&css.includes('height:400%!important'));
const version=JSON.parse(read('version.json'));
assert.equal(version.version,'2.8.7');
assert.equal(version.build,2870);
assert(version.assets.includes(catalog.SERVICE_SPRITE_URL));
assert(read('sw.js').includes('gb-plus-shell-v2870'));
assert(read('index.html').includes('gbplus-version" content="2.8.7"'));
assert(read('index.html').includes('app.js?v=20261108-2870'));
assert(read('js/app.js').includes('installServiceIconRecovery(document)'));
console.log('GB+ 2.8.7: 56 serviços, 13 artes reais no atlas local, 7 novas lojas e fallback seguros.');
