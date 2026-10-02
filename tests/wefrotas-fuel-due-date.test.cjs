const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../wefrotas/wefrotas.js'),'utf8');
function block(name){const start=source.indexOf('    function '+name+'(');assert.ok(start>=0);const tail=source.slice(start+8).search(/\n    (?:async )?function /);return source.slice(start,start+8+tail);}
const c=vm.createContext({allFinanceEntries:[],getEntryLinkedVehicleId:e=>e.vehicleId,isDateWithinRange:(d,a,b)=>!!d&&(!a||d>=a)&&(!b||d<=b)});
for(const name of ['isFuelEntry','isFuelGroupEntry','isExpenseGroupEntry','isFinanceGroupEntry','normalizeDateForFilter','getFinanceEntryDate','getFinancePaymentDate','getFinanceEntryDateLabel','getReportFinanceEntries'])vm.runInContext(block(name),c);
const fuel={id:'test',entryType:'combustivel',dataAbastecimento:'2026-09-18',dataVencimento:'2026-10-15',closedExpense:true,orderId:'os-test'};
test('individual closed fuel uses due date for finance',()=>assert.equal(c.getFinancePaymentDate(fuel),'2026-10-15'));
test('fuel chronology remains occurrence date',()=>assert.equal(c.getFinanceEntryDate(fuel),'2026-09-18'));
test('individual closed fuel date caption is due date',()=>assert.equal(c.getFinanceEntryDateLabel(fuel),'Vencimento'));
test('closed fuel without due date does not invent a maturity date',()=>assert.equal(c.getFinancePaymentDate({...fuel,dataVencimento:''}),''));
test('pending fuel retains occurrence date before expense closure',()=>{const e={...fuel,dataVencimento:'',closedExpense:false,orderId:''};assert.equal(c.getFinancePaymentDate(e),'2026-09-18');assert.equal(c.getFinanceEntryDateLabel(e),'Abastecimento');});
for(const entryType of ['combustivel_agrupado','despesa_agrupada','despesa'])test(`${entryType} remains unchanged`,()=>{const e={entryType,dataVencimento:'2026-10-20',createdAt:'2026-09-01'};assert.equal(c.getFinancePaymentDate(e),c.getFinanceEntryDate(e));});
test('group child retains occurrence chronology',()=>assert.equal(c.getFinancePaymentDate({...fuel,groupedIntoId:'group'}),'2026-09-18'));
for(const type of ['finance_status','supplier_ranking'])test(`${type} includes October maturity, excludes September occurrence`,()=>{c.allFinanceEntries=[fuel];assert.equal(c.getReportFinanceEntries({type,start:'2026-10-01',end:'2026-10-31'}).length,1);assert.equal(c.getReportFinanceEntries({type,start:'2026-09-01',end:'2026-09-30'}).length,0);});
for(const type of ['fuel_register','fuel_liters_per_km','cost'])test(`${type} retains September consumption`,()=>{c.allFinanceEntries=[fuel];assert.equal(c.getReportFinanceEntries({type,start:'2026-09-01',end:'2026-09-30'}).length,1);});
test('view, PDF and print use financial date without modifying records',()=>{for(const name of ['renderFinance','buildOrderViewerHtml','buildPrintableOrderPageHtml','printSelectedOrder'])assert.match(block(name),/getFinancePaymentDate\(entry\)/);const before=JSON.stringify(fuel);c.getFinancePaymentDate(fuel);assert.equal(JSON.stringify(fuel),before);});
