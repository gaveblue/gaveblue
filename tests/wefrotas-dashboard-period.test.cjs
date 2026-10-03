const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../wefrotas/wefrotas.js'), 'utf8');
function fn(name, next) { return src.slice(src.indexOf(`    function ${name}(`), src.indexOf(`    function ${next}(`)); }
function setup(source = 'monthly', start = '2026-10-01', end = '2026-10-31') {
  const fields = { 'home-monthly-cost-filter': {value:'2026-10'}, 'order-filter-start':{value:start}, 'order-filter-end':{value:end} };
  const orders = [
    {id:'old',vehicleId:'v',dataInicio:'2026-09-30'},
    {id:'first',vehicleId:'v',dataInicio:'2026-10-01'},
    {id:'last',vehicleId:'v',dataInicio:'2026-10-31'},
    {id:'future',vehicleId:'v',dataInicio:'2026-11-01'},
    {id:'other',vehicleId:'w',dataInicio:'2026-10-15'},
    {id:'empty',vehicleId:'v',dataInicio:'2026-10-15'},
    {id:'fallback',vehicleId:'v',dataTermino:'2026-10-12'}
  ];
  const entries = orders.filter(o=>o.id!=='empty').map(o=>({orderId:o.id,fuel:o.id!=='last'}));
  const c = vm.createContext({ allOrders:orders, allVehicles:[{id:'v'}], allFinanceEntries:entries,
    orderVehicleFilterId:'v', orderDashboardCostSource:source,
    document:{getElementById:id=>fields[id]}, normalizeSearchText:x=>x,
    getContextualModuleSearchValue:()=>'', sortOrders:x=>x,
    isDistributedCostEntry:e=>!e.groupedIntoId,
    isDistributedFuelCostEntry:e=>!e.groupedIntoId&&e.fuel,
    getFinanceEntryDate:()=>'',
    getCurrentMonthKey:()=> '2026-10',
    getHomeCostPerKmFilters:()=>({start,end}),
    openModuleFromHome:()=>{}, setFilterValue:(id,value)=>{fields[id]={value};},
    renderModuleCompactFilterControls:()=>{}, updateContextualSearchUi:()=>{},
    selectedOrders:new Set(), renderOrders:()=>{} });
  for (const [a,b] of [['getEntryLinkedOrder','getEntryLinkedVehicleId'],['getEntryLinkedVehicleId','getEntryImmediateVehicleId'],['getOrderCompetenceDate','getFinanceEntryCompetenceDate'],['getFinanceEntryCompetenceDate','isFinanceEntryInsideCompetencePeriod'],['isFinanceEntryInsideCompetencePeriod','getVehicleDistributedCostTotal'],['getMonthRange','openMonthlyVehicleCostReport'],['openOrdersForVehicle','openOrderFromHome'],['getFilteredOrders','getOrderSortValue']]) vm.runInContext(fn(a,b),c);
  return {c,fields};
}
test('monthly click carries vehicle and selected month',()=>{
  const {c,fields}=setup(); c.openOrdersForVehicle('v','monthly');
  assert.equal(fields['order-filter-start'].value,'2026-10-01');
  assert.equal(fields['order-filter-end'].value,'2026-10-31');
  assert.deepEqual(Array.from(c.getFilteredOrders(),o=>o.id),['first','last','fallback']);
});
test('KM click limits orders to contributing fuel, not other expenses',()=>{
  const {c}=setup('km'); c.openOrdersForVehicle('v','km');
  assert.deepEqual(Array.from(c.getFilteredOrders(),o=>o.id),['first','fallback']);
});
test('all-history KM keeps history intentionally but excludes other vehicles and empty OS',()=>{
  const {c}=setup('km','',''); c.openOrdersForVehicle('v','km');
  assert.deepEqual(Array.from(c.getFilteredOrders(),o=>o.id),['old','first','future','fallback']);
});
test('ordinary vehicle shortcut removes dashboard restriction',()=>{
  const {c,fields}=setup(); c.openOrdersForVehicle('v');
  assert.equal(c.orderDashboardCostSource,''); assert.equal(fields['order-filter-start'].value,'');
  assert.equal(c.getFilteredOrders().length,6);
});
test('both chart links carry source explicitly',()=>{
  assert.match(src,/openOrdersForVehicle\('\$\{vehicle.id\}', 'monthly'\)/);
  assert.match(src,/openOrdersForVehicle\('\$\{item.vehicleId\}', 'km'\)/);
});
