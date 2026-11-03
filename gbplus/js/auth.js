import {createGbplusClient} from '../integrations/supabase/client.js';
import {cloudConfig} from './cloud-config.js';
import {esc,field} from './ui.js';

const MODE='gbplus-mode-v1';
let client, user=null, recovery=false, working=false, startup=true;
let onChange=()=>{};
export const currentUser=()=>user;
export const onlineSelected=()=>localStorage.getItem(MODE)==='online';
export const authClient=()=>client;
export const isRecovery=()=>recovery;

export async function initializeAuth(changed){
  onChange=changed;
  client=createGbplusClient(window.supabase?.createClient,cloudConfig);
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){
      recovery=true;
      sessionStorage.setItem('gbplus-recovery','1');
      if(!startup)setTimeout(()=>showAuth('recovery'),0);
    }
    if(!startup && (session?.user?.id||null)!==(user?.id||null)){
      // Immediately hide the old account, then restart outside the auth lock.
      onChange();
      setTimeout(()=>location.reload(),0);
    }
  });
  const {data,error}=await client.auth.getSession();
  if(error)throw Error('Não foi possível recuperar a sessão. Abra o acesso online e tente entrar novamente.');
  user=data.session?.user||null;
  if(user)localStorage.setItem(MODE,'online');
  recovery=recovery||sessionStorage.getItem('gbplus-recovery')==='1';
  startup=false;
  if(!user&&onlineSelected())throw Error('Sua sessão online terminou. Entre novamente ou escolha abrir os registros locais.');
  return user;
}

const authButton=(label,action)=>`<button type="button" class="button" data-auth-action="${action}">${label}</button>`;
export function accountCard(){
  return `<section class="panel settings-card account-card"><span class="eyebrow">SUA CONTA GB+</span><h2>${user?'Seu financeiro online':'Seu financeiro em qualquer lugar'}</h2><p>${user?`Conectado como <strong>${esc(user.email)}</strong>. Use este mesmo login no computador e no celular. Cada login tem seus próprios registros.`:'Entre para acessar seus dados online. Os registros deste navegador continuam guardados separadamente.'}</p><div class="button-stack">${user?`${authButton('Atualizar dados online','refresh')}${authButton('Sair e abrir modo local','signout')}`:authButton('Entrar na conta online','signin')}</div>${!cloudConfig.emailReady?'<small>Novos cadastros e recuperação por e-mail aguardam a configuração do envio de e-mails. Contas já confirmadas podem entrar.</small>':''}<small>${user?'Atualização automática a cada minuto enquanto a tela estiver aberta e sem formulário em edição. Gravações online exigem conexão.':'Para levar dados locais à conta online: exporte um backup, entre e restaure o arquivo. A restauração pede confirmação e substitui os dados da conta.'}</small></section>`;
}

export function showAuth(mode='signin'){
  let dialog=document.querySelector('#auth-modal');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='auth-modal';document.body.append(dialog);}
  const titles={signin:'Entrar no GB+',signup:'Criar conta',forgot:'Recuperar senha',recovery:'Definir nova senha'};
  const submit={signin:'Entrar',signup:'Criar minha conta',forgot:'Enviar link',recovery:'Salvar nova senha'};
  dialog.innerHTML=`<div class="modal-heading"><h2 id="auth-title">${titles[mode]}</h2>${authButton('Fechar','close')}</div><div class="modal-body"><p class="muted">${mode==='signin'?'Acesse os mesmos registros em seus dispositivos.':mode==='signup'?'Cada conta começa com um financeiro vazio e privado.':mode==='recovery'?'Escolha uma senha com pelo menos 8 caracteres.':'Enviaremos um link de recuperação, se a conta estiver cadastrada.'}</p>${!cloudConfig.emailReady&&['signup','forgot'].includes(mode)?'<p class="auth-notice">O envio de e-mails ainda está em preparação. Por enquanto, o Supabase restringe os destinatários aos membros autorizados do projeto.</p>':''}<form id="auth-form" data-mode="${mode}">${mode!=='recovery'?field('E-mail','email','','email','required autocomplete="email" maxlength="254"'):''}${mode!=='forgot'?field(mode==='recovery'?'Nova senha':'Senha','password','','password',`required minlength="${mode==='signin'?1:8}" maxlength="128" autocomplete="${mode==='signin'?'current-password':'new-password'}"`):''}${['signup','recovery'].includes(mode)?field('Confirmar senha','confirmation','','password','required minlength="8" maxlength="128" autocomplete="new-password"'):''}<div class="form-error" role="alert"></div><div class="auth-message" role="status"></div><div class="form-footer"><button type="submit" class="button primary">${submit[mode]}</button></div></form><div class="auth-links">${mode==='signin'?`${authButton('Criar conta','signup')}${authButton('Esqueci minha senha','forgot')}`:authButton('Voltar ao login','signin')}</div><p class="form-hint">O login do GB+ é separado do acesso administrativo ao painel Supabase.</p></div>`;
  dialog.setAttribute('aria-labelledby','auth-title');
  if(!dialog.open)dialog.showModal();
}

