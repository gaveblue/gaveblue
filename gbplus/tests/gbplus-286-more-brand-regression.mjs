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
assert.equal(catalog.SERVICE_CATALOG.length,49);
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
assert(chat.includes('class="gb-service-asset-image"')&&chat.includes('src="./assets/service-icons/chatgpt.svg"'));
assert(chat.includes('gb-service-asset-fallback')&&chat.includes('CG'));
for(const missing of ['streaming-disney','streaming-primevideo','streaming-globoplay','delivery-99food','delivery-plusdelivery','delivery-rappi','mobility-99','mobility-indrive','digital-canva']){
 assert(!catalog.serviceById(missing).logoPath,'Logo not yet obtained must not pretend to be local: '+missing);
 assert(service.serviceIconMarkup(missing).includes('gb-service-monogram'),'Missing brand has text fallback: '+missing);
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
assert.equal(version.version,'2.8.6');
assert.equal(version.release_status,'candidate_not_published');
assert(version.assets.includes('./assets/service-icons/chatgpt.svg'));
assert(read('sw.js').includes('gb-plus-shell-v'+version.build));
console.log('GB+ 2.8.6: Mais+Configurações, 1 SVG local, 9 fallbacks, segurança, rotas e versão candidata verificados.');
