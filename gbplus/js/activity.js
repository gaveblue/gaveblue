// Approximate foreground activity only. No URLs, keystrokes, IPs or financial
// payloads are transmitted. Durations are calculated and serialized by Postgres.
export function startActivity(client,getUser){
 let lastInteraction=Date.now(),running=false,stopped=false;
 const interact=()=>{lastInteraction=Date.now();};
 const tick=async()=>{
  if(stopped||running||document.hidden||!navigator.onLine||!getUser()||document.body.classList.contains('auth-locked')||Date.now()-lastInteraction>90000)return;
  running=true;
  try{await client.rpc('gbplus_activity_ping');}catch{/* Activity must never interrupt finances. */}
  finally{running=false;}
 };
 for(const event of ['pointerdown','keydown','scroll','touchstart'])window.addEventListener(event,interact,{passive:true});
 const visible=()=>{if(!document.hidden){interact();void tick();}};
 document.addEventListener('visibilitychange',visible);
 const interval=setInterval(tick,30000);void tick();
 return ()=>{stopped=true;clearInterval(interval);for(const event of ['pointerdown','keydown','scroll','touchstart'])window.removeEventListener(event,interact);document.removeEventListener('visibilitychange',visible);};
}
