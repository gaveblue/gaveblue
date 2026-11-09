// GB+ 2.8.6 candidata: regressão da tela Mais e identidade local do ChatGPT.
// Executar: node gbplus/tests/gbplus-286-more-brand-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const strip=s=>s.replace(/^import\s+.*?;\s*$/gm,'').replace(/^export /gm,'');
const compile=(file,names,deps={})=>Function(...Object.keys(deps),strip(read(file))+';return {'+names.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>'<svg data-icon="'+esc(name)+'"></svg>';
const catalog=compile('js/service-catalog.js',['SERVICE_CATALOG','serviceById']);
assert.equal(catalog.SERVICE_CATALOG.length,56);
assert.equal(catalog.serviceById('digital-chatgpt').logoPath,'./assets/service-icons/chatgpt.svg');
const file=read('assets/service-icons/chatgpt.svg');
assert(file.startsWith('<svg')&&file.includes('viewBox="0 0 512 512"'));
assert(!/<script|onerror=|onload=|<foreignObject|href="https?:/i.test(file),'Local brand art must not execute external content');
const icons=compile('js/service-brand-paths.js',['SERVICE_BRAND_PATHS']);
const extra=compile('js/service-extra-brand-paths.js',['SERVICE_EXTRA_BRAND_PATHS']);
const colors=compile('js/service-brand-colors.js',['SERVICE_BRAND_COLORS']);
const service=compile('js/service-ui.js',['serviceIconMarkup','serviceDisplayName'],{
 serviceById:catalog.serviceById,
 SERVICE_BRAND_PATHS:icons.SERVICE_BRAND_PATHS,
 SERVICE_EXTRA_BRAND_PATHS:extra.SERVICE_EXTRA_BRAND_PATHS,
 SERVICE_BRAND_COLORS:colors.SERVICE_BRAND_COLORS,esc
});
const chat=service.serviceIconMarkup('digital-chatgpt');
assert(chat.includes('class="gb-service-asset-image gb-service-image-hq"')&&chat.includes('src="./assets/service-icons/chatgpt.svg"'));
assert(chat.includes('gb-service-asset-fallback')&&chat.includes('CG'));
const supplied={
 'streaming-disney':'./assets/service-icons/disney-plus.webp',
 'streaming-primevideo':'./assets/service-icons/prime-video.webp',
 'delivery-99food':'./assets/service-icons/99food.webp',
 'delivery-plusdelivery':'./assets/service-icons/plus-delivery.webp'
};
for(const [id,path] of Object.entries(supplied)){
 assert.equal(catalog.serviceById(id).logoPath,path,'Expected committed icon path for '+id);
 assert(service.serviceIconMarkup(id).includes('src="'+path+'"'),'Renderer should load '+id+' locally');
 assert(service.serviceIconMarkup(id).includes('gb-service-asset-fallback'),'Fallback should remain for '+id);
 // Git binary blobs are validated against prepared originals before committing.
}
assert.equal(catalog.SERVICE_CATALOG.filter(s=>Boolean(s.logoPath)).length,21);
for(const [id,name] of Object.entries({'streaming-globoplay':'globoplay','delivery-rappi':'rappi','mobility-99':'99','mobility-indrive':'indrive','digital-canva':'canva'})){
 const path='./assets/service-icons/'+name+'.webp';
 assert.equal(catalog.serviceById(id).logoPath,path);
 assert(service.serviceIconMarkup(id).includes('src="'+path+'"'));
}
const css=read('gb-entry-wizard.css');
assert(css.includes('.gb-service-asset-image[hidden]')&&css.includes('object-fit:contain'));
const doc={querySelector:()=>({content:'2.8.6'})};
const views=compile('js/views.js',['settingsView','routes'],{document:doc,icon,esc});
assert(views.routes.some(([route])=>route==='more'));
assert(!views.routes.some(([route])=>route==='settings'),'Do not duplicate Configurações route');
const embedded=views.settingsView({},false,true,{id:'test',user_metadata:{}},true,true);
assert(embedded.includes('gb-more-settings')&&embedded.includes('gb-more-cfg-group'));
assert.equal((embedded.match(/<details /g)||[]).length,4);
assert(!embedded.includes('gb-cfg-profile')&&!embedded.includes('gb-cfg-header'));
assert(embedded.includes('data-action="settings-backup"')&&embedded.includes('data-action="settings-delete"'));
assert(views.settingsView({},false,false,null,false).includes('gb-cfg-header'),'Legacy rendering remains available for tests');
const more=compile('js/more-view.js',['moreView'],{icon,esc,settingsView:views.settingsView}).moreView;
const html=more(true,{}, {id:'test',user_metadata:{}},true);
assert.equal((html.match(/href="#profile"/g)||[]).length,1,'Only one profile entry');
assert(html.includes('href="#notifications"')&&html.includes('data-action="settings-updates"'));
assert(!html.includes('href="#settings"'),'No duplicate Configurações navigation');
assert(html.includes('data-action="settings-reset"')&&html.includes('data-action="settings-delete"'));
const app=read('js/app.js');
Function(strip(app));
assert(app.includes("requested==='settings'?'more'"),'Old Settings deep links open Mais');
assert(app.includes('expandedMoreSections'),'Preferences accordions maintain user choice on redraw');
assert(app.includes('installServiceIconRecovery(document)'),'Broken image fallback listener installed');
const version=JSON.parse(read('version.json'));
assert.equal(version.build,2880);
for(const path of Object.values(supplied))assert(version.assets.includes(path),'Release manifest must include '+path);
assert.equal(version.version,'2.8.8');
assert.equal(version.release_status,'candidate_not_published');
assert(version.assets.includes('./assets/service-icons/chatgpt.svg'));
assert(read('sw.js').includes('gb-plus-shell-v'+version.build));
console.log('GB+ 2.8.6: Mais+Configurações, 1 SVG local, 0 fallbacks, segurança, rotas e versão candidata verificados.');
