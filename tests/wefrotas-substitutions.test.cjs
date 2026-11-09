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
  return {api:window.WeFrotasSubstitutions,vehicles,finance,substitution};
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
