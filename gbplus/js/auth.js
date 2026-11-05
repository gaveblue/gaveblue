import {createGbplusClient} from '../integrations/supabase/client.js';
import {cloudConfig} from './cloud-config.js';
import {esc,icon} from './ui.js';
import {loginRedirectMessage,clearLoginErrorUrl,safeAuthEmail,passwordStrength,isExpiredSessionError} from './auth-flow.js?v=20261105-62';

let client,user=null,recovery=false,working=false,startup=true,pendingEmail='',lastResend=0;
const EMAIL_COOLDOWN_MS=60000,SESSION_NOTICE_KEY='gbplus-session-ended-at',ACTIVE_SESSION_KEY='gbplus-session-was-active';
const storageGet=key=>{try{return sessionStorage.getItem(key);}catch{return null;}};
const storageSet=(key,value)=>{try{sessionStorage.setItem(key,value);}catch{}};
const storageRemove=key=>{try{sessionStorage.removeItem(key);}catch{}};
function noteSessionEnded(){storageSet(SESSION_NOTICE_KEY,String(Date.now()));storageRemove(ACTIVE_SESSION_KEY);}
function noteActiveSession(){storageSet(ACTIVE_SESSION_KEY,'1');storageRemove(SESSION_NOTICE_KEY);}
export function consumeSessionNotice(){
 const stamp=Number(storageGet(SESSION_NOTICE_KEY)||0);storageRemove(SESSION_NOTICE_KEY);
 return stamp>0&&Date.now()-stamp<10*60*1000?'Sua sessão expirou ou foi encerrada em outro dispositivo. Entre novamente para continuar com seus dados salvos.':'';
}
let onChange=()=>{},reloadScheduled=false,logoutRedirectRequested=false;
function refreshAuthOnce(){
 if(reloadScheduled)return;
 reloadScheduled=true;
 onChange();
 setTimeout(()=>{if(logoutRedirectRequested)location.replace('./?web=1');else location.reload();},0);
}
export const currentUser=()=>user;
export const authClient=()=>client;
export const isRecovery=()=>recovery;
export const onlineSelected=()=>true;
export async function signOutAccount(){
 if(!navigator.onLine)throw Error('Você está sem conexão. Conecte-se para sair da conta com segurança.');
 logoutRedirectRequested=true;
 try{
  const {error}=await getClient().auth.signOut({scope:'local'});
  if(error)throw error;
  sessionStorage.removeItem('gbplus-recovery');
  storageRemove(ACTIVE_SESSION_KEY);storageRemove(SESSION_NOTICE_KEY);
  refreshAuthOnce();
 }catch(error){
  logoutRedirectRequested=false;
  throw Error('Não foi possível encerrar a sessão. Verifique sua conexão e tente novamente.');
 }
}

const getClient=()=>client||(client=createGbplusClient(window.supabase?.createClient,cloudConfig));
export function consumeAuthReturnMessage(){
 const message=loginRedirectMessage(location.href);
 if(message){const cleaned=clearLoginErrorUrl(location.href);if(cleaned.changed)try{history.replaceState(history.state,'',cleaned.url);}catch{}}
 return message;
}

export async function initializeAuth(changed){
  onChange=changed;
  getClient().auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){
      recovery=true;sessionStorage.setItem('gbplus-recovery','1');
      if(!startup)setTimeout(()=>showAuth('recovery'),0);
    }
    if(event==='SIGNED_OUT'&&!logoutRedirectRequested&&(user?.id||storageGet(ACTIVE_SESSION_KEY)))noteSessionEnded();
    if(event==='SIGNED_IN'&&session?.user)noteActiveSession();
    if(!startup&&(session?.user?.id||null)!==(user?.id||null)){
      refreshAuthOnce();
    }
  });
  const {data,error}=await client.auth.getSession();
  if(error){
    if(isExpiredSessionError(error)){noteSessionEnded();startup=false;return null;}
    throw Error('Não foi possível recuperar a sessão. Tente entrar novamente.');
  }
  if(data.session){
    const verified=await client.auth.getUser();
    if(verified.error||!verified.data?.user){
      if(isExpiredSessionError(verified.error)){noteSessionEnded();startup=false;return null;}
      throw Error('Não foi possível validar sua sessão. Verifique a conexão ou entre novamente.');
    }
    user=verified.data.user;
    noteActiveSession();
  }else if(storageGet(ACTIVE_SESSION_KEY))noteSessionEnded();
  recovery=recovery||sessionStorage.getItem('gbplus-recovery')==='1';
  startup=false;
  return user;
}

