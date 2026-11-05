// Pointer gestures for GB+ Launches. This module never mutates financial data.
// Right and left swipes open an explicit confirmation flow, not an automatic write.
export const launchSwipeThreshold=width=>Math.max(150,Math.min(220,width*.54));
export function installLaunchGestures({onSwipe,onLongPress}){
 let gesture=null,ignoreClick={id:null,until:0};
 const safeVibrate=ms=>{try{navigator.vibrate?.(ms);}catch{}};
 const clear=()=>{
  if(!gesture)return;
  clearTimeout(gesture.timer);
  const shell=gesture.card.closest('.gb-launch-swipe-shell');
  if(gesture.card.isConnected)gesture.card.style.removeProperty('transform');
  if(shell){shell.dataset.intent='';shell.style.removeProperty('--gb-launch-progress');}
  gesture=null;
 };
 document.addEventListener('pointerdown',event=>{
  if(event.button!==0||!event.isPrimary||gesture)return;
  const card=event.target.closest?.('.gb-launch-card');
  if(!card||!card.isConnected)return;
  const start={card,id:card.dataset.id,pointerId:event.pointerId,x:event.clientX,y:event.clientY,
    moved:false,dragging:false,longFired:false,thresholdReached:false,timer:0};
  gesture=start;
  start.timer=setTimeout(()=>{
   if(gesture!==start||start.moved||start.dragging||!card.isConnected)return;
   start.longFired=true;
   ignoreClick={id:start.id,until:Date.now()+650};
   safeVibrate(10);
   onLongPress(start.id);
  },480);
 },{passive:true});
 document.addEventListener('pointermove',event=>{
  const g=gesture;
  if(!g||event.pointerId!==g.pointerId||g.longFired)return;
  const dx=event.clientX-g.x,dy=event.clientY-g.y;
  if(Math.abs(dx)>9||Math.abs(dy)>9){g.moved=true;clearTimeout(g.timer);}
  if(!g.dragging&&Math.abs(dx)>16&&Math.abs(dx)>Math.abs(dy)*1.6){
   g.dragging=true;
   try{g.card.setPointerCapture(event.pointerId);}catch{}
  }
  if(!g.dragging)return;
  const width=g.card.getBoundingClientRect().width;
  const target=launchSwipeThreshold(width);
  const distance=Math.min(Math.abs(dx),Math.min(250,width*.68));
  const crossed=Math.abs(dx)>=target;
  const shell=g.card.closest('.gb-launch-swipe-shell');
  if(shell){shell.dataset.intent=dx>0?'pay':'delete';shell.style.setProperty('--gb-launch-progress',String(Math.min(1,distance/target)));}
  g.card.style.transform='translate3d('+Math.sign(dx)*distance+'px,0,0)';
  if(crossed&&!g.thresholdReached)safeVibrate(13);
  g.thresholdReached=crossed;
 },{passive:true});
 document.addEventListener('pointerup',event=>{
  const g=gesture;if(!g||event.pointerId!==g.pointerId)return;
  const dx=event.clientX-g.x;
  const swiped=g.dragging;
  const crossed=swiped&&Math.abs(dx)>=launchSwipeThreshold(g.card.getBoundingClientRect().width);
  const id=g.id;
  if(swiped||g.longFired)ignoreClick={id,until:Date.now()+650};
  clear();
  if(crossed)onSwipe(dx>0?'pay':'delete',id);
 },{passive:true});
 document.addEventListener('pointercancel',event=>{if(gesture?.pointerId===event.pointerId)clear();},{passive:true});
 document.addEventListener('click',event=>{
  if(ignoreClick.id===null||Date.now()>ignoreClick.until)return;
  const card=event.target.closest?.('.gb-launch-card');
  if(card?.dataset.id===ignoreClick.id){
   ignoreClick={id:null,until:0};
   event.preventDefault();event.stopImmediatePropagation();
  }
 },true);
}
