'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-os-guided.js'),'utf8');

function fixture() {
  const nodes = new Map(), listeners = {}, radio = {};
  function node(id,v='') {
    const result={id,value:v,hidden:false,disabled:false,innerHTML:'',textContent:'',
      dataset:{},style:{},focus(){this.focused=true;},scrollIntoView(){},
      setAttribute(name,val){this[name]=val;},removeAttribute(name){delete this[name];},
      insertAdjacentHTML(){},querySelector(){return null;},closest(){return null;}};
    nodes.set(id,result);return result;
  }
  for(const id of [
    'os-operational-guide','os-guide-severity-block','os-guide-stopped-block','os-guide-pt-alert',
    'os-guide-reserve-block','os-guide-detail','os-guide-linked','os-guide-summary',
    'os-guide-start','os-guide-origin','os-guide-vehicle','os-guide-km','os-guide-created',
    'os-guide-closure','os-guide-back-block','os-guide-return-block','os-guide-return-detail',
    'os-guide-return-date','os-guide-return-km','os-guide-insurer','os-guide-protocol','os-guide-bo',
    'wf-os-step-header','wf-os-step-actions','wf-os-step-data','wf-os-step-occurrence',
    'wf-os-step-review','wf-os-step-back','wf-os-step-next','wf-os-step-error','modal-submit-btn',
    'modal-fields','order-numero','order-descricao'
  ])node(id);
  node('order-tipo-os','avulsa');node('order-veiculo','a');node('order-driver','d1');
  node('order-status','aberta');node('order-data-inicio','2026-11-01');
  node('order-data-termino','2026-11-30');node('os-guide-severity','avaliacao');
  nodes.get('os-guide-origin').value='frota';
  nodes.get('os-guide-start').value='2026-11-01';
  nodes.get('os-guide-km').value='1000';
  nodes.get('order-numero').value='0042';
  nodes.get('order-descricao').value='Descrição informada';
  for(const [name,vals] of Object.entries({
    'os-guide-stopped':['sim','nao'],'os-guide-reserve':['sim','nao'],
    'os-guide-back':['sim','nao'],'os-guide-return':['sim','nao']
  }))radio[name]=vals.map(value=>({name,value,checked:false,disabled:false}));
  const doc={
    body:{appendChild(){}},
    getElementById:id=>nodes.get(id)||null,
    querySelector:sel=>{
      const m=sel.match(/input\[name="([^"]+)"\]:checked/);
      return m?radio[m[1]]?.find(x=>x.checked)||null:null;
    },
    querySelectorAll:sel=>{
      const m=sel.match(/input\[name="([^"]+)"\]/);
      return m?radio[m[1]]||[]:[];
    },
    addEventListener:(name,fn)=>{(listeners[name] ||= []).push(fn);}
  };
  const vehicles=[
    {id:'a',placa:'ABC1D23',operationalStatus:'disponivel',ativo:true,vehicleSubstitutions:[]},
    {id:'b',placa:'XYZ9876',operationalStatus:'disponivel',ativo:true},
    {id:'c',placa:'CCC1234',operationalStatus:'disponivel',ativo:true}
  ];
  const drivers=[{id:'d1',nome:'João',ativo:true}];
  const win={document:doc,crypto:require('node:crypto').webcrypto};
  vm.runInNewContext(source,{window:win,document:doc,Date,Math,Number,String,Boolean,JSON,RegExp},
    {filename:'wefrotas-os-guided.js'});
  const api=win.WeFrotasOsGuide,notifications=[];
  api.configure({vehicles:()=>vehicles,drivers:()=>drivers,toast:msg=>notifications.push(msg)});
  const set=(id,val)=>{nodes.get(id).value=val;};
  const check=(name,val)=>{radio[name].forEach(el=>{el.checked=el.value===val;});};
  const change=(id)=>listeners.change.forEach(fn=>fn({
    target:{id,closest:()=>id.startsWith('os-guide-')?{}:null}
  }));
  const click=(selector)=>listeners.click.forEach(fn=>fn({
    target:{closest:q=>q===selector?{}:null},preventDefault(){}
  }));
  return {api,nodes,vehicles,drivers,set,check,change,click,notifications};
}

test('Sinistro mantém as perguntas de gravidade, parada e carro reserva',()=>{
 const {api}=fixture(),html=api.formHtml();
 for(const term of ['Situação do sinistro','Perda total confirmada','Este veículo ficará parado?',
   'O motorista utilizará um carro reserva?','Locadora','Oficina / concessionária',
   'Seguradora','KM do carro reserva'])assert.ok(html.includes(term),term);
});

