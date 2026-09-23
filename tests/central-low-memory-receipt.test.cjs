const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../postoscredenciados-covreecia/app.js'), 'utf8');
const block = (start,end) => source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
function context(extra={}) {
  const c = vm.createContext({DataView,Blob,console,navigator:{deviceMemory:8},COMPRESSED_RECEIPT_MAX_SIZE:1280,window:{},...extra});
  vm.runInContext(block('async function readReceiptDimensions(', 'const receiptPreparationCache'), c);
  return c;
}
function png(w,h) { const b=new ArrayBuffer(24),v=new DataView(b);v.setUint32(0,0x89504e47);v.setUint32(4,0x0d0a1a0a);v.setUint32(16,w);v.setUint32(20,h);return new Blob([b]); }
test('PNG dimensions inspected without image decode',async()=>{assert.equal((await context().readReceiptDimensions(png(4000,3000))).width,4000);});
test('JPEG SOF dimensions inspected without image decode',async()=>{const b=new Uint8Array([255,216,255,192,0,7,8,11,184,15,160]);assert.equal((await context().readReceiptDimensions(new Blob([b]))).height,3000);});
for(const bytes of [[],[255,216],[255,216,255,192,255,255],[1,2,3,4]]) test(`malformed header ${bytes} is safe`,async()=>assert.equal(await context().readReceiptDimensions(new Blob([new Uint8Array(bytes)])),null));
test('legacy large image rejected before full decode',async()=>{
  let decoded=false;const c=context({loadImageFromFile:()=>{decoded=true;}});
  vm.runInContext(block('async function createReceiptDrawable(', 'async function readReceiptDimensions('),c);
  await assert.rejects(c.createReceiptDrawable(png(4000,3000)),/foto menor/);assert.equal(decoded,false);
});
test('portrait bitmap bounds the long edge',async()=>{
  let options;const c=context({window:{createImageBitmap:true},createImageBitmap:async(f,o)=>{options=o;return {width:960,height:1280,close(){}};}});
  vm.runInContext(block('async function createReceiptDrawable(', 'async function readReceiptDimensions('),c);
  await c.createReceiptDrawable(png(3000,4000));assert.equal(options.resizeHeight,1280);assert.equal(options.resizeWidth,undefined);
});
test('failed bitmap does not trigger unsafe full decode',async()=>{
  let decoded=false;const c=context({window:{createImageBitmap:true},console:{warn(){}},createImageBitmap:async()=>{throw Error('memory');},loadImageFromFile:()=>{decoded=true;}});
  vm.runInContext(block('async function createReceiptDrawable(', 'async function readReceiptDimensions('),c);
  await assert.rejects(c.createReceiptDrawable(png(3000,4000)));assert.equal(decoded,false);
});
test('same file is prepared only once and different files serialize',async()=>{
  let active=0,max=0,count=0;const c=vm.createContext({optimizedReceiptFiles:new WeakSet(),optimizeReceiptFile:async f=>{count++;max=Math.max(max,++active);await new Promise(r=>setTimeout(r,2));active--;return f;}});
  vm.runInContext(block('const receiptPreparationCache', 'async function optimizeReceiptFile('),c);
  const a={},b={};await Promise.all([c.compressFuelReceiptIfNeeded(a),c.compressFuelReceiptIfNeeded(a),c.compressFuelReceiptIfNeeded(b)]);assert.equal(count,2);assert.equal(max,1);
});
test('recovery is tenant and driver scoped; excludes files; never sends',()=>{
  const draft=block('function centralFormDraftKey(', 'function getCentralShareUrl(');
  assert.match(draft,/centralTenantStorageKey/);assert.match(draft,/profile.driverId/);assert.match(draft,/\['file','password','hidden'/);
  assert.doesNotMatch(draft,/fetch\(|uploadFuelReceipt|saveCentralRegistro|\.submit\(/);
});
function draftHarness(fail=false) {
  const data=new Map();let driver='d1',tenant='t1';
  const fields=[{id:'amount',type:'text',value:'123,45'},{id:'photo',type:'file',value:'private-file'},{id:'secret',type:'password',value:'secret'}];
  const c=vm.createContext({currentFuelFormMode:'completo',centralOrganizationContext:{workspaceId:'t1'},getDriverProfile:()=>({driverId:driver,vehicleId:'v1'}),centralTenantStorageKey:k=>tenant+':'+k,document:{getElementById:()=>({querySelectorAll:()=>fields})},localStorage:{setItem(k,v){if(fail)throw Error('quota');data.set(k,v);},removeItem:k=>data.delete(k)}});
  vm.runInContext(block('function centralFormDraftKey(', 'function offerCentralFormDraft('),c);
  vm.runInContext(block('function clearConfirmedCentralFormDraft(', "document.addEventListener('input',"),c);
  return {c,data,switchDriver:()=>driver='d2',switchTenant:()=>tenant='t2'};
}
test('draft persists text and mode without receipt or password',()=>{const {c,data}=draftHarness();assert.equal(c.persistCentralFormDraft('fuel-form'),true);const d=JSON.parse([...data.values()][0]);assert.equal(d.fields.amount.value,'123,45');assert.equal(d.mode,'completo');assert.equal(d.fields.photo,undefined);assert.equal(d.fields.secret,undefined);});
test('draft storage exhaustion never crashes form',()=>assert.equal(draftHarness(true).c.persistCentralFormDraft('fuel-form'),false));
test('draft keys separate driver and company',()=>{const h=draftHarness(),a=h.c.centralFormDraftKey('fuel-form');h.switchDriver();const b=h.c.centralFormDraftKey('fuel-form');h.switchTenant();assert.notEqual(a,b);assert.notEqual(b,h.c.centralFormDraftKey('fuel-form'));});
test('confirmation removes only matching form draft',()=>{const {c,data}=draftHarness();c.persistCentralFormDraft('fuel-form');c.persistCentralFormDraft('loose-note-form');c.clearConfirmedCentralFormDraft('fuel-form');assert.equal(data.size,1);assert.match([...data.keys()][0],/loose-note-form/);});
test('weak phone rejects huge photos before decoder allocation',async()=>{
  let decoded=false;const c=context({navigator:{deviceMemory:2},window:{createImageBitmap:true},createImageBitmap:()=>{decoded=true;}});
  vm.runInContext(block('async function createReceiptDrawable(', 'async function readReceiptDimensions('),c);
  await assert.rejects(c.createReceiptDrawable(png(4000,3000)),/6 MP/);assert.equal(decoded,false);
});
test('unknown device uses 1024px long edge',async()=>{
  let opts;const c=context({navigator:{},window:{createImageBitmap:true},createImageBitmap:async(f,o)=>{opts=o;return {width:768,height:1024,close(){}};}});
  vm.runInContext(block('async function createReceiptDrawable(', 'async function readReceiptDimensions('),c);
  await c.createReceiptDrawable(png(3000,4000));assert.equal(opts.resizeHeight,1024);
});
test('carousel has no eager static picture sources and releases inactive slides',()=>{
  const html=fs.readFileSync(require('node:path').join(__dirname,'../postoscredenciados-covreecia/index.html'),'utf8');
  const hero=html.slice(html.indexOf('<div class="home-hero-slides"'),html.indexOf('<div class="home-hero-overlay"'));
  assert.doesNotMatch(hero,/\ssrc(?:set)?=/);assert.match(hero,/data-src=/);
  const carousel=block('function initHomeHeroCarousel()',"window.addEventListener('DOMContentLoaded', async () => {\r\n  await loadCentralOrganizationContext");
  assert.match(carousel,/image.removeAttribute\(attr\)/);assert.match(carousel,/isPaused\(\) \|\| slides.length < 2/);assert.match(carousel,/document.hidden/);
});
test('service worker does not duplicate image cache or precache galleries',()=>{
  const sw=fs.readFileSync(require('node:path').join(__dirname,'../postoscredenciados-covreecia/sw.js'),'utf8');
  assert.match(sw,/request.destination === 'image'.*return;/);assert.match(sw,/filter\(asset =>/);
  assert.doesNotMatch(sw,/indexedDB.deleteDatabase|localStorage.clear/);
});
