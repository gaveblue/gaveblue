const {chromium}=require('../../central-audit-build-tools/node_modules/playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),main=fs.readFileSync(path.join(root,'wefrotas/wefrotas.js'),'utf8'),html=fs.readFileSync(path.join(root,'wefrotas/index.html'),'utf8');
function fn(name){const start=main.indexOf('    function '+name+'('),end=main.slice(start+8).search(/\n    (?:async )?function /);return main.slice(start,start+8+end);}
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{for(const width of [1280,375]){
const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.abort());
const section=html.slice(html.indexOf('<section id="panel-veiculos"'),html.indexOf('<section id="panel-motoristas"'));
await page.setContent('<style>body{margin:0;padding:12px}#panel-veiculos{display:block}</style>'+section+'<div class="module-compact-date-range"><input id="report-filter-start" type="hidden"><input id="report-filter-end" type="hidden"><button id="module-compact-date-button-relatorios">Período</button></div>');
for(const file of ['wefrotas.css','wefrotas-vehicle-profile.css','wefrotas-vehicle-list.css'])await page.addStyleTag({path:path.join(root,'wefrotas',file)});
await page.addScriptTag({content:`
var allVehicles=Array.from({length:26},(_,i)=>({id:'v'+i,placa:'TEST-'+i,numeroFrota:String(i),modelo:'Modelo '+i,ativo:true}));
var allOrders=[],allDrivers=[],allFinanceEntries=allVehicles.flatMap((v,i)=>[{id:v.id+'a',vehicleId:v.id,total:100,km:1000,litros:10,entryType:'combustivel',data:'2026-09-01'},{id:v.id+'b',vehicleId:v.id,total:100,km:1100,litros:10,entryType:'combustivel',data:'2026-10-01'}]);
var selectedVehicles=new Set(),vehicleSortState={key:'fleet',direction:'asc'};
function escapeHtml(v){return String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');}
function formatDate(v){return v;}function formatCurrency(n){return 'R$ '+Number(n).toFixed(2);}
function isEntityActive(v){return v.ativo!==false;}function getVehicleCurrentKm(){return 1100;}
function getVisibleVehicles(){const q=document.getElementById('vehicle-filter-search').value;return allVehicles.filter(v=>v.placa.includes(q));}
function getFinanceNetTotal(e){return e.total;}function getFinanceEntryDate(e){return e.data;}
function getEntryImmediateVehicleId(e){return e.vehicleId;}function parseDecimalInputValue(v){return Number(v);}
function isFuelEntry(e){return e.entryType==='combustivel';}
function isArlaEntry(e){return /arla/i.test(e.fuelType||'');}
function isDateWithinRange(d,s,e){return (!s||d>=s)&&(!e||d<=e);}
function buildReportData(){}function getReportTitleByType(){}function getReportFilters(){return {};}function getFilteredReportOrders(){return [];}function getReportDateContextLabel(){}
function pruneSelections(){}function updateButtonState(){}function updateEntityListViewport(){}function updateSimpleSortIndicators(){}function renderModuleCompactFilterControls(){}
function requireWefrotasPermission(){return true;}function showToast(){}
function toggleVehicleSort(key){vehicleSortState={key,direction:'desc'};renderVehicles();}
window.WeFrotasVehicleProfile={photoSource:()=>'',open:id=>window.openedVehicle=id};
function renderVehicles(){window.WeFrotasVehicleList.render();}
`});
for(const name of ['updateVehicleSelectionUI','toggleVehicleSelection','toggleSelectAllVehicles','handleVehicleRowSelectionKey'])await page.addScriptTag({content:fn(name)});
for(const file of ['wefrotas-reports-v2.js','wefrotas-vehicle-list.js'])await page.addScriptTag({path:path.join(root,'wefrotas',file)});
await page.addScriptTag({path:path.join(root,'wefrotas/wefrotas-date-picker.js')});
const reportStart=html.indexOf('<section id="panel-relatorios"'),reportEnd=html.indexOf('</section>',reportStart);
await page.evaluate(markup=>{document.querySelector('.module-compact-date-range').remove();document.body.insertAdjacentHTML('beforeend',markup);document.getElementById('panel-relatorios').style.display='none';},html.slice(reportStart,reportEnd+10));
await page.addScriptTag({content:"var moduleCompactCalendarState={};var moduleCompactFilterConfigs={vehicleList:{startInputId:'vehicle-list-start',endInputId:'vehicle-list-end',statuses:[['','Todos']]}};var moduleFilterRenderActions={};function toggleCentralPendingCalendar(){};function formatCentralPendingCalendarDate(x){return x||''};"+['parseCentralPendingCalendarDate','centralPendingCalendarIso','ensureCalendarTyping','validateCalendarTyping','getModuleCompactFilterValue','renderModuleCompactFilterControls','renderModuleCompactCalendar','closeModuleCompactCalendars','toggleModuleCompactCalendar','selectModuleCompactCalendarDate','clearModuleCompactDateRange','applyModuleCompactDateRange'].map(n=>fn(n).split('    Object.assign(window,')[0]).join('\n')});
await page.evaluate(()=>renderVehicles());assert.equal(await page.locator('.vehicle-list-row').count(),10);
assert.equal(await page.locator('.orders-toolbar #vehicle-list-controls').count(),1);
assert.equal(await page.locator('.vehicle-list-note').count(),0);
const shots=path.resolve(root,'../artifacts/vehicle-toolbar-20261018');fs.mkdirSync(shots,{recursive:true});
await page.screenshot({path:path.join(shots,`toolbar-${width}.png`),fullPage:false});
await page.locator('#module-compact-date-button-vehicleList').click();await page.getByLabel('Data inicial digitada').fill('01/09/2026');await page.getByLabel('Data final digitada').fill('31/10/2026');await page.locator('#module-compact-calendar-vehicleList').getByRole('button',{name:'Filtrar',exact:true}).click();assert.match(await page.locator('#module-compact-date-label-vehicleList').innerText(),/2026-09-01/);
const out=path.resolve(root,'../artifacts/vehicle-list');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'list-'+width+'.png'),fullPage:true});
assert.equal(await page.evaluate(()=>WeFrotasVehicleList.exportData().rows.length),26);
const initial=await page.evaluate(()=>WeFrotasVehicleList.exportData());assert.equal(initial.rows[0][initial.headers.indexOf('Consumo estimado (km/L)')],10);assert.equal(initial.rows[0][initial.headers.indexOf('Custo por km (R$/km)')],2);
await page.evaluate(()=>{window.XLSX={utils:{book_new:()=>({sheets:[]}),aoa_to_sheet:data=>data,book_append_sheet:(book,sheet,name)=>book.sheets.push({sheet,name})},writeFile:book=>window.testExport=book};});await page.locator('[data-export]').click();assert.equal(await page.evaluate(()=>window.testExport.sheets[0].sheet.length),27);
await page.locator('.vehicle-list-row').first().click();assert.equal(await page.locator('#view-vehicle-btn').isEnabled(),true);
await page.locator('.vehicle-list-row').first().dblclick();assert.equal(await page.evaluate(()=>window.openedVehicle),'v0');
await page.locator('#vehicle-list-pagination [data-page="1"]').click();assert.equal(await page.evaluate(()=>selectedVehicles.size),0);assert.match(await page.locator('#vehicle-list-pagination').innerText(),/11–20/);
await page.locator('#select-all-vehicles').click();assert.equal(await page.evaluate(()=>selectedVehicles.size),10);
await page.locator('#vehicle-list-pagination [data-page="1"]').click();assert.equal(await page.locator('.vehicle-list-row').count(),6);
await page.locator('#vehicle-list-size').selectOption('25');assert.equal(await page.locator('.vehicle-list-row').count(),25);
await page.locator('.vehicle-list-columns summary').click();await page.locator('[data-column="model"]').uncheck();assert.equal(await page.evaluate(()=>WeFrotasVehicleList.exportData().headers.includes('Veículo')),false);
await page.evaluate(()=>{document.getElementById('vehicle-list-start').value='2026-10-01';document.getElementById('vehicle-list-end').value='2026-10-31';WeFrotasVehicleList.applyPeriod();});
const data=await page.evaluate(()=>WeFrotasVehicleList.exportData());assert.equal(data.rows[0].at(-1),100);assert.equal(data.rows[0][data.headers.indexOf('Consumo estimado (km/L)')],'Sem base suficiente');
await page.evaluate(()=>{document.getElementById('vehicle-filter-search').value='DOES NOT EXIST';renderVehicles();});assert.equal(await page.locator('.vehicle-list-row').count(),0);assert.equal(await page.evaluate(()=>WeFrotasVehicleList.exportData().rows.length),0);
await page.evaluate(()=>{document.getElementById('vehicle-filter-search').value='';renderVehicles();});assert.equal(await page.locator('.vehicle-list-row').count(),25);
assert.deepEqual(errors,[]);console.log('PASS '+width+'px: pages, selection, double click, columns, filtered export, period, missing basis, empty state');
await page.addScriptTag({content:'function getVehicleLinkedDrivers(){return [];}'});
await page.addScriptTag({path:path.join(root,'wefrotas/wefrotas-vehicle-profile.js')});
await page.evaluate(()=>WeFrotasVehicleProfile.open('v0'));
assert.equal(await page.locator('.vp-tabs .vp-tab-icon').count(),6);
assert.equal(await page.locator('.vp-monthly-indicators .vp-card').count(),2);
assert.match(await page.locator('.vp-monthly-indicators').innerText(),/Sem base suficiente/);
await page.screenshot({path:path.join(shots,`profile-${width}.png`),fullPage:true});
await page.locator('[data-source-kind="consumption"]').first().click();
assert.equal(await page.locator('[data-tab="fuel"]').getAttribute('aria-current'),'page');
assert.deepEqual(errors,[]);
await page.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