for(const type of ['avulsa','mensal','revisao','pane']) {
 test('OS '+type+' é formulário normal de uma etapa sem exigência de reserva',()=>{
   const {api,set,nodes}=fixture();
   set('order-tipo-os',type);api.reset();api.startWizard();
   assert.equal(nodes.get('wf-os-step-header').hidden,true);
   assert.equal(nodes.get('wf-os-step-actions').hidden,true);
   assert.equal(nodes.get('wf-os-step-data').hidden,false);
   assert.equal(nodes.get('wf-os-step-occurrence').hidden,true);
   assert.equal(nodes.get('wf-os-step-review').hidden,true);
   assert.equal(nodes.get('modal-submit-btn').disabled,false);
   assert.equal(nodes.get('modal-submit-btn').hidden,false);
   assert.equal(api.collect().enabled,false);
   assert.equal(api.nextWizard(),false);
 });
}

test('OS mensal salva normalmente sem exigir descrição de ocorrência',()=>{
 const {api,set,nodes}=fixture();set('order-tipo-os','mensal');
 set('order-descricao','Controle de despesas');api.startWizard();
 assert.equal(nodes.get('modal-submit-btn').style.display,'inline-flex');
 assert.equal(api.wizardStep(),1);
});

test('Ao trocar Sinistro por OS Avulsa o formulário simples é restaurado',()=>{
 const {api,set,change,nodes}=fixture();
 set('order-tipo-os','sinistro');api.startWizard();
 assert.equal(nodes.get('wf-os-step-header').hidden,false);
 assert.equal(nodes.get('modal-submit-btn').hidden,true);
 set('order-tipo-os','avulsa');change('order-tipo-os');
 assert.equal(nodes.get('wf-os-step-header').hidden,true);
 assert.equal(nodes.get('wf-os-step-actions').hidden,true);
 assert.equal(nodes.get('modal-submit-btn').disabled,false);
 assert.equal(nodes.get('wf-os-step-data').hidden,false);
});

test('Sinistro exibe erro fixo e destaca campo quando não há veículo',()=>{
 const {api,set,nodes,notifications}=fixture();
 set('order-tipo-os','sinistro');set('order-veiculo','');api.startWizard();
 assert.equal(api.nextWizard(),false);
 assert.equal(api.wizardStep(),1);
 assert.equal(nodes.get('wf-os-step-error').hidden,false);
 assert.match(nodes.get('wf-os-step-error').textContent,/Selecione o veículo/);
 assert.equal(nodes.get('order-veiculo')['aria-invalid'],'true');
 assert.equal(nodes.get('order-veiculo').focused,true);
 assert.ok(notifications.length>0);
});

test('Sinistro exibe erro específico para descrição vazia',()=>{
 const {api,set,nodes}=fixture();set('order-tipo-os','sinistro');set('order-descricao','');
 api.startWizard();assert.equal(api.nextWizard(),false);
 assert.match(nodes.get('wf-os-step-error').textContent,/descrição/);
 assert.equal(nodes.get('order-descricao').focused,true);
});

test('Sinistro avança pelas três etapas e botão Continuar funciona',()=>{
 const {api,set,check,nodes,click}=fixture();
 set('order-tipo-os','sinistro');api.startWizard();
 assert.equal(nodes.get('modal-submit-btn').disabled,true);
 api.handleWizardAction('next');
 assert.equal(api.wizardStep(),2);
 check('os-guide-stopped','nao');
 api.handleWizardAction('next');
 assert.equal(api.wizardStep(),3);
 assert.equal(nodes.get('modal-submit-btn').disabled,false);
 assert.ok(nodes.get('wf-os-step-review').innerHTML.includes('Confira antes de salvar'));
 api.handleWizardAction('back');
 assert.equal(api.wizardStep(),2);
});

test('Sinistro não avança sem responder se o veículo ficará parado',()=>{
 const {api,set,nodes}=fixture();
 set('order-tipo-os','sinistro');api.startWizard();assert.equal(api.nextWizard(),true);
 assert.equal(api.nextWizard(),false);
 assert.match(nodes.get('wf-os-step-error').textContent,/ficará parado/);
 assert.equal(api.wizardStep(),2);
});

test('Sinistro leve sem parada não altera odômetros',()=>{
 const {api,set,check,vehicles}=fixture();set('order-tipo-os','sinistro');
 set('os-guide-severity','leve');check('os-guide-stopped','nao');
 api.refresh();const before=JSON.stringify(vehicles),plan=api.collect();
 assert.equal(plan.incident.stopped,false);
 assert.equal(plan.incident.perdaTotalConfirmada,false);
 assert.equal(plan.record,undefined);assert.equal(JSON.stringify(vehicles),before);
});

