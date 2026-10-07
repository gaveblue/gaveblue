const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../postoscredenciados-covreecia/app.js'),'utf8');
const block=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));
function setup(memory,impl){let calls=[],stops=0;const stream={getTracks:()=>[{stop(){stops++;}}],getVideoTracks:()=>[{getSettings:()=>({width:1280,height:960})}]};const c=vm.createContext({receiptCameraRequestVersion:0,activeReceiptCameraStream:null,stopReceiptCameraStream(){},navigator:{deviceMemory:memory,mediaDevices:{async getUserMedia(options){calls.push(options);return impl?impl(options,stream):stream;}}}});vm.runInContext(block('async function requestReceiptCameraStream(', 'async function attachReceiptCameraStream('),c);return{c,calls,stream,stops:()=>stops};}
for(const memory of [undefined,1,2,4])test(`low memory ${memory}: bounded capture without audio`,async()=>{const h=setup(memory);await h.c.requestReceiptCameraStream();assert.equal(h.calls[0].video.width.max,1280);assert.equal(h.calls[0].video.height.max,1280);assert.equal(h.calls[0].video.frameRate.max,15);assert.equal(h.calls[0].audio,false);});
test('facing-mode fallback keeps resolution ceiling',async()=>{let attempt=0;const h=setup(2,(_,s)=>{if(!attempt++)throw Error('camera');return s;});await h.c.requestReceiptCameraStream();assert.equal(h.calls.length,2);assert.equal(h.calls[1].video.width.max,1280);});
test('permission denial does not request twice',async()=>{const h=setup(2,()=>{throw Object.assign(Error('denied'),{name:'NotAllowedError'});});await assert.rejects(h.c.requestReceiptCameraStream());assert.equal(h.calls.length,1);});

test('front stream is stopped and replaced by principal rear within same request generation',async()=>{
 const h=setup(2);let stopped=0;const front={getTracks:()=>[{stop:()=>stopped++}],getVideoTracks:()=>[{label:'Front Camera',getSettings:()=>({facingMode:'user',deviceId:'f',width:1280,height:960})}]};
 h.c.navigator.mediaDevices.getUserMedia=async options=>{h.calls.push(options);return options.video.deviceId?h.stream:front;};
 h.c.navigator.mediaDevices.enumerateDevices=async()=>[{kind:'videoinput',deviceId:'f',label:'Front Camera'},{kind:'videoinput',deviceId:'r',label:'Back camera 0'}];
 vm.runInContext(block('function chooseReceiptCamera(', 'async function preferRearReceiptCamera('),h.c);
 assert.equal(await h.c.requestReceiptCameraStream(),h.stream);assert.equal(stopped,1);assert.equal(h.calls[1].video.deviceId.exact,'r');assert.equal(h.c.receiptCameraRequestVersion,1);
});
test('explicit device returning front is rejected, never displayed',async()=>{
 const h=setup(2,(_,s)=>{s.getVideoTracks=()=>[{getSettings:()=>({facingMode:'user',width:1280,height:960})}];return s;});
 await assert.rejects(h.c.requestReceiptCameraStream('stale-front'));assert.equal(h.stops(),1);assert.equal(h.c.activeReceiptCameraStream,null);
});
test('closing while replacement rear opens releases the late stream',async()=>{
 const h=setup(2);let release;const front={getTracks:()=>[{stop(){}}],getVideoTracks:()=>[{getSettings:()=>({facingMode:'user'})}]};
 h.c.navigator.mediaDevices.getUserMedia=async options=>options.video.deviceId?new Promise(r=>release=r):front;
 h.c.navigator.mediaDevices.enumerateDevices=async()=>[{kind:'videoinput',deviceId:'r',label:'Back camera 0'}];
 vm.runInContext(block('function chooseReceiptCamera(', 'async function preferRearReceiptCamera('),h.c);
 const pending=h.c.requestReceiptCameraStream();await new Promise(setImmediate);h.c.receiptCameraRequestVersion++;release(h.stream);
 await assert.rejects(pending);assert.equal(h.stops(),1);assert.equal(h.c.activeReceiptCameraStream,null);
});
test('closing before permission resolves releases late stream',async()=>{let resolve;const h=setup(2,()=>new Promise(r=>resolve=r));const p=h.c.requestReceiptCameraStream();h.c.receiptCameraRequestVersion++;resolve(h.stream);await assert.rejects(p);assert.equal(h.stops(),1);assert.equal(h.c.activeReceiptCameraStream,null);});
test('camera ignoring size constraints stops before preview',async()=>{const h=setup(2,(_,s)=>{s.getVideoTracks=()=>[{getSettings:()=>({width:4000,height:3000})}];return s;});await assert.rejects(h.c.requestReceiptCameraStream());assert.equal(h.stops(),1);});
test('capture blocks double taps and releases on errors',async()=>{let resolve,count=0;const c=vm.createContext({receiptCameraPhase:'live',setReceiptCameraPhase(phase){c.receiptCameraPhase=phase;},receiptCameraCaptureBusy:false,receiptCameraRequestVersion:1,captureReceiptCameraFrame:()=>{count++;return new Promise(r=>resolve=r);},showErrorMessage(){}});vm.runInContext(block('async function captureReceiptCamera()', 'async function captureReceiptCameraFrame('),c);const a=c.captureReceiptCamera();await c.captureReceiptCamera();assert.equal(count,1);resolve();await a;assert.equal(c.receiptCameraCaptureBusy,false);});
test('camera path keeps JPEG bounded and cached; no full photo decode',()=>{const code=block('async function captureReceiptCameraFrame(', 'async function retakeReceiptCamera(');assert.match(code,/COMPRESSED_RECEIPT_MAX_SIZE/);assert.match(code,/optimizedReceiptFiles.add\(file\)/);assert.match(code,/canvas.width = 1/);assert.match(code,/requestVersion !== receiptCameraRequestVersion/);assert.doesNotMatch(code,/loadImageFromFile|createImageBitmap|readAsDataURL/);});