export const googleMark=`<svg class="google-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.31 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg>`;
export const passwordMeetsMinimum=value=>Array.from(String(value||'')).length>=8;
const mailIcon='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg>';
const lockIcon='<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
const action=(label,name,cls='')=>`<button type="button" class="${cls}" data-auth-action="${name}">${label}</button>`;
function input(label,name,type='text',autocomplete=''){
  const password=type==='password';
  return `<label class="auth-input"><span class="sr-only">${label}</span>${password?lockIcon:mailIcon}<input id="auth-${name}" name="${name}" type="${type}" placeholder="${label}" required ${password?'maxlength="128"':'maxlength="254"'} autocomplete="${autocomplete}" ${type==='email'?'inputmode="email" autocapitalize="none" spellcheck="false"':''}>${password?`<button class="password-toggle" type="button" data-auth-action="toggle" data-target="auth-${name}" aria-label="Mostrar ${label.toLowerCase()}" aria-pressed="false">${icon('eye')}</button>`:''}</label>`;
}

export function showAuth(mode='signin',error=''){
 if(!['signin','signup','forgot','recovery','confirm'].includes(mode))mode='signin';
 const gate=document.querySelector('#auth-gate');
 document.body.classList.add('auth-locked');
 const titles={signin:'Bem-vindo de volta',signup:'Crie sua conta',forgot:'Recuperar senha',recovery:'Defina sua nova senha',confirm:'Confirme seu e-mail'};
 const descriptions={
  signin:'Acesse sua conta e continue de onde parou.',
  signup:'Comece gratuitamente a organizar suas finanças no GB+.',
  forgot:'Informe seu e-mail para receber um link de recuperação.',
  recovery:'Escolha uma nova senha com pelo menos 8 caracteres.',
  confirm:'Confira seu e-mail e a pasta de spam. Se precisar, solicite outro link de confirmação.'
 };
 const labels={signin:'Entrar na minha conta',signup:'Criar minha conta',forgot:'Enviar link de recuperação',recovery:'Salvar nova senha',confirm:'Reenviar confirmação'};
 const newPassword=['signup','recovery'].includes(mode);
 const passwordFields=!['forgot','confirm'].includes(mode)
  ?input(mode==='recovery'?'Nova senha':'Senha','password','password',mode==='signin'?'current-password':'new-password')
   +(newPassword?input('Confirmar senha','confirmation','password','new-password'):'')
   +(newPassword?'<p id="auth-password-rule" class="auth-password-rule" aria-live="polite">Mínimo de 8 caracteres. Pode usar letras, números ou símbolos, sem combinação obrigatória.</p><div id="auth-password-strength" class="auth-password-strength" data-level="empty" aria-live="polite"><div class="auth-strength-track" aria-hidden="true"><span></span></div><span class="auth-strength-label">Força da senha: informe uma senha</span></div><p id="auth-confirmation-feedback" class="auth-confirmation-feedback" aria-live="polite">Repita a senha para confirmar.</p>':'')
  :'';
 gate.hidden=false;
 gate.innerHTML=
  '<section class="auth-page auth-refresh" data-mode="'+mode+'" aria-labelledby="auth-title">'+
   '<div class="auth-layout">'+
    '<aside class="auth-story" aria-label="Apresentação do GB+">'+
     '<div class="auth-story-header"><a class="auth-story-logo" href="./apresentacao.html" aria-label="GB+ página institucional">GB<span>+</span></a><span>GESTÃO FINANCEIRA</span></div>'+
     '<div class="auth-story-content">'+
      '<p class="auth-story-eyebrow">GESTÃO FINANCEIRA, DO SEU JEITO.</p>'+
      '<h2>Seu financeiro começa aqui<span>.</span></h2>'+
      '<p>Mais controle das suas contas, clareza para as suas decisões e planejamento em um só lugar.</p>'+
      '<div class="auth-story-preview" aria-hidden="true"><div class="auth-story-phone"><span class="auth-story-camera"></span><img src="./assets/gbplus-dashboard-real.svg" alt="" width="220" height="476" decoding="async"></div></div>'+
     '</div>'+
     '<div class="auth-story-footer"><span>Organize • Acompanhe • Planeje</span><span>GB+ Gestão Financeira</span></div>'+
    '</aside>'+
    '<div class="auth-access">'+
     '<nav class="auth-access-nav" aria-label="Retornar à apresentação"><a href="./apresentacao.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6"/></svg>Voltar ao site</a></nav>'+
     '<div class="auth-card">'+
      '<header class="auth-brand"><div class="auth-wordmark" aria-label="GB+">GB<span>+</span></div><p>Gestão Financeira</p></header>'+
      '<h1 id="auth-title" class="auth-title">'+titles[mode]+'</h1>'+
      '<p class="auth-description">'+descriptions[mode]+'</p>'+
      '<form id="auth-form" data-mode="'+mode+'">'+
       (mode!=='recovery'?input('E-mail','email','email','email'):'')+
       passwordFields+
       '<div class="form-error" role="alert">'+esc(error)+'</div>'+
       '<div class="auth-message" role="status"></div>'+
       '<button type="submit" class="auth-primary">'+labels[mode]+'</button>'+
      '</form>'+
      (mode==='signin'?action('Esqueci minha senha','forgot','auth-forgot'):'')+
      (['signin','signup'].includes(mode)?'<div class="auth-divider"><span>ou</span></div>'+action(googleMark+'<span>Continuar com o Google</span>','google','auth-google'):'')+
      '<div class="auth-bottom">'+
       (mode==='signin'?'<p>Ainda não tem uma conta?</p>'+action('Cadastre-se gratuitamente','signup','auth-text-link'):
        mode==='signup'?'<p>Já tem uma conta?</p>'+action('Fazer login','signin','auth-text-link'):
        mode==='confirm'?action('Já confirmei meu e-mail','continue','auth-text-link')+action('Voltar ao login','signin','auth-text-link'):
        mode==='recovery'&&user?action('Voltar ao financeiro','continue','auth-text-link'):action('Voltar ao login','signin','auth-text-link'))+
      '</div>'+
      (mode==='signin'&&/link|expirou|inválido|usado/i.test(error)?'<p class="auth-recovery-help">Problemas com um link de recuperação? '+action('Solicitar outro link','forgot','auth-text-link')+'</p>':'')+
      '<p class="auth-footer">Seu financeiro. Mais simples.<br><a href="./privacidade.html">Política de Privacidade</a></p>'+
     '</div>'+
    '</div>'+
   '</div>'+
  '</section>';
 const password=gate.querySelector('[name=password]');
 if(password&&newPassword)password.minLength=8;
 const confirmation=gate.querySelector('[name=confirmation]');
 if(confirmation&&newPassword)confirmation.minLength=8;
 const email=gate.querySelector('[name=email]');
 if(email&&pendingEmail)email.value=pendingEmail;
}

