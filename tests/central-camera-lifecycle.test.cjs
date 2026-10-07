const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../postoscredenciados-covreecia/app.js'),'utf8');
const block=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));
const gate=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const settle=()=>new Promise(setImmediate);
function harness(){
 const modal={classList:{hidden:true,add(){this.hidden=true;},remove(){this.hidden=false;},contains(){return this.hidden;}}};
 const status={};let opens=0,closes=0,captures=0,native=0;
 const c=vm.createContext({console:{error(){}},document:{getElementById:id=>id==='receipt-camera-modal'?modal:status},navigator:{deviceMemory:2,mediaDevices:{getUserMedia(){}}},
 receiptCameraPhase:'closed',receiptCameraSession:0,receiptCameraRequestVersion:0,receiptCameraCaptureBusy:false,pendingReceiptCameraFile:null,activeReceiptCameraStream:null,
 activeReceiptCameraTarget:'fuel',receiptCameraDevices:[{deviceId:'back'}],receiptCameraDeviceIndex:0,localStorage:{setItem(){}},
 persistCentralFormDraft(){},stopReceiptCameraStream(){c.activeReceiptCameraStream=null;},clearReceiptCameraReview(){c.pendingReceiptCameraFile=null;},exitReceiptCameraFullscreen(){closes++;},enterReceiptCameraFullscreen(){},
 setReceiptCameraPhase(phase){c.receiptCameraPhase=phase;},showReceiptCameraLiveMode(){},showErrorMessage(){},openNativeReceiptCameraFallback(){native++;},
 requestReceiptCameraStream:async()=>{opens++;c.receiptCameraRequestVersion++;const stream={};c.activeReceiptCameraStream=stream;return stream;},attachReceiptCameraStream:async()=>{},preferRearReceiptCamera:async()=>{},
 prepareReceiptFile:async()=>true,showReceiptCameraReviewMode(file){c.pendingReceiptCameraFile=file;},optimizedReceiptFiles:new WeakSet()
 });
 vm.runInContext(block('async function openReceiptCamera(', 'async function captureReceiptCameraFrame('),c);
 vm.runInContext(block('async function retakeReceiptCamera(', 'function deletePhoto('),c);
 c.captureReceiptCameraFrame=async()=>{captures++;c.pendingReceiptCameraFile={fixture:true};c.receiptCameraPhase='review';};
 return{c,modal,status,counts:()=>({opens,closes,captures,native})};
}
test('capture waits for slow automatic lens selection; repeated open cannot reset it',async()=>{
 const h=harness(),g=gate();h.c.preferRearReceiptCamera=()=>g.promise;
 const opening=h.c.openReceiptCamera();await settle();assert.equal(h.c.receiptCameraPhase,'opening');
 for(let i=0;i<8;i++){await h.c.captureReceiptCamera();await h.c.openReceiptCamera();}
 assert.equal(h.counts().opens,1);assert.equal(h.counts().captures,0);
 h.c.receiptCameraRequestVersion++;g.resolve();await opening;
 assert.equal(h.c.receiptCameraPhase,'live');await h.c.captureReceiptCamera();assert.equal(h.counts().captures,1);assert.equal(h.c.receiptCameraPhase,'review');
});
test('OK waits for attachment; repeated tap cannot close or discard preview',async()=>{
 const h=harness(),g=gate();await h.c.openReceiptCamera();await h.c.captureReceiptCamera();const file=h.c.pendingReceiptCameraFile;
 let attachments=0;h.c.prepareReceiptFile=()=>{attachments++;return g.promise;};const pending=h.c.confirmReceiptCamera();
 for(let i=0;i<8;i++)await h.c.confirmReceiptCamera();
 assert.equal(attachments,1);assert.equal(h.modal.classList.hidden,false);assert.equal(h.c.pendingReceiptCameraFile,file);
 g.resolve(false);await pending;assert.equal(h.c.receiptCameraPhase,'review');assert.equal(h.c.pendingReceiptCameraFile,file);
 h.c.prepareReceiptFile=async()=>true;await h.c.confirmReceiptCamera();assert.equal(h.modal.classList.hidden,true);
});
test('failed retake restores existing photo instead of closing or invoking native camera',async()=>{
 const h=harness();await h.c.openReceiptCamera();await h.c.captureReceiptCamera();const file=h.c.pendingReceiptCameraFile;
 h.c.showReceiptCameraLiveMode=()=>{h.c.pendingReceiptCameraFile=null;};h.c.requestReceiptCameraStream=async()=>{throw Error('camera busy');};
 await h.c.retakeReceiptCamera();assert.equal(h.c.pendingReceiptCameraFile,file);assert.equal(h.c.receiptCameraPhase,'review');assert.equal(h.modal.classList.hidden,false);assert.equal(h.counts().native,0);
});
test('failed opening stays visible with explicit native option, no automatic close loop',async()=>{
 const h=harness();h.c.requestReceiptCameraStream=async()=>{throw Error('camera busy');};await h.c.openReceiptCamera();assert.equal(h.c.receiptCameraPhase,'error');assert.equal(h.modal.classList.hidden,false);assert.equal(h.counts().native,0);
});
test('late attachment completion never closes a newer session',async()=>{
 const h=harness(),g=gate();await h.c.openReceiptCamera();await h.c.captureReceiptCamera();h.c.prepareReceiptFile=()=>g.promise;const pending=h.c.confirmReceiptCamera();h.c.closeReceiptCamera();await h.c.openReceiptCamera();g.resolve(true);await pending;assert.equal(h.c.receiptCameraPhase,'live');assert.equal(h.modal.classList.hidden,false);
});
test('eight consecutive captures attach exactly once per session',async()=>{
 const h=harness();let attached=0;h.c.prepareReceiptFile=async()=>{attached++;return true;};for(let i=0;i<8;i++){await h.c.openReceiptCamera();await h.c.captureReceiptCamera();await h.c.confirmReceiptCamera();assert.equal(h.c.receiptCameraPhase,'closed');}assert.equal(attached,8);assert.equal(h.counts().captures,8);
});
