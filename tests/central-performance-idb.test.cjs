const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {indexedDB}=require(process.env.CENTRAL_TEST_TOOLS ? path.join(process.env.CENTRAL_TEST_TOOLS,'node_modules/fake-indexeddb') : 'fake-indexeddb');
const source=fs.readFileSync(path.join(__dirname,'../postoscredenciados-covreecia/app.js'),'utf8');
test('real IndexedDB cursor returns only metadata; single receipt reads are tenant scoped',async()=>{
  const name=`central-fixture-${Date.now()}`;
  const open=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('uploads',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const db=await open();await new Promise((resolve,reject)=>{const tx=db.transaction('uploads','readwrite');for(const item of [{id:'a',workspaceId:'covre',receiptBlob:new Blob(['a'])},{id:'b',workspaceId:'covre',receiptBlob:new Blob(['b'])},{id:'c',workspaceId:'other',receiptBlob:new Blob(['c'])}])tx.objectStore('uploads').put(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
  const c=vm.createContext({openCentralDeviceStateDb:open,CENTRAL_PENDING_UPLOADS_STORE:'uploads',CENTRAL_DEFAULT_ORGANIZATION_SLUG:'covre',centralOrganizationContext:{workspaceId:'covre'}});
  vm.runInContext(source.slice(source.indexOf('async function getCentralOfflineSubmissions('),source.indexOf('async function deleteCentralOfflineSubmission(')),c);
  const list=await c.getCentralOfflineSubmissions();assert.deepEqual(Array.from(list,x=>x.id),['a','b']);assert.ok(list.every(x=>!('receiptBlob'in x)));
  const [single]=await c.getCentralOfflineSubmissions({receiptId:'b'});assert.equal(await single.receiptBlob.text(),'b');
  assert.equal((await c.getCentralOfflineSubmissions({receiptId:'c'})).length,0);
  assert.equal((await c.getCentralOfflineSubmissions({receiptId:'missing'})).length,0);
  c.centralOrganizationContext.workspaceId='other';assert.deepEqual(Array.from(await c.getCentralOfflineSubmissions(),x=>x.id),['c']);
});