// Edit only the active Supabase Auth identity; the financial repository is untouched.
// Note: Auth user metadata is available to the signed-in client and must not be
// mistaken for a document-vault or a server-verified CPF identity.
export async function updatePersonalProfile(profile){
 if(!user?.id)throw Error('É necessário entrar na sua conta para editar o perfil.');
 if(!navigator.onLine)throw Error('Conecte-se à internet para salvar as informações do perfil.');
 const {data,error}=await getClient().auth.updateUser({
  data:{full_name:profile.full_name,gbplus_profile:profile}
 });
 if(error)throw Error(authError(error));
 if(!data?.user||data.user.id!==user.id)throw Error('Não foi possível confirmar a atualização do perfil.');
 user=data.user;
 return user;
}

export async function requestProfileEmail(email){
 if(!user?.id)throw Error('Entre na sua conta para alterar o e-mail.');
 if(!navigator.onLine)throw Error('Conecte-se à internet para solicitar a alteração do e-mail.');
 if(user.email?.toLowerCase()===email.toLowerCase())return {unchanged:true};
 const currentId=user.id;
 const {data,error}=await getClient().auth.updateUser(
  {email},{emailRedirectTo:cloudConfig.siteUrl}
 );
 if(error)throw Error(authError(error));
 if(data?.user?.id&&data.user.id!==currentId)throw Error('A resposta de alteração de e-mail não corresponde à sua conta.');
 if(data?.user)user=data.user;
 return {unchanged:false,pending:user.email?.toLowerCase()!==email.toLowerCase()};
}

