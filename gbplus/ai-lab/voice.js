// GB+ AI Lab — stable Android speech-to-text.
// SpeechRecognition owns the microphone. Never open getUserMedia in parallel:
// Android browsers may fail to transcribe when two APIs acquire the mic.
// Animated wave indicates recognition/speech activity (not measured audio amplitude).
// Recognition is never submitted automatically.
export function setupVoice({input,onStatus}){
 const mic=document.querySelector('#mic');
 const panel=document.querySelector('#voice-panel');
 const finish=document.querySelector('#voice-finish');
 const cancel=document.querySelector('#voice-cancel');
 const hint=document.querySelector('#voice-hint');
 const wave=panel?.querySelector('.voice-wave');
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 let recognition=null,active=false,cancelled=false,stopping=false;
 let transcript='',lastError='',generation=0,finishTimer=null;
 const status=message=>{if(hint)hint.textContent=message;onStatus(message);};
 function animate(mode){
   if(!wave)return;
   wave.classList.toggle('is-listening',mode==='listening'||mode==='speaking');
   wave.classList.toggle('is-speaking',mode==='speaking');
 }
 function reset(){
   active=false;stopping=false;recognition=null;
   if(finishTimer){clearTimeout(finishTimer);finishTimer=null;}
   if(panel)panel.hidden=true;
   if(mic){mic.disabled=false;mic.setAttribute('aria-pressed','false');}
   animate('off');
 }
 function finishSession(id){
   if(id!==generation||!active)return;
   const text=transcript.trim();
   const error=lastError;
   const wasCancelled=cancelled;
   reset();
   if(wasCancelled)return;
   if(text){
     // User must review/edit the transcript and explicitly press Send.
     input.value=text;
     input.dispatchEvent(new Event('input',{bubbles:true}));
     status('Transcrição pronta. Revise o texto e toque em Enviar.');
   }else if(error){
     status(error);
   }else{
     status('Não identifiquei palavras. Tente falar novamente ou use o microfone do teclado.');
   }
 }
 function recognizedText(event){
   let final='',partial='';
   if(!event?.results)return;
   for(let i=0;i<event.results.length;i++){
     const result=event.results[i];
     const text=result?.[0]?.transcript||'';
     if(result?.isFinal)final+=text+' ';
     else partial+=text+' ';
   }
   // On Android a result can arrive only as "interim"; keep it until onend.
   transcript=(final+' '+partial).replace(/\s+/g,' ').trim()||transcript;
   if(transcript)status('Reconhecido: '+transcript+' — toque em Concluir.');
 }
 function start(){
   if(active)return;
   if(!SpeechRecognition){
     status('Este navegador não permite transcrição pela página. Use o microfone do teclado do celular.');
     return;
   }
   const id=++generation;
   active=true;cancelled=false;stopping=false;transcript='';lastError='';
   if(panel)panel.hidden=false;
   if(mic){mic.disabled=true;mic.setAttribute('aria-pressed','true');}
   if(finish)finish.disabled=false;
   animate('listening');
   status('Ouvindo… Fale e depois toque em Concluir.');
   try{
     const rec=new SpeechRecognition();
     recognition=rec;
     rec.lang='pt-BR';
     rec.interimResults=true;
     // continuous=true is ignored on Android Chrome; single utterance is reliable.
     rec.continuous=false;
     rec.maxAlternatives=1;
     rec.onstart=()=>{if(id===generation&&active)status('Microfone ligado. Pode falar.');};
     rec.onaudiostart=()=>{if(id===generation&&active)animate('listening');};
     rec.onspeechstart=()=>{if(id===generation&&active)animate('speaking');};
     rec.onspeechend=()=>{if(id===generation&&active)animate('listening');};
     rec.onresult=event=>{if(id===generation&&active&&!cancelled)recognizedText(event);};
     rec.onerror=event=>{
       if(id!==generation||cancelled)return;
       const code=event.error||'unknown';
       const messages={
         'not-allowed':'Permissão do microfone negada. Autorize o microfone para este site nas configurações do navegador.',
         'service-not-allowed':'O reconhecimento de voz foi bloqueado pelo navegador. Use a digitação por voz do teclado.',
         'audio-capture':'Não consegui acessar o microfone. Verifique se outro aplicativo está usando o áudio.',
         'network':'O serviço de reconhecimento não respondeu. Verifique sua conexão ou use o microfone do teclado.',
         'no-speech':'Nenhuma fala foi detectada. Tente novamente falando perto do microfone.',
         'aborted':'Reconhecimento interrompido.',
         'language-not-supported':'Português não disponível no reconhecimento deste navegador.'
       };
       lastError=messages[code]||'Falha na transcrição ('+code+'). Tente novamente ou use o microfone do teclado.';
       status(lastError);
       // Android can emit an error without a subsequent onend.
       if(!finishTimer)finishTimer=setTimeout(()=>finishSession(id),700);
     };
     rec.onend=()=>finishSession(id);
     // CRITICAL: start synchronously inside the click handler for mic permission.
     rec.start();
   }catch(error){
     lastError='Não consegui iniciar a transcrição. Confira a permissão do microfone e tente novamente.';
     finishSession(id);
   }
 }
 mic?.addEventListener('click',start);
 finish?.addEventListener('click',()=>{
   if(!active||stopping)return;
   stopping=true;
   if(finish)finish.disabled=true;
   status('Concluindo reconhecimento…');
   const id=generation;
   try{recognition?.stop();}
   catch{finishSession(id);return;}
   // Some Android browsers do not fire onend after stop.
   finishTimer=setTimeout(()=>finishSession(id),2200);
 });
 cancel?.addEventListener('click',()=>{
   if(!active)return;
   cancelled=true;
   generation++;
   try{recognition?.abort();}catch{}
   reset();
   status('Transcrição cancelada.');
 });
 if(!SpeechRecognition){
   mic.title='Use o microfone do teclado para ditar';
   mic.setAttribute('aria-label','Ajuda para digitação por voz');
 }
}
