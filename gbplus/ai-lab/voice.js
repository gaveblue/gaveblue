// Browser speech recognition + live microphone-level waveform.
// Speech is never sent automatically: the user reviews the recognized text first.
export function setupVoice({input,onStatus}){
 const mic=document.querySelector('#mic'),panel=document.querySelector('#voice-panel');
 const finish=document.querySelector('#voice-finish'),cancel=document.querySelector('#voice-cancel'),bars=[...document.querySelectorAll('.voice-bar')];
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 let active=false,aborting=false,rec=null,stream=null,audioCtx=null,analyser=null,tick=0,interim='',finalText='';
 const status=text=>{onStatus(text);document.querySelector('#voice-hint').textContent=text;};
 function stopAudio(){
  cancelAnimationFrame(tick);tick=0;
  stream?.getTracks().forEach(track=>track.stop());stream=null;
  if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null;}analyser=null;
 }
 function draw(){
  if(!active)return;
  if(analyser){
   const arr=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(arr);
   let total=0;for(let i=0;i<arr.length;i++){const d=(arr[i]-128)/128;total+=d*d;}
   const level=Math.min(1,Math.sqrt(total/arr.length)*8);
   bars.forEach((bar,i)=>{const shape=0.3+0.7*Math.abs(Math.sin((i+1)*1.71));
    bar.style.height=(Math.round(5+Math.min(33,level*38)*shape))+'px';
   });
  }else bars.forEach(bar=>bar.style.height='5px');
  tick=requestAnimationFrame(draw);
 }
 function reset(){
  active=false;mic.disabled=false;mic.setAttribute('aria-pressed','false');panel.hidden=true;stopAudio();
 }
 function complete(){
  const transcript=(finalText+' '+interim).trim();
  reset();if(!aborting&&transcript){input.value=transcript;input.focus();status('Texto reconhecido. Revise a mensagem e toque em Enviar.');}
  else if(!aborting)status('Não identifiquei palavras. Você pode tentar novamente.');
 }
 async function start(){
  if(active||!SpeechRecognition)return;
  active=true;aborting=false;interim='';finalText='';panel.hidden=false;mic.disabled=true;mic.setAttribute('aria-pressed','true');
  status('Ouvindo sua voz… Toque em Concluir ao terminar.');
  try{
   // Audio analyser reads volume locally, never stores or uploads a recording.
   if(navigator.mediaDevices?.getUserMedia&&AudioCtx){
    try{
     stream=await navigator.mediaDevices.getUserMedia({audio:true});
     if(!active){stopAudio();return;}
     audioCtx=new AudioCtx();await audioCtx.resume();
     analyser=audioCtx.createAnalyser();analyser.fftSize=512;
     audioCtx.createMediaStreamSource(stream).connect(analyser);
    }catch(err){stopAudio();status('Microfone ativo; visualização de intensidade indisponível neste navegador.');}
   }
   if(!active)return;
   draw();rec=new SpeechRecognition();rec.lang='pt-BR';rec.interimResults=true;rec.continuous=true;
   rec.onresult=event=>{let latest='';let completed='';
    for(let i=0;i<event.results.length;i++){const text=event.results[i][0].transcript;if(event.results[i].isFinal)completed+=text+' ';else latest+=text+' ';}
    finalText=completed.trim();interim=latest.trim();
   };
   rec.onerror=event=>{if(aborting)return;status(event.error==='not-allowed'?'Permissão do microfone negada.':'Não foi possível reconhecer a voz ('+event.error+').');};
   rec.onend=()=>complete();
   rec.start();
  }catch(err){reset();status('Não foi possível iniciar o reconhecimento. Verifique a permissão do microfone.');}
 }
 mic.addEventListener('click',start);
 finish.addEventListener('click',()=>{if(!active)return;status('Finalizando transcrição…');if(rec){try{rec.stop();}catch{complete();}}else complete();});
 cancel.addEventListener('click',()=>{if(!active)return;aborting=true;try{rec?.abort();}catch{}reset();status('Gravação cancelada.');});
 if(!SpeechRecognition){mic.disabled=true;mic.title='Reconhecimento de voz indisponível';}
}
