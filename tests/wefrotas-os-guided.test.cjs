'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-os-guided.js'),'utf8');

function setup() {
 const nodes=new Map();
 const radio={};
 const listeners={};
 const element=(id,v='')=>{
  const result={id,value:v,hidden:false,disabled:false,innerHTML:'',textContent:'',
   insertAdjacentHTML(){},focus(){}};
  nodes.set(id,result);return result;
 };
 for(const id of ['os-operational-guide','os-guide-severity-block','os-guide-stopped-block',
 'os-guide-pt-alert','os-guide-reserve-block','os-guide-detail','os-guide-linked',
 'os-guide-summary','os-guide-start','os-guide-origin','os-guide-vehicle',
 'os-guide-km','os-guide-created','os-guide-closure','os-guide-back-block',
 'os-guide-return-block','os-guide-return-detail','os-guide-return-date','os-guide-return-km',
 'os-guide-insurer','os-guide-protocol','os-guide-bo'])element(id,'');
 element('order-tipo-os','avulsa');element('order-veiculo','a');element('order-driver','d1');
 element('order-status','aberta');element('order-data-inicio','2026-11-01');
 element('order-data-termino','2026-11-30');
 element('os-guide-severity','avaliacao');
 element('os-guide-origin','frota');element('os-guide-km','1000');
 element('os-guide-start','2026-11-01');
 for(const [name,values] of Object.entries({
  'os-guide-stopped':['sim','nao'],'os-guide-reserve':['sim','nao'],
  'os-guide-back':['sim','nao'],'os-guide-return':['sim','nao']
 }))radio[name]=values.map(value=>({name,value,checked:false,disabled:false}));
 const document={
  body:{appendChild(){}},getElementById:id=>nodes.get(id)||null,
  querySelector:selector=>{
   const match=selector.match(/input\[name="([^"]+)"\]:checked/);
   return match?radio[match[1]]?.find(x=>x.checked)||null:null;
  },
  querySelectorAll:selector=>{
   const match=selector.match(/input\[name="([^"]+)"\]/);
   return match?radio[match[1]]||[]:[];
  },
  addEventListener(name,fn){(listeners[name] ||= []).push(fn);}
 };
 const vehicles=[
  {id:'a',placa:'ABC1D23',ativo:true,operationalStatus:'disponivel',vehicleSubstitutions:[]},
  {id:'b',placa:'XYZ9876',ativo:true,operationalStatus:'disponivel'},
  {id:'c',placa:'CCC4567',ativo:true,operationalStatus:'disponivel'}
 ];
 const drivers=[{id:'d1',nome:'Motorista 1',ativo:true}];
 const window={document,crypto:require('node:crypto').webcrypto};
 vm.runInNewContext(source,{window,document,Date,Math,Number,String,Boolean,JSON,RegExp},{filename:'wefrotas-os-guided.js'});
 const api=window.WeFrotasOsGuide;
 const notices=[];
 api.configure({vehicles:()=>vehicles,drivers:()=>drivers,toast:t=>notices.push(t)});
 const set=(id,v)=>{nodes.get(id).value=v};
 const check=(name,value)=>{radio[name].forEach(r=>{r.checked=r.value===value})};
 const event=(id)=>listeners.change.forEach(fn=>fn({target:{id,closest:()=>id.startsWith('os-guide-')?{}:null}}));
 return {api,vehicles,drivers,set,check,event,nodes,radio,notices};
}
test('formulário apresenta os motivos de sinistro, perguntas e cadastro temporário',()=>{
 const {api}=setup(),html=api.formHtml();
 for(const phrase of ['Situação do sinistro','Perda total confirmada',
   'Este veículo ficará parado?','O motorista utilizará um carro reserva?',
   'Locadora','Oficina / concessionária','Seguradora','KM do carro reserva',
   'O veículo titular voltou a operar?','O carro reserva já foi devolvido?'])assert.ok(html.includes(phrase),phrase);
});
test('OS avulsa tradicional não obriga reserva',()=>{
 const {api}=setup();api.reset();api.refresh();
 const plan=api.collect();assert.equal(plan.incident.stopped,false);
 assert.equal(plan.record,undefined);assert.equal(plan.incident.reserveStatus,'nao_necessario');
});
test('sinistro leve sem parada mantém o veículo em operação',()=>{
 const {api,set,check}=setup();api.reset();set('order-tipo-os','sinistro');
 set('os-guide-severity','leve');check('os-guide-stopped','nao');
 api.refresh();const p=api.collect();assert.equal(p.incident.stopped,false);
 assert.equal(p.incident.perdaTotalConfirmada,false);assert.equal(p.record,undefined);
});
test('sinistro com perda total fica indisponível, sem exigir reserva',()=>{
 const {api,set,check}=setup();api.reset();set('order-tipo-os','sinistro');
 set('os-guide-severity','pt');check('os-guide-reserve','nao');
 api.refresh();const p=api.collect();assert.equal(p.incident.stopped,true);
 assert.equal(p.incident.perdaTotalConfirmada,true);assert.equal(p.incident.reserveStatus,'pendente');
});
test('sinistro sem resposta sobre parada bloqueia o cadastro',()=>{
 const {api,set}=setup();api.reset();set('order-tipo-os','sinistro');
 assert.throws(()=>api.collect(),/ficará parado/);
});
test('pane abre com parada e reserva pendente até decisão explícita',()=>{
 const {api,set}=setup();api.reset();set('order-tipo-os','pane');api.refresh();
 assert.throws(()=>api.collect(),/carro reserva/);
});
test('pane com reserva existente produz vínculo sem alterar odômetros',()=>{
 const {api,set,check,vehicles}=setup();api.reset();set('order-tipo-os','pane');api.refresh();
 check('os-guide-stopped','sim');check('os-guide-reserve','sim');
 set('os-guide-vehicle','b');set('os-guide-origin','oficina');set('os-guide-km','1200');
 const before=JSON.stringify(vehicles);
 const p=api.collect();assert.equal(p.record.reserveVehicleId,'b');assert.equal(p.record.driverId,'d1');
 assert.equal(p.record.startKm,1200);assert.equal(p.record.reason,'manutencao');
 assert.equal(p.incident.origin,'oficina');assert.equal(p.reserveVehicle,null);
 assert.equal(JSON.stringify(vehicles),before);
});
test('reserva não pode ter KM inicial inválido',()=>{
 const {api,set,check}=setup();api.reset();set('order-tipo-os','pane');api.refresh();
 check('os-guide-reserve','sim');set('os-guide-vehicle','b');set('os-guide-km','1.5');
 assert.throws(()=>api.collect(),/KM inteiro/);
});
test('reserva não pode ser o próprio titular',()=>{
 const {api,set,check}=setup();api.reset();set('order-tipo-os','pane');api.refresh();
 check('os-guide-reserve','sim');set('os-guide-vehicle','a');
 assert.throws(()=>api.collect(),/próprio/);
});
test('edição de OS histórica sem ocorrência não cria novos dados automaticamente',()=>{
 const {api,set}=setup();api.reset();set('order-tipo-os','sinistro');
 api.loadOrder({id:'old',vehicleId:'a',tipoOs:'sinistro',status:'aberta'});
 assert.equal(api.collect().enabled,false);
});
test('OS com reserva pendente permite vincular posteriormente',()=>{
 const {api,set,check}=setup();api.reset();set('order-tipo-os','pane');
 api.loadOrder({id:'old',vehicleId:'a',tipoOs:'pane',status:'aberta',
  operationalIncident:{kind:'pane',stopped:true,reserveRequested:false,reserveStatus:'pendente'}});
 check('os-guide-reserve','sim');set('os-guide-vehicle','b');set('os-guide-km','1500');
 const p=api.collect();assert.ok(p.record.id);assert.equal(p.record.reserveVehicleId,'b');
});
test('encerramento de OS com reserva exige retorno explícito e KM',()=>{
 const {api,set,check,vehicles}=setup();
 vehicles[0].vehicleSubstitutions.push({
  id:'hist',sourceVehicleId:'a',reserveVehicleId:'b',driverId:'d1',reason:'manutencao',
  startDate:'2026-11-01',startKm:1000,endDate:'',endKm:''
 });
 set('order-tipo-os','pane');
 api.loadOrder({id:'old',vehicleId:'a',tipoOs:'pane',status:'aberta',
  operationalIncident:{kind:'pane',stopped:true,reserveRequested:true,substitutionId:'hist',
   reserveVehicleId:'b',startDate:'2026-11-01',startKm:1000}});
 set('order-status','fechada');api.refresh();
 assert.throws(()=>api.collect(),/voltou a operar/);
 check('os-guide-back','sim');assert.throws(()=>api.collect(),/foi devolvido/);
 check('os-guide-return','sim');set('os-guide-return-date','2026-11-06');
 assert.throws(()=>api.collect(),/KM final/);
 set('os-guide-return-km','1360');const plan=api.collect();
 assert.equal(plan.closure.titularBack,true);assert.equal(plan.closure.reserveReturned,true);
 assert.equal(plan.closure.returnKm,1360);
 assert.equal(plan.incident.reserveStatus,'devolvido');
});
test('OS de perda total não oferece retorno automático do titular',()=>{
 const {api,set,check,vehicles}=setup();
 vehicles[0].vehicleSubstitutions.push({id:'pt-1',sourceVehicleId:'a',reserveVehicleId:'b',
  driverId:'d1',reason:'sinistro',startDate:'2026-11-01',startKm:1000,endDate:'',endKm:''});
 set('order-tipo-os','sinistro');api.loadOrder({id:'pt-os',vehicleId:'a',tipoOs:'sinistro',status:'aberta',
  operationalIncident:{kind:'sinistro',severity:'pt',stopped:true,perdaTotalConfirmada:true,
   substitutionId:'pt-1',reserveRequested:true,reserveVehicleId:'b'}});
 set('order-status','fechada');api.refresh();check('os-guide-return','nao');
 const plan=api.collect();assert.equal(plan.closure.titularBack,false);
});