export function accountCard(){
  return `<section class="panel settings-card account-card"><span class="eyebrow">SUA CONTA GB+</span><h2>Seu financeiro online</h2><p>Conectado como <strong>${esc(user?.email)}</strong>. Use o mesmo login no computador e no celular. Cada conta tem seus próprios registros.</p><div class="button-stack"><a href="#profile" class="button">${icon('user')} Editar meu perfil</a>${action('Atualizar dados online','refresh','button')}${action('Sair da conta','signout','button')}</div><small>Atualização automática a cada minuto, sem interromper formulários. Gravações exigem conexão.</small><small>Se você usou a versão local, seus registros anteriores continuam neste navegador. Exporte uma cópia e use Restaurar backup para importá-la, com confirmação.</small><div class="button-stack"><button class="button" data-action="legacy-backup">Exportar registros locais antigos</button></div></section>`;
}

export function authError(error){
 const messages={
  invalid_credentials:'E-mail ou senha incorretos.',
  email_not_confirmed:'Confirme seu e-mail antes de entrar. Você pode reenviar a confirmação.',
  over_email_send_rate_limit:'Muitos e-mails solicitados. Aguarde antes de pedir outro link.',
  over_request_rate_limit:'Muitas tentativas de acesso. Aguarde alguns minutos antes de tentar novamente.',
  email_address_not_authorized:'O envio de e-mails ainda precisa ser ativado pelo administrador do GB+.',
  user_already_exists:'Se já possui conta, use login ou recuperação de senha.',
  weak_password:'Esta senha não foi aceita pela segurança do servidor. Tente outra senha mais longa e menos previsível.',
  otp_expired:'Este link expirou ou já foi utilizado. Solicite um novo link de recuperação ou confirmação.',
  bad_code_verifier:'O link foi aberto em outro navegador ou não é mais válido. Solicite novo link no mesmo navegador.',
  flow_state_not_found:'O retorno do link não foi reconhecido. Solicite novo link e abra-o no mesmo navegador.',
  invalid_grant:'Este link não é mais válido. Solicite um novo link.',
  token_expired:'O link expirou. Solicite um novo link.',
  provider_disabled:'O login com Google ainda está sendo configurado.',
  email_provider_disabled:'O cadastro por e-mail não está disponível neste momento.',
  validation_failed:'Verifique os dados informados.',
  signup_disabled:'O cadastro de novas contas está temporariamente desativado.'
 };
 if(messages[error?.code])return messages[error.code];
 if(error?.status===429)return 'Muitas solicitações em pouco tempo. Aguarde alguns minutos antes de tentar novamente.';
 return 'Não foi possível concluir. Verifique sua conexão e tente novamente. Se o problema continuar, contate o administrador do GB+.';
}

