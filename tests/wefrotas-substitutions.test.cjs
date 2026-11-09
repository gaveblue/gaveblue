'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../wefrotas/wefrotas-substitutions.js'),'utf8');

function fixture() {
  const substitution = {
    id:'sub-1',sourceVehicleId:'titular',reserveVehicleId:'reserva',
    driverId:'motorista',reason:'manutencao',startDate:'2026-11-01',
    startKm:32400,endDate:'',endKm:'',extraCost:50,notes:''
  };
  const vehicles=[
    {id:'titular',placa:'AAA-1A11',vehicleSubstitutions:[substitution],operationalStatus:'manutencao'},
    {id:'reserva',placa:'BBB-2B22'},
    {id:'terceiro',placa:'CCC-3C33'}
  ];
  const finance=[
    {id:'fuel-1',entryType:'combustivel',vehicleId:'reserva',driverId:'motorista',
      substitutionId:'sub-1',dataAbastecimento:'2026-11-02',km:32650,total:220}
  ];
  const window={WeFrotasReplacementBridge:{
    vehicles:()=>vehicles,drivers:()=>[{id:'motorista',nome:'Motorista'}],
    finance:()=>finance,netCost:entry=>Number(entry.total),toast:()=>{}
  }};
  const document={addEventListener(){}};
  vm.runInNewContext(source,{window,document,crypto:require('node:crypto').webcrypto,Intl,Date,Math},
    {filename:'wefrotas-substitutions.js'});
  return {api:window.WeFrotasSubstitutions,vehicles,finance,substitution,bridge:window.WeFrotasReplacementBridge};
}
test('roteia o abastecimento do motorista para o carro reserva no período',()=>{
  const {api}=fixture();
  assert.equal(api.currentForDriver('motorista','2026-11-02').reserveVehicleId,'reserva');
  assert.equal(api.association('reserva','motorista','2026-11-02').replacementId,'sub-1');
  assert.equal(api.association('reserva','motorista','2026-10-31').replacementId,'');
});
test('bloqueia uso incorreto do odômetro do titular, mesmo com motorista omitido',()=>{
  const {api}=fixture();
  assert.match(api.association('titular','','2026-11-02').error,/temporariamente substituído/);
});
test('apuração inclui combustível apenas uma vez e separa custos informativos',()=>{
  const {api,substitution}=fixture();
  const s=api.statistics(substitution);
  assert.equal(s.fuel.length,1);assert.equal(s.spent,220);
  assert.equal(s.extra,50);assert.equal(s.total,270);
  assert.equal(s.km,250);assert.equal(s.perKm,1.08);
});
test('exige leitura de entrega e leitura final na devolução',()=>{
  const {api,substitution}=fixture();
  assert.match(api.validate({...substitution,startKm:''}),/KM de entrega/);
  assert.match(api.validate({...substitution,endDate:'2026-11-03',endKm:''}),/KM de devolução/);
});
test('impede KM final menor que um abastecimento ocorrido antes da devolução',()=>{
  const {api,substitution}=fixture();
  assert.match(api.validate({...substitution,endDate:'2026-11-03',endKm:32600}),/KM superior/);
  assert.equal(api.validate({...substitution,endDate:'2026-11-03',endKm:32660}),'');
});
test('impede períodos simultâneos para o mesmo titular, reserva ou motorista',()=>{
  const {api}=fixture();
  const candidate={id:'sub-2',sourceVehicleId:'terceiro',reserveVehicleId:'reserva',
    driverId:'motorista',startDate:'2026-11-03',startKm:32650,endDate:'',
    endKm:'',extraCost:0,reason:'sinistro'};
  assert.match(api.validate(candidate),/sobreposta/);
});
test('não atribui abastecimentos feitos depois da devolução ao evento anterior',()=>{
  const {api,substitution,finance}=fixture();
  substitution.endDate='2026-11-03';substitution.endKm=32660;
  finance.push({id:'fuel-2',entryType:'combustivel',vehicleId:'reserva',
    driverId:'motorista',dataAbastecimento:'2026-11-04',km:32700,total:100});
  assert.equal(api.association('reserva','motorista','2026-11-04').replacementId,'');
  assert.equal(api.statistics(substitution).spent,220);
});
test('impede encerrar substituição deixando lançamento vinculado fora do período',()=>{
  const {api,substitution}=fixture();
  assert.match(api.validate({...substitution,endDate:'2026-11-01',endKm:32660}),/exclui abastecimentos/);
});

test('rejeita KM de abastecimento inferior ao KM de entrega',()=>{
  const {api}=fixture();
  assert.match(api.association('reserva','motorista','2026-11-02','',32399).error,/menor que o KM/);
  assert.equal(api.association('reserva','motorista','2026-11-02','',32400).replacementId,'sub-1');
});
test('rejeita KM de abastecimento superior ao KM de devolução',()=>{
  const {api,substitution}=fixture();
  substitution.endDate='2026-11-03';substitution.endKm=32660;
  assert.match(api.association('reserva','motorista','2026-11-03','',32661).error,/maior que o KM/);
});

