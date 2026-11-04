/* GB+ 2.0 — Safe floating assistant.
 * New storage key intentionally ignores earlier positions that could leave the
 * bubble cut off. The unopened bubble always starts above mobile navigation.
 * Drag to a side to dock; at least 32 px remain visible and tapping undocks it.
 */
(()=>{
 'use strict';
 const widget=document.querySelector('.gb-ai-widget');
 const handle=widget?.querySelector(':scope > summary');
 if(!widget||!handle)return;

 const KEY='gbplus-ai-button-position-v2';
 const MARGIN=10, VISIBLE=32;
 const clamp=(value,min,max)=>Math.min(Math.max(value,min),Math.max(min,max));
 let drag=null,position=null,ignoreClick=false,initialized=false;

 const mobile=()=>window.matchMedia('(max-width:760px)').matches;
 function viewport(){
  const w=Math.max(handle.offsetWidth||52,window.innerWidth);
  const h=Math.max(handle.offsetHeight||52,window.innerHeight);
  const width=handle.offsetWidth||52,height=handle.offsetHeight||52;
  const minY=16;
  let maxY=Math.max(minY,h-height-16);
  if(mobile()){
   const nav=document.getElementById('mobile-navigation');
   const top=nav?.getBoundingClientRect?.().top;
   if(Number.isFinite(top)&&top>height+40)maxY=Math.max(minY,Math.min(maxY,top-height-14));
   else maxY=Math.max(minY,Math.min(maxY,h-height-155));
  }
  return {w,h,width,height,minX:MARGIN,maxX:Math.max(MARGIN,w-width-MARGIN),minY,maxY};
 }
 function draw(x,y,dock=null,save=false){
  const b=viewport();
  const top=clamp(y,b.minY,b.maxY);
  let left=clamp(x,b.minX,b.maxX);
  if(dock==='left')left=-(b.width-VISIBLE);
  if(dock==='right')left=b.w-VISIBLE;
  widget.style.left=left+'px';
  widget.style.top=top+'px';
  widget.style.right='auto';
  widget.style.bottom='auto';
  widget.classList.toggle('is-docked',!!dock);
  widget.dataset.dock=dock||'';
  position={
   x:(clamp(x,b.minX,b.maxX)-b.minX)/Math.max(1,b.maxX-b.minX),
   y:(top-b.minY)/Math.max(1,b.maxY-b.minY),
   dock
  };
  if(save)try{localStorage.setItem(KEY,JSON.stringify(position));}catch{}
 }
 function restore(){
  if(widget.open||drag||document.body.classList.contains('auth-locked'))return;
  const b=viewport();
  if(!position){
   // On a new login/device, always start fully visible at the right.
   draw(b.maxX,b.maxY-8);
  }else{
   draw(b.minX+clamp(position.x,0,1)*(b.maxX-b.minX),
        b.minY+clamp(position.y,0,1)*(b.maxY-b.minY),
        position.dock);
  }
  initialized=true;
 }
 try{
  const previous=JSON.parse(localStorage.getItem(KEY)||'null');
  if(previous&&Number.isFinite(previous.x)&&Number.isFinite(previous.y)){
   position={x:clamp(previous.x,0,1),y:clamp(previous.y,0,1),
    dock:['left','right'].includes(previous.dock)?previous.dock:null};
  }
 }catch{}

 function undock(){
  if(!position?.dock)return;
  const b=viewport();
  const x=position.dock==='left'?b.minX:b.maxX;
  const y=b.minY+position.y*(b.maxY-b.minY);
  draw(x,y,null,true);
 }
 handle.addEventListener('pointerdown',event=>{
  if(widget.open||!event.isPrimary||event.button!==0||document.body.classList.contains('auth-locked'))return;
  if(!initialized)restore();
  ignoreClick=false;
  const rect=handle.getBoundingClientRect();
  drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,left:rect.left,top:rect.top,moved:false};
  try{handle.setPointerCapture(event.pointerId);}catch{}
 });
 handle.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
  if(!drag.moved&&Math.hypot(dx,dy)<7)return;
  drag.moved=true;
  event.preventDefault();
  handle.classList.add('is-dragging');
  draw(drag.left+dx,drag.top+dy);
 });
 handle.addEventListener('pointerup',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  if(drag.moved){
   ignoreClick=true;
   const b=viewport(),rect=handle.getBoundingClientRect();
   const dock=rect.left<=b.minX+10?'left':rect.left>=b.maxX-10?'right':null;
   draw(rect.left,rect.top,dock,true);
  }
  handle.classList.remove('is-dragging');
  drag=null;
  try{if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);}catch{}
 });
 handle.addEventListener('pointercancel',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  handle.classList.remove('is-dragging');drag=null;restore();
 });
 handle.addEventListener('click',event=>{
  if(ignoreClick){ignoreClick=false;event.preventDefault();event.stopImmediatePropagation();return;}
  if(position?.dock&&!widget.open){
   event.preventDefault();event.stopImmediatePropagation();
   undock();
  }
 },true);
 widget.addEventListener('toggle',()=>{if(!widget.open)restore();});
 window.addEventListener('gbplus-ai-ready',restore);
 window.addEventListener('resize',restore,{passive:true});
 window.addEventListener('orientationchange',restore,{passive:true});
 window.visualViewport?.addEventListener('resize',restore,{passive:true});
 if(document.readyState==='complete')restore();
 else window.addEventListener('load',restore,{once:true});
})();
