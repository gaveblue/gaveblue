// GB+ 2.8.6 — QA de consentimento, catálogo e navegação padrão.
// Executar com: node gbplus/tests/gbplus-286-legal-nav-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const strip=code=>code.replace(/^import\s+.*?;\s*$/gm,'').replace(/^export /gm,'');
const load=(file,names,deps={})=>Function(...Object.keys(deps),strip(read(file))+';return {'+names.join(',')+'};')(...Object.values(deps));
const consent=load('js/legal-consent.js',['LEGAL_VERSION','TERMS_URL','PRIVACY_URL','needsLegalAcceptance','readConsent','setMarketingConsent']);
assert.equal(consent.LEGAL_VERSION,'2026-11-08-v1');
assert.equal(consent.TERMS_URL,'./termos-de-uso.html');
assert.equal(consent.PRIVACY_URL,'./privacidade.html');
assert(consent.needsLegalAcceptance(null));
assert(consent.needsLegalAcceptance({terms_version:'2026-11-07',privacy_version:'2026-11-08-v1'}));
assert(!consent.needsLegalAcceptance({terms_version:consent.LEGAL_VERSION,privacy_version:consent.LEGAL_VERSION}));
const source=read('js/legal-consent.js');
assert(source.includes('name="terms" required')&&source.includes('name="marketing"'));
assert(!source.includes('name="marketing" checked'),'Marketing starts unchecked');
assert(source.includes('gbplus_accept_updated_policies')&&source.includes('gbplus_set_marketing_consent'));
const calls=[];
const client={rpc:async(name,args)=>{calls.push({name,args});return {data:name==='gbplus_get_consent_state'?{marketing:false}:{ok:true,marketing:args.p_marketing},error:null};}};
await consent.readConsent(client);
await consent.setMarketingConsent(client,false);
assert.deepEqual(calls.map(c=>c.name),['gbplus_get_consent_state','gbplus_set_marketing_consent']);
assert.equal(calls[1].args.p_marketing,false);
const store=load('js/store.js',['defaultMobileNav','effectiveMobileNav','validMobileNav'],{
 uid:()=>'',validDate:()=>true,paid:()=>0,today:()=>'',CATEGORY_ICON_OPTIONS:[],BANKS:[],
 CATEGORY_SUGGESTIONS:[],DEFAULT_NOTIFICATION_PREFS:{},validNotificationPrefs:()=>true
});
assert.deepEqual(store.defaultMobileNav(),['titles','cards','menu']);
assert.deepEqual(store.effectiveMobileNav({mobileNav:['titles','partners','menu']}),['titles','cards','menu']);
assert.deepEqual(store.effectiveMobileNav({mobileNav:['flow','cards','menu']}),['flow','cards','menu']);
assert(store.validMobileNav(['titles','cards','menu']));
const catalog=load('js/service-catalog.js',['SERVICE_CATALOG','serviceById']);
assert.equal(catalog.SERVICE_CATALOG.length,56);
const uploaded={ 'digital-canva':'canva','mobility-indrive':'indrive','mobility-99':'99',
 'delivery-rappi':'rappi','streaming-globoplay':'globoplay' };
for(const [id,name] of Object.entries(uploaded)){
 const local='./assets/service-icons/'+name+'.webp';
 assert.equal(catalog.serviceById(id).logoPath,local);
 assert(readFileSync(resolve(root,local)).byteLength>150,'Empty logo: '+id);
}
assert.equal(catalog.SERVICE_CATALOG.filter(s=>s.logoPath).length,21);
const old=load('js/service-brand-paths.js',['SERVICE_BRAND_PATHS']);
const extra=load('js/service-extra-brand-paths.js',['SERVICE_EXTRA_BRAND_PATHS']);
assert.equal(catalog.SERVICE_CATALOG.filter(s=>s.logoPath||old.SERVICE_BRAND_PATHS[s.id]||extra.SERVICE_EXTRA_BRAND_PATHS[s.id]).length,56);
const app=read('js/app.js'),auth=read('js/auth.js'),views=read('js/views.js');
assert(app.indexOf('await requireLegalAcceptance(authClient())')<app.indexOf('repository=new SupabaseRepository(authClient(),user.id)'));
assert(app.includes('setMarketingConsent(authClient(),v.marketing===\'on\')'));
assert(auth.includes('name="legal_preaccept" required')&&auth.includes('termos-de-uso.html'));
assert(views.includes('Preferências de e-mail'));
assert(read('privacidade.html').includes('2026-11-08-v1')&&read('termos-de-uso.html').includes('2026-11-08-v1'));
const version=JSON.parse(read('version.json'));
assert.equal(version.version,'2.8.8');
assert.equal(version.build,2880);
for(const name of Object.values(uploaded))assert(version.assets.includes('./assets/service-icons/'+name+'.webp'));
assert(read('index.html').includes('legal-consent.css?v=20261108-2866'));
assert(read('sw.js').includes('gb-plus-shell-v2880'));
console.log('GB+ 2.8.6: aceite obrigatório, opt-in opcional, revogação, barra móvel e 56 ícones locais OK.');
