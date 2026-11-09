'use strict';
// Isolated DOM tests: no authenticated browser, server, or external requests.
const {chromium}=require('../../central-audit-build-tools/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const main=fs.readFileSync(path.join(root,'wefrotas/wefrotas.js'),'utf8');
const bridge=main.slice(main.indexOf('    window.WeFrotasReplacementBridge ='),main.indexOf('\n    function renderAll()',main.indexOf('    window.WeFrotasReplacementBridge =')));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {for(const width of [1280,375]){
  const page=await browser.newPage({viewport:{width,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>route.abort());
  await page.setContent('<button id="opener" data-wf-open="titular">Carro reserva</button>');
  await page.addStyleTag({path:path.join(root,'wefrotas/wefrotas.css')});
  await page.addStyleTag({path:path.join(root,'wefrotas/wefrotas-substitutions.css')});
  await page.addScriptTag({content:`
   var allVehicles=[{id:'titular',placa:'TEST-1',km:1000},{id:'reserva',placa:'TEST-2',km:2000}],allDrivers=[{id:'driver',nome:'Teste'}],allFinanceEntries=[];
   var wefrotasRecoveryRequired=false,allow=true,fail=false,calls=0;
   function requireWefrotasPermission(){return allow;} function renderAll(){} function getFinanceNetTotal(e){return e.total;}
   function showToast(message){window.lastToast=message;}
   async function persistOperationalDataImmediately(){calls++;await new Promise(r=>setTimeout(r,100));if(fail)throw Error('offline');}
   window.WeFrotasVehicleReports={detailRows:()=>allFinanceEntries.map(entry=>({entry,total:entry.total}))};
  `+bridge});
  await page.addScriptTag({path:path.join(root,'wefrotas/wefrotas-substitutions.js')});
  await page.locator('#opener').click();
  assert.equal(await page.locator('[role=dialog]').count(),1);
  assert.ok(await page.locator('.wf-reserve-sheet').evaluate(el=>el.getBoundingClientRect().width<=innerWidth));
  assert.ok(await page.locator('.wf-reserve-sheet').evaluate(el=>el.scrollWidth<=el.clientWidth));
  await page.locator('#wf-driver').selectOption('driver');await page.locator('#wf-vehicle').selectOption('reserva');
  await page.locator('#wf-start-date').fill('2026-11-01');await page.locator('#wf-start-km').fill('2000');
  await page.evaluate(()=>fail=true);
  await page.locator('#wf-save').click();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#wf-reserve-overlay').count(),1,'cannot close pending request');
  await page.waitForFunction(()=>window.lastToast?.includes('offline'));
  assert.equal(await page.evaluate(()=>allVehicles[0].vehicleSubstitutions.length),1);
  const id=await page.locator('#wf-reserve-form').getAttribute('data-record-id');
  await page.evaluate(()=>fail=false);await page.locator('#wf-save').click();
  await page.waitForFunction(()=>!document.getElementById('wf-reserve-overlay'));
  assert.equal(await page.evaluate(()=>allVehicles[0].vehicleSubstitutions.length),1,'retry is idempotent');
  assert.equal(await page.evaluate(()=>allVehicles[0].km),1000);
  assert.equal(await page.evaluate(()=>allVehicles[1].km),2000);
  await page.evaluate(id=>{
   allFinanceEntries.push({id:'fuel',entryType:'combustivel',vehicleId:'reserva',driverId:'driver',substitutionId:id,dataAbastecimento:'2026-11-02',km:2250,total:100});
   WeFrotasSubstitutions.open('titular',id);
  },id);
  assert.equal(await page.locator('#wf-vehicle').isDisabled(),true);
  await page.locator('#wf-end-date').fill('2026-11-03');await page.locator('#wf-end-km').fill('2300');
  const out=path.join(root,'..','artifacts','reserve-qa-20261109');fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,`sheet-${width}.png`),fullPage:true});
  await page.locator('#wf-save').click();await page.waitForFunction(()=>!document.getElementById('wf-reserve-overlay'));
  assert.equal(await page.evaluate(()=>allVehicles[0].operationalStatus),'manutencao','return does not release titular automatically');
  assert.equal(await page.evaluate(()=>allFinanceEntries.length),1);
  assert.equal(await page.evaluate(()=>WeFrotasSubstitutions.statistics(allVehicles[0].vehicleSubstitutions[0]).total),100);
  await page.evaluate(async()=>{allow=false;try{await WeFrotasReplacementBridge.save('titular',allVehicles[0].vehicleSubstitutions[0]);}catch(e){window.denied=e.message;}});
  assert.match(await page.evaluate(()=>window.denied),/Sem permissão/);
  assert.deepEqual(errors,[]);
  console.log('PASS isolated lifecycle, offline retry, permissions, dimensions '+width);await page.close();
 }} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