function feedback(text,error=true){
  const target=document.querySelector(error?'#auth-form .form-error':'#auth-form .auth-message');
  if(target)target.textContent=text;
}
function setWorking(value){
 working=value;
 document.querySelectorAll('#auth-gate button').forEach(el=>el.disabled=value);
 const form=document.querySelector('#auth-form');
 form?.setAttribute('aria-busy',String(value));
 if(form){
  const submit=form.querySelector('button[type="submit"]');
  if(submit){
   if(value){submit.dataset.label=submit.textContent;submit.textContent='Aguarde…';}
   else if(submit.dataset.label){submit.textContent=submit.dataset.label;delete submit.dataset.label;}
  }
 }
}
export async function startGoogle(){
 if(!navigator.onLine)throw Error('Você está sem internet. Conecte-se para entrar com o Google.');
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),9000);
 let settings;
 try{
  const response=await fetch(cloudConfig.url+'/auth/v1/settings',{headers:{apikey:cloudConfig.publishableKey},cache:'no-store',signal:abort.signal});
  if(!response.ok)throw Error('O serviço de login não respondeu. Tente novamente.');
  settings=await response.json();
 }catch(error){
  if(error.name==='AbortError')throw Error('O Google demorou para responder. Confira a conexão e tente novamente.');
  if(error.message.includes('serviço de login'))throw error;
  throw Error('Não foi possível conectar ao serviço de login. Tente novamente.');
 }finally{clearTimeout(timer);}
 if(!settings?.external?.google)throw Error('O login com Google ainda não está habilitado no Supabase.');
 // PKCE requires the return to be opened in the SAME browser/storage context.
 // Do not use a new tab or a different domain for the OAuth redirect.
 const {error}=await getClient().auth.signInWithOAuth({
  provider:'google',options:{redirectTo:cloudConfig.siteUrl,queryParams:{prompt:'select_account'}}
 });
 if(error)throw Error(authError(error));
}

document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-auth-action]');if(!target)return;
  event.preventDefault();if(working)return;
  const name=target.dataset.authAction;
  if(name==='toggle'){
    const field=document.getElementById(target.dataset.target);const visible=field.type==='password';field.type=visible?'text':'password';
    target.setAttribute('aria-pressed',String(visible));target.setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha');return;
  }
  if(name==='refresh'){window.dispatchEvent(new Event('gbplus-refresh'));return;}
  if(name==='continue'){location.reload();return;}
  if(name==='google'){
    setWorking(true);try{await startGoogle();}catch(error){feedback(error.message);}finally{setWorking(false);}return;
  }
  if(name==='signout'){
    setWorking(true);
    try{await signOutAccount();}
    catch(error){window.dispatchEvent(new CustomEvent('gbplus-message',{detail:error.message}));}
    finally{setWorking(false);}return;
  }
  showAuth(name);
});

export function syncPasswordFeedback(form){
 if(!['signup','recovery'].includes(form?.dataset?.mode))return;
 const password=form.querySelector('[name="password"]'),confirmation=form.querySelector('[name="confirmation"]');
 if(!password||!confirmation)return;
 const text=String(password.value||''),count=Array.from(text).length;
 const rule=form.querySelector('#auth-password-rule');
 if(rule){
  rule.dataset.valid=String(count>=8);
  rule.textContent=count===0?'Mínimo de 8 caracteres. Pode usar letras, números ou símbolos, sem combinação obrigatória.':
   count>=8?'✓ Mínimo de 8 caracteres atendido.':'Faltam '+(8-count)+' caracteres para o mínimo de 8.';
 }
 const meter=form.querySelector('#auth-password-strength');
 if(meter){
  const strength=passwordStrength(text);
  meter.dataset.level=strength.level;
  const label=meter.querySelector('.auth-strength-label');
  if(label)label.textContent=strength.label?'Força da senha: '+strength.label:'Força da senha: informe uma senha';
 }
 const feedback=form.querySelector('#auth-confirmation-feedback');
 const confirmText=String(confirmation.value||'');
 const match=confirmText.length>0&&text===confirmText;
 if(feedback){
  feedback.dataset.status=!confirmText?'neutral':match?'valid':'invalid';
  feedback.textContent=!confirmText?'Repita a senha para confirmar.':match?'✓ As senhas coincidem.':'As senhas ainda não coincidem.';
 }
 if(confirmText)confirmation.setAttribute('aria-invalid',String(!match));
 else confirmation.removeAttribute('aria-invalid');
}
document.addEventListener('input',event=>{
 const field=event.target;
 if(!['password','confirmation'].includes(field?.name))return;
 syncPasswordFeedback(field.closest?.('#auth-form'));
});
document.addEventListener('change',event=>{
 if(['password','confirmation'].includes(event.target?.name))syncPasswordFeedback(event.target.closest?.('#auth-form'));
});