function authError(error){
  const messages={invalid_credentials:'E-mail ou senha incorretos.',email_not_confirmed:'Confirme seu e-mail antes de entrar.',over_email_send_rate_limit:'Limite de envio atingido. Aguarde antes de solicitar outro e-mail.',email_address_not_authorized:'O envio para este endereço depende da configuração de e-mails do GB+.',user_already_exists:'Já existe uma conta para este e-mail.',weak_password:'Use uma senha mais forte, com pelo menos 8 caracteres.',otp_expired:'O link expirou. Solicite um novo link de recuperação.'};
  return messages[error.code]||'Não foi possível concluir. Verifique sua conexão e os dados informados. Se envolve e-mail, o serviço de envio pode ainda não estar configurado.';
}

document.addEventListener('click',async event=>{
  const target=event.target.closest('[data-auth-action]');if(!target)return;
  event.preventDefault();if(working)return;
  const action=target.dataset.authAction;
  if(action==='close'){const dialog=document.querySelector('#auth-modal');if(dialog){dialog.close();dialog.innerHTML='';}return;}
  if(action==='refresh'){window.dispatchEvent(new Event('gbplus-refresh'));return;}
  if(action==='signout'||action==='local'){
    working=true;
    try{
      // Explicit switch only; online errors never silently select local data.
      if(client){const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;}
      localStorage.setItem(MODE,'local');sessionStorage.removeItem('gbplus-recovery');
      onChange();location.reload();
    }catch{window.dispatchEvent(new CustomEvent('gbplus-message',{detail:'Não foi possível encerrar a sessão. Verifique a conexão e tente novamente.'}));}
    finally{working=false;}
    return;
  }
  showAuth(action);
});

document.addEventListener('submit',async event=>{
  if(event.target.id!=='auth-form')return;
  event.preventDefault();event.stopImmediatePropagation();if(working)return;
  const form=event.target,mode=form.dataset.mode,values=Object.fromEntries(new FormData(form));
  const errorArea=form.querySelector('.form-error'),message=form.querySelector('.auth-message');
  errorArea.textContent='';message.textContent='';
  if(['signup','recovery'].includes(mode)&&values.password!==values.confirmation){errorArea.textContent='As senhas precisam ser iguais.';return;}
  working=true;form.querySelector('button[type=submit]').disabled=true;
  try{
    if(!client)client=createGbplusClient(window.supabase?.createClient,cloudConfig);
    let result;
    if(mode==='signin')result=await client.auth.signInWithPassword({email:values.email.trim(),password:values.password});
    if(mode==='signup')result=await client.auth.signUp({email:values.email.trim(),password:values.password,options:{emailRedirectTo:cloudConfig.siteUrl}});
    if(mode==='forgot')result=await client.auth.resetPasswordForEmail(values.email.trim(),{redirectTo:cloudConfig.siteUrl});
    if(mode==='recovery')result=await client.auth.updateUser({password:values.password});
    if(result.error){errorArea.textContent=authError(result.error);return;}
    form.reset();
    if(mode==='signin'||(mode==='signup'&&result.data.session)){
      localStorage.setItem(MODE,'online');onChange();location.reload();return;
    }
    if(mode==='recovery'){
      recovery=false;sessionStorage.removeItem('gbplus-recovery');message.textContent='Senha atualizada. Você já pode fechar esta janela.';
    }else message.textContent=mode==='signup'?'Confira seu e-mail para confirmar a conta. Abra o link neste mesmo navegador.':'Se o endereço estiver cadastrado e autorizado, você receberá um link. Abra-o neste mesmo navegador.';
  }catch{errorArea.textContent='Não foi possível conectar. Verifique sua conexão e tente novamente.';}
  finally{working=false;if(form.isConnected)form.querySelector('button[type=submit]').disabled=false;}
},true);
