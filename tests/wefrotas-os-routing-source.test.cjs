'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas.js'),'utf8');
const guide=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-os-guided.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-os-guided.css'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../wefrotas/index.html'),'utf8');
const section=(a,b)=>{const start=app.indexOf(a);const end=app.indexOf(b,start);assert.ok(start>=0&&end>start);return app.slice(start,end);};

test('Nova OS reinicializa o guia somente no seu próprio formulário',()=>{
 const modal=section('function openCadastroModal(type)', 'function closeCadastroModal()');
 const premium=section('function openPremiumModal()', 'function openCadastroModal(type)');
 assert.match(modal,/if \(type === 'order'\) window\.WeFrotasOsGuide\?\.reset\(\)/);
 assert.doesNotMatch(premium,/if \(type === 'order'\)/);
});
test('Salvar OS normal não obriga a navegação de sinistro',()=>{
 const save=section("if (currentModalType === 'order') {","if (currentModalType === 'finance') {");
 assert.match(save,/if \(document\.getElementById\('order-tipo-os'\)\?\.value === 'sinistro'\)/);
 assert.match(save,/if \(window\.WeFrotasOsGuide\.wizardStep\(\) !== 3\)/);
});
test('Somente sinistro habilita o fluxo condicional e de etapas',()=>{
 assert.match(guide,/const isIncident = t => t === 'sinistro'/);
 assert.match(guide,/const guided=type\(\)==='sinistro'/);
 assert.match(guide,/submit\.hidden=!enabled/);
 assert.match(guide,/if\(!guided\)\{[\s\S]*?clearWizardError\(\);[\s\S]*?return;/);
});
test('Falhas do botão Continuar são exibidas no formulário',()=>{
 assert.ok(app.includes('id="wf-os-step-error"'));
 assert.match(guide,/function showWizardError\(message,fieldId=''\)/);
 assert.match(guide,/error\.setAttribute\('role','alert'\)/);
 assert.match(css,/#wf-os-step-error\[hidden\]/);
});
test('Cache de todos os recursos alterados foi invalidado',()=>{
 for(const filename of ['wefrotas-os-guided.css','wefrotas.js'])
   assert.ok(html.includes(filename+'?v=20261109-os-hotfix-sinistro-2'),filename);
 assert.ok(html.includes('wefrotas-os-guided.js?v=20261109-click-capture-3'));
});

test('Botões chamam o assistente diretamente, mesmo com stopPropagation',()=>{
 assert.ok(app.includes('handleModalBackdrop(event)'));
 assert.ok(app.includes('event.stopPropagation()'));
 assert.ok(app.includes("handleWizardAction('next')"));
 assert.ok(app.includes("handleWizardAction('back')"));
 assert.ok(guide.includes('function handleWizardAction(action)'));
 assert.ok(!guide.includes("e.target?.closest?.('[data-os-step-next]')"));
});