test('Sinistro de perda total não reativa o titular nem exige reserva',()=>{
 const {api,set,check}=fixture();set('order-tipo-os','sinistro');
 set('os-guide-severity','pt');check('os-guide-reserve','nao');
 api.refresh();const plan=api.collect();
 assert.equal(plan.incident.stopped,true);
 assert.equal(plan.incident.perdaTotalConfirmada,true);
 assert.equal(plan.incident.reserveStatus,'pendente');
});

test('Sinistro com reserva existente gera vínculo e KM próprio',()=>{
 const {api,set,check}=fixture();set('order-tipo-os','sinistro');
 set('os-guide-severity','avaliacao');check('os-guide-stopped','sim');
 check('os-guide-reserve','sim');set('os-guide-vehicle','b');set('os-guide-origin','oficina');
 set('os-guide-km','1200');api.refresh();
 const plan=api.collect();
 assert.equal(plan.record.reserveVehicleId,'b');
 assert.equal(plan.record.driverId,'d1');
 assert.equal(plan.record.startKm,1200);
 assert.equal(plan.record.reason,'sinistro');
 assert.equal(plan.incident.origin,'oficina');
});

test('Sinistro com reserva rejeita KM inválido e autoassociação',()=>{
 const {api,set,check}=fixture();set('order-tipo-os','sinistro');
 check('os-guide-stopped','sim');check('os-guide-reserve','sim');
 set('os-guide-vehicle','b');set('os-guide-km','1.5');
 assert.throws(()=>api.collect(),/KM inteiro/);
 set('os-guide-km','1000');set('os-guide-vehicle','a');
 assert.throws(()=>api.collect(),/próprio/);
});

test('Edição histórica de OS simples não cria incidente automaticamente',()=>{
 const {api,set}=fixture();set('order-tipo-os','pane');
 api.loadOrder({id:'legacy',vehicleId:'a',tipoOs:'pane',status:'aberta'});
 assert.equal(api.collect().enabled,false);
});

test('Sinistro com reserva pendente pode vinculá-lo posteriormente',()=>{
 const {api,set,check}=fixture();set('order-tipo-os','sinistro');
 api.loadOrder({id:'prior',vehicleId:'a',tipoOs:'sinistro',status:'aberta',
  operationalIncident:{kind:'sinistro',severity:'avaliacao',stopped:true,
   reserveRequested:false,reserveStatus:'pendente'}});
 check('os-guide-reserve','sim');set('os-guide-vehicle','b');set('os-guide-km','1500');
 const plan=api.collect();
 assert.ok(plan.record.id);assert.equal(plan.record.reserveVehicleId,'b');
});

test('Encerrar OS Sinistro vinculada exige devolução explícita e KM final',()=>{
 const {api,set,check,vehicles}=fixture();
 vehicles[0].vehicleSubstitutions.push({
  id:'hist',sourceVehicleId:'a',reserveVehicleId:'b',driverId:'d1',
  reason:'sinistro',startDate:'2026-11-01',startKm:1000,endDate:'',endKm:''
 });
 set('order-tipo-os','sinistro');
 api.loadOrder({id:'prior',vehicleId:'a',tipoOs:'sinistro',status:'aberta',
  operationalIncident:{kind:'sinistro',severity:'avaliacao',stopped:true,
    reserveRequested:true,substitutionId:'hist',reserveVehicleId:'b'}});
 set('order-status','fechada');api.refresh();
 assert.throws(()=>api.collect(),/voltou a operar/);
 check('os-guide-back','sim');assert.throws(()=>api.collect(),/foi devolvido/);
 check('os-guide-return','sim');set('os-guide-return-date','2026-11-06');
 assert.throws(()=>api.collect(),/KM final/);
 set('os-guide-return-km','1360');
 const plan=api.collect();
 assert.equal(plan.closure.titularBack,true);
 assert.equal(plan.closure.reserveReturned,true);
 assert.equal(plan.incident.reserveStatus,'devolvido');
});

test('Rascunhos reiniciam corretamente entre novas OS',()=>{
 const {api,set,check}=fixture();set('order-tipo-os','sinistro');
 check('os-guide-stopped','sim');check('os-guide-reserve','nao');
 api.reset();const first=api.draftOrderId();
 api.reset();const second=api.draftOrderId();
 assert.notEqual(first,second);
});
