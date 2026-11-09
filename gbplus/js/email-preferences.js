import {createGbplusClient} from '../integrations/supabase/client.js';
import {cloudConfig} from './cloud-config.js';
const main=document.querySelector('#content'),invite=document.body.dataset.purpose==='invite';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const back='<a class="button" href="./?web=1#settings">Voltar ao GB+</a>';
const token=!invite?location.hash.slice(1):'';
if(token){
 history.replaceState(null,'',location.pathname);
 main.innerHTML='<h1>Cancelar novidades</h1><p>Você deixará de receber marketing do GB+. Mensagens necessárias ao acesso e ao serviço continuam disponíveis.</p><button id="unsubscribe" class="primary">Confirmar descadastro</button><p id="status" role="status"></p>'+back;
 document.querySelector('#unsubscribe').onclick=async event=>{
  const button=event.currentTarget;button.disabled=true;
  try{const response=await fetch(cloudConfig.url+'/functions/v1/gbplus-mail-optout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const result=await response.json();if(!response.ok)throw Error(result.error||'Não foi possível confirmar.');main.innerHTML='<h1>Preferência salva</h1><p>Você não receberá mais campanhas de marketing do GB+.</p>'+back;}
  catch(error){document.querySelector('#status').textContent=error.message;button.disabled=false;}
 };
}else{
 const client=createGbplusClient(window.supabase.createClient,cloudConfig);
 try{
  // Await initialization so SDK exchanges PKCE or parses an invite's implicit
  // callback before we inspect the validated identity.
  const session=await client.auth.getSession();if(session.error)throw session.error;
  const result=await client.auth.getUser();
  if(result.error||!result.data?.user)throw Error(invite?'Convite inválido ou expirado. Peça um novo convite ou recupere seu acesso no GB+.':'Entre no GB+ para alterar suas preferências.');
  const user=result.data.user;
  if(invite){
   if(!user.invited_at)throw Error('Esta sessão não foi iniciada por um convite. Use a recuperação de senha no GB+.');
   main.innerHTML=`<h1>Bem-vindo ao GB+</h1><p>${esc(user.email)}</p><p>Defina sua senha pessoal para concluir o acesso.</p><form id="password"><label><span>Nova senha (mínimo de 8 caracteres)</span><input name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label><span>Repita a senha</span><input name="confirmation" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><p id="status" role="alert"></p><button class="primary">Salvar senha e entrar</button></form><p>O administrador não recebe sua senha. Marketing permanece desativado até você autorizar nas configurações.</p>`;
   document.querySelector('#password').onsubmit=async event=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;
    try{const values=new FormData(form);const password=String(values.get('password'));if(Array.from(password).length<8||password!==values.get('confirmation'))throw Error('Confira o tamanho e a confirmação da senha.');const {error}=await client.auth.updateUser({password});if(error)throw Error('Não foi possível salvar a senha. Confira sua sessão e tente novamente.');form.reset();location.replace('./?web=1');}
    catch(error){document.querySelector('#status').textContent=error.message;button.disabled=false;}
   };
  }else{
   const pref=await client.rpc('gbplus_get_consent_state');if(pref.error)throw Error('Não foi possível consultar suas preferências. Tente novamente.');
   main.innerHTML=`<h1>Preferências de e-mail</h1><p>${esc(user.email)}</p><form id="preference"><label class="consent-option"><input id="marketing" type="checkbox" ${pref.data?.marketing?'checked':''}><span>Quero receber novidades, dicas e ofertas do GB+ por e-mail.</span></label><p>Opcional. Você pode retirar esta autorização a qualquer momento. Avisos de acesso e suporte não dependem dessa opção.</p><button class="primary">Salvar preferência</button><p id="status" role="status"></p></form><p>O GB+ registra atividade recente e tempo aproximado de uso em primeiro plano para administração e suporte. <a href="./privacidade.html">Saiba mais na política de privacidade.</a></p>${back}`;
   document.querySelector('#preference').onsubmit=async event=>{
    event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;
    const saved=await client.rpc('gbplus_set_marketing_consent',{p_marketing:document.querySelector('#marketing').checked});
    document.querySelector('#status').textContent=saved.error?'Não foi possível salvar. Tente novamente.':'Preferência salva.';button.disabled=false;
   };
  }
 }catch(error){main.innerHTML=`<h1>${invite?'Confira seu convite':'Acesse sua conta'}</h1><p>${esc(error.message||'Não foi possível continuar.')}</p>${back}`;}
}
