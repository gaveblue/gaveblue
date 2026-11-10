'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-reserve-allocation.js'),'utf8');
const sandbox = {window:{}};
vm.runInNewContext(source,sandbox);
const api = sandbox.window.WeFrotasReserveAllocation;
function setup() {
  const vehicles = [
    {id:'titular',placa:'TOK-6F54',operationalStatus:'sinistro',
      vehicleSubstitutions:[{id:'sub-1',sourceVehicleId:'titular',reserveVehicleId:'reserva',
        driverId:'joao',reason:'sinistro',startDate:'2026-10-06',endDate:''}]},
    {id:'reserva',placa:'ABC1234'},
    {id:'outro',placa:'OUTRO'}
  ];
  const fuel = {id:'f-1',entryType:'combustivel',vehicleId:'reserva',
    driverId:'joao',dataAbastecimento:'2026-10-21',km:'9969',total:200};
  const regular = {...fuel,id:'f-2',vehicleId:'titular',km:'36993'};
  const monthly = {id:'os-mensal',vehicleId:'titular',status:'andamento',tipoOs:'mensal'};
  const incident = {id:'os-sinistro',vehicleId:'titular',status:'aberta',tipoOs:'sinistro'};
  return {vehicles,fuel,regular,monthly,incident};
}
test('abastecimento fisicamente do reserva pode alocar custo na OS mensal do titular',()=>{
  const {vehicles,fuel,monthly} = setup();
  assert.equal(api.reserveForEntry(fuel,vehicles).sourceVehicleId,'titular');
  assert.equal(api.canAllocateToOrder(fuel,monthly,vehicles),true);
  assert.equal(fuel.vehicleId,'reserva');
  assert.equal(fuel.km,'9969');
});
test('abastecimento do reserva pode alocar custo na OS do sinistro',()=>{
  const {vehicles,fuel,incident} = setup();
  assert.equal(api.canAllocateToOrder(fuel,incident,vehicles),true);
});
test('não reclassifica abastecimento fora da substituição ou com motorista divergente',()=>{
  const {vehicles,fuel,monthly} = setup();
  const old = {...fuel,dataAbastecimento:'2026-10-05'};
  const stranger = {...fuel,driverId:'motorista-diferente'};
  assert.equal(api.reserveForEntry(old,vehicles),null);
  assert.equal(api.reserveForEntry(stranger,vehicles),null);
  assert.equal(api.canAllocateToOrder(old,monthly,vehicles),false);
});
test('não transfere despesa a OS estranha nem OS fechada/cancelada',()=>{
  const {vehicles,fuel,monthly} = setup();
  assert.equal(api.canAllocateToOrder(fuel,{...monthly,vehicleId:'outro'},vehicles),false);
  assert.equal(api.canAllocateToOrder(fuel,{...monthly,status:'fechada'},vehicles),false);
  assert.equal(api.canAllocateToOrder(fuel,{...monthly,status:'cancelada'},vehicles),false);
});
test('impressão distingue reservas reais dos abastecimentos do próprio titular',()=>{
  const {vehicles,fuel,regular,monthly} = setup();
  assert.match(api.printReserveLabel(fuel,monthly,vehicles),/VEÍCULO RESERVA.*ABC1234/);
  assert.equal(api.printReserveLabel(regular,monthly,vehicles),'');
  assert.equal(api.isSinistroOnOrder(monthly,[fuel],vehicles),true);
});
test('vínculos conflitantes não são assumidos pela placa nem apenas pelo KM',()=>{
  const {vehicles,fuel,monthly} = setup();
  assert.equal(api.reserveForEntry({...fuel,substitutionId:'invalida'},vehicles),null);
  assert.equal(api.reserveForEntry({...fuel,replacedVehicleId:'outro'},vehicles),null);
  assert.equal(api.canAllocateToOrder({...fuel,vehicleId:'outro'},monthly,vehicles),false);
});
test('agrupamento com abastecimentos mistos não transfere todos como reserva',()=>{
  const {vehicles,fuel,regular,monthly} = setup();
  const group={entryType:'combustivel_agrupado',vehicleId:'reserva'};
  assert.equal(api.canAllocateToOrder(group,monthly,vehicles,[fuel,regular]),false);
  assert.match(api.printReserveLabel(group,monthly,vehicles,[fuel,regular]),/ABC1234/);
});
test('script principal carrega o módulo e imprime a observação em visualização, lote e individual',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../wefrotas/index.html'),'utf8');
  const main=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas.js'),'utf8');
  assert.ok(html.indexOf('wefrotas-reserve-allocation.js')>=0);
  assert.ok(html.indexOf('wefrotas-reserve-allocation.js')<html.indexOf('wefrotas.js?v'));
  assert.equal((main.match(/getOrderSinistroPrintNotice\(order, entries\)/g)||[]).length>=4,true);
  assert.match(main,/String\(entry\.vehicleId \|\| ''\) === String\(order\.vehicleId\)/);
});
