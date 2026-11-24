(() => {
  "use strict";
  function init() {
    const dialog=document.getElementById("opening-notice"),button=document.getElementById("opening-notice-close"),counter=document.getElementById("opening-notice-counter");
    if(!dialog||!button||!counter)return;
    let shown=false,ready=false,elapsed=0,lastFrame=null,frame=0;
    const tick=now=>{
      if(!dialog.open||ready)return;
      if(document.hidden){lastFrame=null;frame=requestAnimationFrame(tick);return;}
      if(lastFrame!==null)elapsed+=Math.min(now-lastFrame,250);
      lastFrame=now;
      const remaining=Math.max(0,Math.ceil((5000-elapsed)/1000));
      counter.textContent=remaining+"s";
      if(elapsed>=5000){ready=true;counter.hidden=true;button.disabled=false;button.setAttribute("aria-label","Fechar comunicado");return;}
      frame=requestAnimationFrame(tick);
    };
    function openNotice(){
      if(shown||document.body.classList.contains("invite-booting"))return;
      shown=true;
      dialog.showModal();document.body.classList.add("notice-open");
      document.getElementById("opening-notice-title").focus({preventScroll:true});
      frame=requestAnimationFrame(tick);
    }
    document.addEventListener("visibilitychange",()=>{lastFrame=null;});
    button.addEventListener("click",()=>{if(ready)dialog.close();});
    dialog.addEventListener("cancel",event=>{if(!ready)event.preventDefault();});
    dialog.addEventListener("close",()=>{cancelAnimationFrame(frame);document.body.classList.remove("notice-open");document.getElementById("start-confirm")?.focus({preventScroll:true});});
    const observer=new MutationObserver(()=>{if(!document.body.classList.contains("invite-booting")){observer.disconnect();openNotice();}});
    if(document.body.classList.contains("invite-booting"))observer.observe(document.body,{attributes:true,attributeFilter:["class"]});else openNotice();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
