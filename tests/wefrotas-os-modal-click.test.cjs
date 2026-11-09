'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-os-guided.js'),'utf8');

test('clicar Continuar dentro do modal avança mesmo que o backdrop dê stopPropagation()',()=>{
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

  const e={
    target:{closest:selector=>selector==='[data-os-step-next]'?{}:null},
    defaultPrevented:false,
    propagationStopped:false,
    preventDefault(){this.defaultPrevented=true},
    stopPropagation(){this.propagationStopped=true}
  };
  // In the actual page: document capture -> modal-backdrop onclick handler
  // calls stopPropagation -> document bubble never receives the event.
  for(const {type,listener,capture} of listeners)if(type==='click'&&capture)listener(e);
  e.stopPropagation(); // existing inline handleModalBackdrop(event)
  if(!e.propagationStopped){
    for(const {type,listener,capture} of listeners)if(type==='click'&&!capture)listener(e);
  }
  assert.equal(e.defaultPrevented,true,'Continuar must handle the click');
  assert.equal(guide.wizardStep(),2,'Continuar must advance to incident questions');
});