test('bloqueia sobreposição cruzada: reserva não pode virar titular',()=>{
  const {api,substitution,vehicles,bridge}=fixture();
  bridge.drivers=()=>[{id:'motorista'},{id:'outro'}];
  vehicles[1].operationalStatus='disponivel';
  assert.match(api.validate({...substitution,id:'nova',sourceVehicleId:'reserva',reserveVehicleId:'terceiro',driverId:'outro'}),/sobreposta/);
});
test('rejeita datas impossíveis e recursos inativos',()=>{
  const {api,substitution,vehicles}=fixture();
  assert.match(api.validate({...substitution,startDate:'2026-02-30'}),/data de entrega válida/);
  vehicles[1].ativo=false;
  assert.match(api.validate({...substitution,id:'nova'}),/ativos/);
});
test('não permite reserva imobilizado em nova substituição',()=>{
  const {api,substitution,vehicles}=fixture();
  vehicles[1].operationalStatus='sinistro';
  assert.match(api.validate({...substitution,id:'nova'}),/não está disponível/);
});
test('não apaga associação histórica silenciosamente',()=>{
  const {api}=fixture();
  assert.match(api.association('terceiro','motorista','2026-10-01','sub-1',100).error,/já está vinculado/);
});
test('motorista omitido não pode assumir reserva em uso',()=>{
  const {api}=fixture();
  assert.match(api.association('reserva','','2026-11-02').error,/motorista/);
});
test('ID de substituição não transfere despesa de outro veículo',()=>{
  const {api,substitution,finance}=fixture();
  finance.push({...finance[0],id:'inconsistente',vehicleId:'titular',total:999});
  assert.equal(api.statistics(substitution).spent,220);
});
test('devolução não ultrapassa leitura posterior',()=>{
  const {api,substitution,finance}=fixture();
  finance.push({...finance[0],id:'posterior',substitutionId:'',dataAbastecimento:'2026-11-05',km:32700});
  assert.match(api.validate({...substitution,endDate:'2026-11-03',endKm:32701}),/leitura posterior/);
});
test('bloqueia troca dos vínculos também com abastecimento inferido',()=>{
  const {api,substitution,finance}=fixture();
  delete finance[0].substitutionId;
  assert.match(api.validate({...substitution,startKm:32300}),/trocar os vínculos/);
});
test('custo utiliza rateio líquido e inclui outras despesas identificadas sem escrever no financeiro',()=>{
  const {api,substitution,finance,bridge}=fixture();
  const before=JSON.stringify(finance);
  bridge.costRows=()=>[{entry:finance[0],total:198},{entry:{id:'service',entryType:'despesa',driverId:'motorista'},total:30},
    {entry:{id:'unrelated',entryType:'despesa',driverId:'outro'},total:999}];
  const s=api.statistics(substitution);
  assert.equal(s.spent,198);assert.equal(s.other,30);assert.equal(s.total,278);
  assert.equal(JSON.stringify(finance),before);
});

test('integração com rateio real: desconto do grupo é aplicado sem duplicar pai e filhos',()=>{
  const {api,substitution,finance,bridge}=fixture();
  finance[0].groupedIntoId='group';
  finance.push({id:'other',vehicleId:'terceiro',entryType:'combustivel',total:220,groupedIntoId:'group',dataAbastecimento:'2026-11-02'});
  finance.push({id:'group',entryType:'combustivel_agrupado',total:440,discount:44});
  const context={window:{},document:{addEventListener(){}},allFinanceEntries:finance,buildReportData(){},getReportTitleByType(){},getReportFilters(){},getFilteredReportOrders(){},getReportDateContextLabel(){},
    getFinanceNetTotal:e=>e.total-(e.discount||0),getEntryImmediateVehicleId:e=>e.vehicleId,getFinanceEntryDate:e=>e.dataAbastecimento,
    isDateWithinRange:(d,s,e)=>(!s||d>=s)&&(!e||d<=e)};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-reports-v2.js'),'utf8'),context);
  bridge.costRows=item=>context.window.WeFrotasVehicleReports.detailRows({vehicleId:item.reserveVehicleId,start:item.startDate,end:item.endDate});
  assert.equal(api.statistics(substitution).spent,198);
  assert.equal(context.window.WeFrotasVehicleReports.detailRows({}).reduce((sum,r)=>sum+r.total,0),396);
});

test('diagnóstico de risco: merge entre titulares distintos não protege reserva compartilhado',()=>{
  const context={};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-supabase-core.js'),'utf8'),context);
  const core=context.WeFrotasSupabaseCore;
  const {api,vehicles,substitution}=fixture();
  const base=core.normalizeSnapshot({vehicles:vehicles.map(v=>({...v,vehicleSubstitutions:[]}))});
  const left=core.normalizeSnapshot(base),right=core.normalizeSnapshot(base);
  left.vehicles[0].vehicleSubstitutions=[substitution];
  right.vehicles[2].vehicleSubstitutions=[{...substitution,id:'concorrente',sourceVehicleId:'terceiro'}];
  const a=core.diffSnapshots(base,left),b=core.diffSnapshots(base,right);
  assert.equal(core.deltasOverlap(a,b),false,'Known release blocker: entity-level merge misses cross-vehicle reservation');
  const merged=core.applyDelta(left,b);
  vehicles.splice(0,vehicles.length,...merged.vehicles);
  assert.match(api.validate(substitution),/sobreposta/,'business validator detects invalid merged state');
});
