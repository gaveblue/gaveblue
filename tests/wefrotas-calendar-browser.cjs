// Isolated UI fixture. All network is blocked; no business data or credentials.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.CENTRAL_TEST_TOOLS,'node_modules/playwright'));
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'wefrotas/wefrotas.js'),'utf8');
function block(n){const start=src.indexOf('    function '+n+'(');assert.ok(start>=0,n);const end=src.slice(start+8).search(/\n    (?:async )?function /);return src.slice(start,start+8+end);}
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
for(const width of [375,1280]){const context=await browser.newContext({viewport:{width,height:850}});await context.route('**/*',r=>r.abort());const page=await context.newPage();
await page.setContent('<input type="date" id="test-date"><div id="calendar"><div id="module-compact-calendar-months-test"></div></div>');
await page.addStyleTag({path:path.join(root,'wefrotas/wefrotas.css')});
await page.addScriptTag({path:path.join(root,'wefrotas/wefrotas-date-picker.js')});
await page.locator('.standard-date-input-trigger').click();
await page.locator('#standard-date-picker-typed').fill('29/02/2024');
assert.equal(await page.locator('#standard-date-picker-title').textContent(),'Fevereiro 2024');
await page.locator('#standard-date-picker-apply').click();assert.equal(await page.locator('#test-date').inputValue(),'2024-02-29');
await page.locator('.standard-date-input-trigger').click();await page.locator('#standard-date-picker-typed').fill('31/02/2026');await page.locator('#standard-date-picker-apply').click();
assert.equal(await page.locator('#standard-date-picker-backdrop').getAttribute('aria-hidden'),'false');
await page.locator('#standard-date-picker-typed').fill('07/10/2026');await page.locator('#standard-date-picker-typed').press('Enter');assert.equal(await page.locator('#test-date').inputValue(),'2026-10-07');
await page.addScriptTag({content:block('ensureCalendarTyping')+'\n'+block('validateCalendarTyping')+'\nwindow.showToast=message=>window.lastToast=message;'});
await page.evaluate(()=>{window.period={};const m=document.getElementById('module-compact-calendar-months-test');ensureCalendarTyping(m,'','',(start,end,selected)=>{window.period={start,end,selected};});});
await page.getByLabel('Data inicial digitada').fill('01/10/2026');await page.getByLabel('Data final digitada').fill('31/10/2026');
assert.deepEqual(await page.evaluate(()=>window.period),{start:'2026-10-01',end:'2026-10-31',selected:'2026-10-31'});
await page.getByLabel('Data final digitada').fill('30/09/2026');assert.equal(await page.evaluate(()=>validateCalendarTyping(document.getElementById('module-compact-calendar-months-test'))),false);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
// Real report markup and the same range controller used in Financeiro.
const html=fs.readFileSync(path.join(root,'wefrotas/index.html'),'utf8');
const start=html.indexOf('<section id="panel-relatorios"'),end=html.indexOf('</section>',start);
await page.locator('body').evaluate((body,markup)=>{body.insertAdjacentHTML('beforeend',markup);},html.slice(start,end+10));
await page.addStyleTag({content:'#panel-relatorios{display:block!important}'});
await page.addScriptTag({content:`var moduleCompactCalendarState={};var moduleCompactFilterConfigs={relatorios:{startInputId:'report-filter-start',endInputId:'report-filter-end',statuses:[['','Todos']]}};var moduleFilterRenderActions={relatorios:()=>{window.applied=true}};function toggleCentralPendingCalendar(){};function formatCentralPendingCalendarDate(x){return x||''};`+
['parseCentralPendingCalendarDate','centralPendingCalendarIso','getModuleCompactFilterValue','renderModuleCompactFilterControls','renderModuleCompactCalendar','closeModuleCompactCalendars','toggleModuleCompactCalendar','selectModuleCompactCalendarDate','clearModuleCompactDateRange','applyModuleCompactDateRange'].map(n=>block(n).split('    Object.assign(window,')[0]).join('\n')});
await page.locator('#module-compact-date-button-relatorios').click();
await page.locator('#module-compact-calendar-relatorios input').nth(0).fill('01/09/2026');
await page.locator('#module-compact-calendar-relatorios input').nth(1).fill('30/09/2026');
await page.locator('#module-compact-calendar-relatorios').getByRole('button',{name:'Filtrar',exact:true}).click();
assert.equal(await page.locator('#report-filter-start').inputValue(),'2026-09-01');
assert.equal(await page.locator('#report-filter-end').inputValue(),'2026-09-30');
assert.equal(await page.evaluate(()=>window.applied),true);
await context.close();console.log(`PASS calendar typing, invalid dates, Enter, period and overflow: ${width}px`);
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
