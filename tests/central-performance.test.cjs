const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../postoscredenciados-covreecia');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8').replace(/\r\n/g, '\n');
function block(start, end) { const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,`missing block ${start}`);return source.slice(a,b); }

test('static utilities replace browser compiler and are available offline', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'utilities.css'), 'utf8');
  assert.doesNotMatch(html + sw, /cdn\.tailwindcss/);
  assert.match(html, /utilities\.css\?v=20261005-lite-2/);
  assert.match(sw, /utilities\.css\?v=20261005-lite-2/);
  for (const rule of ['.hidden{display:none}', '.flex{display:flex}', '.fixed{position:fixed}', '.overflow-hidden{overflow:hidden}']) assert.ok(css.includes(rule), rule);
  assert.ok(css.length < 35000, 'bounded static utility sheet');
});

test('uploads serialize, interactive receipt overtakes background and failure releases lock', async () => {
  const calls = [], gates = [];
  const c = vm.createContext({});
  vm.runInContext(block('function sendReceiptUpload(', 'function sendReceiptUploadNow('), c);
  c.sendReceiptUploadNow = (body) => { calls.push(body); return new Promise((resolve,reject) => gates.push({resolve,reject})); };
  const a = c.sendReceiptUpload('active');
  const b = c.sendReceiptUpload('background');
  const d = c.sendReceiptUpload('interactive', () => {});
  assert.deepEqual(calls, ['active']);
  gates[0].resolve({ok:true}); await a; await new Promise(setImmediate);
  assert.deepEqual(calls, ['active','interactive']);
  const rejected = assert.rejects(d, /network/); gates[1].reject(new Error('network')); await rejected; await new Promise(setImmediate);
  assert.deepEqual(calls, ['active','interactive','background']);
  gates[2].resolve({ok:true}); await b; await new Promise(setImmediate);
  assert.equal(c.sendReceiptUpload.active, false);
});

test('draft debounce coalesces edits, flushes immediately and never crosses identity', () => {
  let key = 'company:driver', writes = 0, serial = 0;
  const timers = new Map();
  const persist = () => writes++;
  const c = vm.createContext({persistCentralFormDraft:persist, centralFormDraftKey:()=>key,
    window:{setTimeout(fn){timers.set(++serial,fn);return serial;},clearTimeout(id){timers.delete(id);}}});
  vm.runInContext(block('function scheduleCentralFormDraft(', "document.addEventListener('visibilitychange', () => {\n  if (document.visibilityState === 'hidden') flushCentralFormDrafts();"), c);
  for(let i=0;i<20;i++) c.scheduleCentralFormDraft('fuel-form');
  assert.equal(timers.size,1);assert.equal(writes,0);
  c.flushCentralFormDrafts();assert.equal(writes,1);assert.equal(timers.size,0);
  c.scheduleCentralFormDraft('fuel-form');key='other:driver';
  c.flushCentralFormDrafts();assert.equal(writes,1);
});

test('pending debounce is cancelled on acknowledged/discarded draft', () => {
  const timers = new Map([[1,true]]);const removed=[];
  const persist = () => {};persist.pending=new Map([['fuel-form',{timer:1}]]);
  const c = vm.createContext({persistCentralFormDraft:persist,window:{clearTimeout:id=>timers.delete(id)},centralFormDraftKey:()=> 'scoped-key',localStorage:{removeItem:k=>removed.push(k)}});
  vm.runInContext(block('function clearConfirmedCentralFormDraft(', "document.addEventListener('input',"),c);
  c.clearConfirmedCentralFormDraft('fuel-form');
  assert.equal(timers.size,0);assert.equal(persist.pending.size,0);assert.deepEqual(removed,['scoped-key']);
});

test('icons are native SVG with no external icon runtime', () => {
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.doesNotMatch(html,/fontawesome|lucide|fa-solid/);
  assert.match(html,/id="receipt-camera-switch"[\s\S]*?<svg/);
});

test('background tasks coalesce and resume after foreground send, not during it', async () => {
  const timers=[],forms=new Set(['fuel-form']);let calls=0;
  const c=vm.createContext({centralFormSubmissionsInProgress:forms,sendReceiptUpload:{active:false},window:{setTimeout(fn){timers.push(fn);return timers.length;}}});
  vm.runInContext(block('function deferCentralBackgroundWork(', '// Local-only diagnostics:'),c);
  const task=()=>calls++;
  assert.equal(c.deferCentralBackgroundWork(task),true);c.deferCentralBackgroundWork(task);assert.equal(timers.length,1);
  timers.shift()();assert.equal(calls,0);assert.equal(timers.length,1);
  forms.clear();timers.shift()();await Promise.resolve();await Promise.resolve();assert.equal(calls,1);
});

for(const cached of [true,false]) test(`startup ${cached?'with':'without'} saved station directory preserves navigation gate`,async()=>{
  let run,release,ready=false;const network=new Promise(resolve=>release=resolve);
  const c=vm.createContext({window:{addEventListener:(event,fn)=>run=fn},console,
    renderCachedCentralHome(){},loadCentralOrganizationContext:async()=>{},applyCentralTenantFallbacks(){},ensureCentralDeviceStateRestored:async()=>{},renderHomeDriverArea(){},updateCentralConnectivityStatus(){},restoreManagedCentralStationsCache:()=>cached,renderCityImageCards(){},loadManagedCentralStations:()=>network,ensureDriverDirectoryLoaded:async()=>{},retryPendingCentralRegistro(){},processCentralOfflineSubmissions(){},getCentralDeviceId(){},refreshMySubmissions(){},loadCentralOnboardingConfig:async()=>{},centralStartupNavigationReady:false,continueCentralStartupNavigation(){ready=true;}});
  vm.runInContext(block("window.addEventListener('DOMContentLoaded', async () => {\n  renderCachedCentralHome();", "window.addEventListener('keydown',"),c);
  assert.equal(typeof run,'function');const pending=run();
  await new Promise(setImmediate);
  assert.equal(ready,cached);release(true);await pending;assert.equal(ready,true);
});
