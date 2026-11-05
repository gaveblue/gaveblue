'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const strip=s=>s.replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const custom=read('js/custom-controls.js');
const funcs=new Function(strip(custom)+';return {dateISO,readableDate,parts};')();

test('custom calendar converts stored ISO dates to the GB+ display format',()=>{
 assert.equal(funcs.readableDate('2026-11-04'),'04/11/2026');
 assert.equal(funcs.dateISO(2026,11,4),'2026-11-04');
 assert.equal(funcs.readableDate(''),'Selecionar data');
 assert.deepEqual(funcs.parts('2026-10-30'),{y:2026,m:10,d:30});
});
test('custom controls visibly replace native selects and dates without changing underlying FormData',()=>{
 assert.ok(custom.includes("root.querySelectorAll?.('select').forEach(enhanceSelect)"));
 assert.ok(custom.includes('input[type="date"]'));
 assert.ok(custom.includes("new Event('change',{bubbles:true})"));
 assert.ok(custom.includes("new Event('input',{bubbles:true})"));
 assert.ok(custom.includes("input.classList.add('gb-custom-native-date')"));
 assert.ok(custom.includes("select.classList.add('gb-custom-native-select')"));
 assert.ok(read('custom-controls.css').includes('.gb-custom-native-select'));
 assert.ok(read('custom-controls.css').includes('.gb-custom-native-date'));
});
test('custom calendar validates min and max, supports keyboard and does not open a native picker',()=>{
 assert.ok(custom.includes("date<input.min"));
 assert.ok(custom.includes("date>input.max"));
 assert.ok(custom.includes("event.key==='Escape'"));
 assert.ok(custom.includes("event.key==='Tab'"));
 assert.ok(!custom.includes('showPicker('));
 assert.ok(custom.includes("const min=input.min||'0001-01-01'"));
});
test('periodicity explanatory hint has been removed',()=>{
 const forms=read('js/forms.js'),app=read('js/app.js');
 assert.ok(!forms.includes('id="mode-hint"'));
 assert.ok(!app.includes("document.querySelector('#mode-hint').textContent"));
 assert.ok(app.includes("count.hidden=el.value==='single'"));
});
test('updater is centered with blur, real download and no simulated preview',()=>{
 const update=read('js/update.js'),styles=read('overlays.css');
 assert.ok(styles.includes('body.gb-update-open::before'));
 assert.ok(styles.includes('backdrop-filter:blur(9px)'));
 assert.ok(styles.includes('left:50%;top:50%'));
 assert.ok(update.includes("node.setAttribute('role','dialog')"));
 assert.ok(update.includes('await cache.put') || update.includes('await cache.put('));
 assert.ok(update.includes('data.assets.length<=80'));
 assert.ok(!update.includes('window.confirm('));
 assert.ok(!update.includes('function runDemo('));
 assert.ok(!update.includes('function demo('));
});
test('phone install prompt is offered only outside PWA and uses actual browser prompt',()=>{
 const pwa=read('js/pwa-install.js');
 assert.ok(pwa.includes("matchMedia('(max-width:760px) and (pointer:coarse)')"));
 assert.ok(pwa.includes("matchMedia('(display-mode: standalone)')"));
 assert.ok(pwa.includes("'beforeinstallprompt'"));
 assert.ok(pwa.includes('await event.prompt()'));
 assert.ok(pwa.includes('event.userChoice'));
 assert.ok(pwa.includes("'appinstalled'"));
 assert.ok(pwa.includes('Deixar para depois'));
 assert.ok(pwa.includes('Instalar agora'));
 assert.ok(pwa.includes('Adicionar à Tela de Início'));
 assert.ok(!pwa.includes('setInterval('));
 assert.ok(pwa.includes('isPwaInstalled()'));
});
test('release assets and cache are aligned',()=>{
 const manifest=JSON.parse(read('version.json')),index=read('index.html'),sw=read('sw.js');
 assert.equal(manifest.version,'2.2.2');
 assert.equal(manifest.build,39);
 for(const asset of ['./custom-controls.css','./overlays.css','./js/custom-controls.js','./js/pwa-install.js'])assert.ok(manifest.assets.includes(asset),asset);
 assert.ok(index.includes('custom-controls.css?v=20261104-40'));
 assert.ok(index.includes('overlays.css?v=20261104-40'));
 assert.ok(index.includes('app.js?v=20261104-40'));
 assert.ok(sw.includes('gb-plus-shell-v39'));
});
