/* GB+ AI floating button: drag on touch, pen or mouse; tap opens the assistant.
 * Position stays on this device only, and never changes financial data.
 */
(()=>{
 'use strict';
 const widget=document.querySelector('.gb-ai-widget');
 const handle=widget?.querySelector(':scope > summary');
 if(!widget||!handle)return;

 const KEY='gbplus-ai-button-position-v1';
 const EDGE=10;
 const limit=(value,min,max)=>Math.min(Math.max(value,min),max);
 let drag=null,position=null,suppressClick=false;

 // Fractions make the stored position adapt to rotation and different phone sizes.
 function bounds(){
  return {
   x:Math.max(0,window.innerWidth-handle.offsetWidth-EDGE*2),
   y:Math.max(0,window.innerHeight-handle.offsetHeight-EDGE*2)
  };
 }
 function put(x,y){
  const max=bounds();
  const left=limit(x,EDGE,EDGE+max.x);
  const top=limit(y,EDGE,EDGE+max.y);
  widget.style.left=left+'px';
  widget.style.top=top+'px';
  widget.style.right='auto';
  widget.style.bottom='auto';
  position={x:max.x?(left-EDGE)/max.x:0,y:max.y?(top-EDGE)/max.y:0};
 }
 function restore(){
  if(!position||widget.open||drag)return;
  const max=bounds();
  put(EDGE+position.x*max.x,EDGE+position.y*max.y);
 }
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)){
   position={x:limit(saved.x,0,1),y:limit(saved.y,0,1)};
   restore();
  }
 }catch{}

 handle.addEventListener('pointerdown',event=>{
  if(widget.open||!event.isPrimary||event.button!==0)return;
  suppressClick=false;
  const rect=widget.getBoundingClientRect();
  drag={id:event.pointerId,clientX:event.clientX,clientY:event.clientY,left:rect.left,top:rect.top,moved:false};
  try{handle.setPointerCapture(event.pointerId);}catch{}
 });

 handle.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const dx=event.clientX-drag.clientX,dy=event.clientY-drag.clientY;
  if(!drag.moved&&Math.hypot(dx,dy)<7)return;
  drag.moved=true;
  event.preventDefault();
  handle.classList.add('is-dragging');
  put(drag.left+dx,drag.top+dy);
 });

 function finish(event){
  if(!drag||drag.id!==event.pointerId)return;
  if(drag.moved){
   suppressClick=true; // Native summary click must not open the chat after a drag.
   try{localStorage.setItem(KEY,JSON.stringify(position));}catch{}
  }
  handle.classList.remove('is-dragging');
  drag=null;
  try{if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);}catch{}
 }
 handle.addEventListener('pointerup',finish);
 handle.addEventListener('pointercancel',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  handle.classList.remove('is-dragging');
  drag=null;
 });
 handle.addEventListener('click',event=>{
  if(!suppressClick)return;
  suppressClick=false;
  event.preventDefault();
  event.stopImmediatePropagation();
 },true);
 window.addEventListener('resize',restore,{passive:true});
 window.addEventListener('orientationchange',restore,{passive:true});
})();
