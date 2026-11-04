'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const moduleSource=text=>text.replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>'<svg data-icon="'+esc(name)+'"></svg>';
const document={querySelector:sel=>sel==='meta[name="gbplus-version"]'?{content:'2.1.4'}:null};
const view=new Function('icon','esc','document',moduleSource(source('js/views.js'))+';return settingsView;')(icon,esc,document);
const render=()=>view({settings:{theme:'dark'},titles:[],accounts:[]},true,true,{email:'example@example.com',user_metadata:{gbplus_profile:{full_name:'Pessoa de Teste'}}});

test('settings presents native-like grouped categories and dynamic profile name',()=>{
 const html=render();
 for(const title of ['Configurações','PREFERÊNCIAS','DADOS E REGISTROS','SISTEMA','SUPORTE E SOBRE'])assert.ok(html.includes(title),title);
 assert.ok(html.includes('Pessoa de Teste'));
 assert.ok(!html.includes('example@example.com'));
 assert.ok(html.includes('v2.1.4'));
});
test('all settings rows have working app action handlers',()=>{
 const html=render(),app=source('js/app.js');
 for(const action of ['settings-search','settings-appearance','customize','customize-mobile-nav','settings-backup','settings-data','restart-setup','settings-updates','install','invite-friend','settings-help','settings-about','settings-delete']){
  assert.ok(html.includes('data-action="'+action+'"'),action+' not rendered');
  assert.ok(app.includes("'"+action+"':")||app.includes('  '+action+':'),action+' not wired');
 }
});
test('backup file input remains available and deletion requires a request',()=>{
 const html=render(),app=source('js/app.js');
 assert.ok(html.includes('id="backup-input"'));
 assert.ok(app.includes('A exclusão automática ainda não está disponível'));
 assert.ok(app.includes('Solicitar exclusão de conta'));
});
test('settings stylesheet and release version are linked',()=>{
 const index=source('index.html'),version=JSON.parse(source('version.json')),css=source('settings-page.css');
 assert.ok(index.includes('settings-page.css?v=20261104-35'));
 assert.ok(css.includes('.gb-cfg-profile'));
 assert.ok(css.includes('html[data-theme="dark"] .gb-settings-layout'));
 assert.ok(index.includes('content="2.1.4"'));
 assert.equal(version.version,'2.1.4');
 assert.ok(version.assets.includes('./settings-page.css'));
});

test('settings preserve the viewport and hide mobile action bar exclusively on settings',()=>{
 const css=source('settings-page.css'),base=source('styles.css');
 assert.match(css,/body\.gb-settings-page \.topbar\{visibility:hidden;pointer-events:none\}/);
 assert.ok(!css.includes('body.gb-settings-page .topbar{display:none'));
 assert.ok(!css.includes('.gb-settings-page #main{padding:'));
 assert.match(css,/position:absolute;top:-72px/);
 assert.match(base,/\.mobile-nav\{display:flex;position:fixed;/);
 assert.ok(css.includes('body.gb-settings-page .mobile-nav,'));
 assert.ok(css.includes('body.gb-settings-page .mobile-nav-fade{display:none!important}'));
 assert.ok(!base.includes('body.gb-account-page .mobile-nav{display:none'));
});
test('privacy and support use only the institutional contact',()=>{
 const privacy=source('privacidade.html'),app=source('js/app.js');
 assert.ok(privacy.includes('Suporte GaveBlue'));
 assert.ok(privacy.includes('mailto:contato@gaveblue.com.br'));
 assert.ok(app.includes('mailto:contato@gaveblue.com.br'));
 assert.ok(!privacy.includes('Lucas Pimentel'));
 assert.ok(!privacy.includes('contato.lucaspimenteloliveira@gmail.com'));
 assert.ok(!app.includes('contato.lucaspimenteloliveira@gmail.com'));
});

test('install is hidden in standalone and fake update preview is unavailable',()=>{
 const db={settings:{theme:'dark'},titles:[],accounts:[]};
 const user={email:'example@example.com'};
 const standalone=view(db,false,true,user,true);
 assert.ok(!standalone.includes('data-action="install"'));
 assert.ok(render().includes('data-action="install"'));
 assert.ok(!source('js/app.js').includes('Prévia da atualização'));
 assert.ok(!source('js/update.js').includes("addEventListener('gbplus-preview-update'"));
});
test('invitation shares the official GB+ URL',()=>{
 const app=source('js/app.js');
 assert.ok(app.includes("const inviteLink='https://gaveblue.com.br/gbplus/'"));
 assert.ok(app.includes("'copy-invite':async"));
 assert.ok(app.includes("'share-invite':async"));
});
test('first-time configuration skips action-bar picker',()=>{
 const setup=source('js/setup-ui.js'),app=source('js/app.js');
 assert.ok(!setup.includes('navStep(d)'));
 assert.ok(!setup.includes("'<h3 class=\"shortcut-preview-heading\">Barra inferior"));
 assert.ok(!app.includes("d.settings.mobileNav=[...draft.mobileNav]"));
 assert.ok(app.includes("setupDraft.theme=theme"));
});
