'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-os-guided.js'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas.js'),'utf8');

test('clicar Continuar diretamente avança mesmo que modal interrompa a propagação',()=>{
  const nodes=new Map(),listeners=[];
  function el(id,value='') {
    const item={id,value,hidden:false,style:{},dataset:{},innerHTML:'',textContent:'',
      setAttribute(){},removeAttribute(){},querySelector(){return null;},closest(){return null;},
      scrollIntoView(){},focus(){}};
    nodes.set(id,item);return item;
  }
  for(const id of [
    'os-operational-guide','wf-os-step-data','wf-os-step-occurrence','wf-os-step-review',
    'wf-os-step-back','wf-os-step-next','wf-os-step-header','wf-os-step-actions',
    'wf-os-step-error','modal-submit-btn','order-veiculo','order-descricao','order-numero',
    'order-data-inicio','order-data-termino','order-tipo-os','order-driver',
    'os-guide-severity','os-guide-stopped-block','os-guide-reserve-block'
  ])el(id);
  nodes.get('order-tipo-os').value='sinistro';
  nodes.get('order-veiculo').value='vehicle-1';
  nodes.get('order-descricao').value='SINISTRO';
  nodes.get('order-numero').value='1';
  nodes.get('order-data-inicio').value='2026-11-09';
  nodes.get('order-data-termino').value='';
  nodes.get('os-guide-severity').value='avaliacao';

  const doc={
    getElementById:id=>nodes.get(id)||null,
    querySelectorAll:()=>[],
    querySelector:()=>null,
    addEventListener(type,listener,capture=false){listeners.push({type,listener,capture:Boolean(capture)})}
  };
  const window={document:doc,crypto:require('node:crypto').webcrypto};
  vm.runInNewContext(source,{window,document:doc,Date,Math,Number,String,Boolean,JSON,RegExp});
  const guide=window.WeFrotasOsGuide;
  guide.configure({vehicles:()=>[{id:'vehicle-1',placa:'ABC1D23'}],drivers:()=>[],toast(){}});
  guide.reset();guide.startWizard();
  assert.equal(guide.wizardStep(),1);


  // Execute the real inline handler embedded in the OS form template.
  // The modal's stopPropagation occurs AFTER the button's own onclick.
  const button=app.match(/id="wf-os-step-next"[^>]+onclick="([^"]+)"/);
  assert.ok(button,'Continuar must have its own onclick handler');
  let alertText='';
  new Function('window','alert',button[1])(window,message=>{alertText=message;});
  assert.equal(alertText,'');
  assert.equal(guide.wizardStep(),2,'Direct Continuar advances before modal propagation');
  assert.ok(!listeners.some(l=>l.type==='click'&&String(l.listener).includes("data-os-step-next")),
    'No duplicate event delegation that could skip a step');
  const back=app.match(/id="wf-os-step-back"[^>]+onclick="([^"]+)"/);
  assert.ok(back,'Voltar has its own onclick');
  new Function('window','alert',back[1])(window,message=>{alertText=message;});
  assert.equal(guide.wizardStep(),1,'Direct Voltar also works');
  nodes.get('order-veiculo').value='';
  new Function('window','alert',button[1])(window,message=>{alertText=message;});
  assert.equal(guide.wizardStep(),1);
  assert.equal(nodes.get('wf-os-step-error').hidden,false,
    'Validation must show persistent error');
  assert.match(nodes.get('wf-os-step-error').textContent,/Selecione o veículo/);
});

test('Quando o módulo JS não carrega, Continuar mostra aviso explícito',()=>{
  const button=app.match(/id="wf-os-step-next"[^>]+onclick="([^"]+)"/);
  assert.ok(button);
  let message='';
  new Function('window','alert',button[1])({},m=>{message=m;});
  assert.match(message,/assistente de Sinistro não carregou/);
});