document.addEventListener('submit',async event=>{
 if(event.target.id!=='auth-form')return;
 event.preventDefault();event.stopImmediatePropagation();if(working)return;
 const form=event.target,mode=form.dataset.mode,values=Object.fromEntries(new FormData(form));
 const email=String(values.email||'').trim().toLowerCase();
 feedback('');feedback('',false);
 if(mode!=='recovery'&&!safeAuthEmail(email)){feedback('Informe um endereço de e-mail válido.');return;}
 if(['signup','recovery'].includes(mode)&&values.password!==values.confirmation){feedback('As senhas precisam ser iguais.');return;}
 if(['signup','recovery'].includes(mode)&&!passwordMeetsMinimum(values.password)){feedback('A senha precisa ter pelo menos 8 caracteres. Letras, números e símbolos podem ser usados livremente.');return;}
 if(!navigator.onLine){feedback('Sem conexão. Conecte-se para continuar.');return;}
 if(['confirm','forgot'].includes(mode)&&Date.now()-lastResend<EMAIL_COOLDOWN_MS){
  const remaining=Math.ceil((EMAIL_COOLDOWN_MS-(Date.now()-lastResend))/1000);
  feedback('Aguarde '+remaining+' segundos antes de solicitar outro e-mail.');return;
 }
 setWorking(true);
 try{
  const auth=getClient().auth;let result;
  if(mode==='signin')result=await auth.signInWithPassword({email,password:values.password});
  if(mode==='signup')result=await auth.signUp({email,password:values.password,options:{emailRedirectTo:cloudConfig.siteUrl}});
  if(mode==='forgot')result=await auth.resetPasswordForEmail(email,{redirectTo:cloudConfig.siteUrl});
  if(mode==='confirm')result=await auth.resend({type:'signup',email,options:{emailRedirectTo:cloudConfig.siteUrl}});
  if(mode==='recovery')result=await auth.updateUser({password:values.password});
  if(result?.error){
   if(mode==='signin'&&result.error.code==='email_not_confirmed'){
    pendingEmail=email;showAuth('confirm',authError(result.error));return;
   }
   feedback(authError(result.error));return;
  }
  if(mode==='signin'||(mode==='signup'&&result?.data?.session)){
   refreshAuthOnce();return;
  }
  if(mode==='signup'){
   lastResend=Date.now();pendingEmail=email;showAuth('confirm');
   feedback('Cadastro solicitado. Confira seu e-mail para confirmar a conta. Se não chegar, você poderá reenviar o link.',false);
  }else if(mode==='confirm'){
   lastResend=Date.now();
   pendingEmail=email;
   feedback('Se o cadastro precisar de confirmação, um novo link será enviado. Confira também a pasta de spam.',false);
  }else if(mode==='forgot'){
   lastResend=Date.now();form.reset();
   feedback('Se o e-mail estiver cadastrado, você receberá um link de recuperação. Abra-o no mesmo navegador em que fez a solicitação.',false);
  }else if(mode==='recovery'){
   recovery=false;sessionStorage.removeItem('gbplus-recovery');
   feedback('Senha atualizada. Agora você pode voltar ao financeiro.',false);
  }
 }catch(error){
  feedback(error?.status||error?.code?authError(error):error?.message?.includes('fetch')?'Falha de conexão. Confira sua internet e tente novamente.':'Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente.');
 }finally{setWorking(false);}
},true);
