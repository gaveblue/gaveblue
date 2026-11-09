// GB+ 2.8.6 — aceite versionado, confirmado pelo Supabase (não em localStorage).
// Marketing é escolha independente, não obrigatória e desmarcada por padrão.
export const LEGAL_VERSION='2026-11-08-v1';
export const TERMS_URL='./termos-de-uso.html';
export const PRIVACY_URL='./privacidade.html';
const errorText=error=>String(error?.message||'Não foi possível registrar a escolha. Verifique sua conexão e tente novamente.').slice(0,240);

export function needsLegalAcceptance(state){
 return !state||state.terms_version!==LEGAL_VERSION||state.privacy_version!==LEGAL_VERSION;
}

export async function readConsent(client){
 const {data,error}=await client.rpc('gbplus_get_consent_state');
 if(error)throw Error('Não foi possível consultar os termos. Confira a conexão e tente novamente.');
 return data;
}

// Ao trocar a política, o usuário atual também precisa aceitar antes de abrir os dados.
// Nunca marcar marketing=true com base em dados do navegador, signup ou Google metadata.
export async function requireLegalAcceptance(client){
 const saved=await readConsent(client);
 if(!needsLegalAcceptance(saved))return saved;
 const gate=document.querySelector('#auth-gate');
 if(!gate)throw Error('Tela de atualização dos termos indisponível.');
 document.body.classList.add('auth-locked');gate.hidden=false;
 gate.innerHTML=`<section class="auth-page auth-refresh gb-legal-page" aria-labelledby="gb-legal-title">
  <div class="auth-card gb-legal-card">
   <header class="auth-brand"><div class="auth-wordmark">GB<span>+</span></div><p>Gestão Financeira</p></header>
   <h1 class="auth-title" id="gb-legal-title">Atualizamos nossos termos</h1>
   <p class="auth-description">Estamos atualizando nossos Termos de Uso e nossa Política de Privacidade para explicar melhor como seus dados são tratados, suas escolhas de comunicação e os recursos do aplicativo.</p>
   <form id="gb-legal-form">
    <label class="gb-legal-consent">
     <input type="checkbox" name="terms" required>
     <span>Li e concordo com os <a href="${TERMS_URL}" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e estou ciente da <a href="${PRIVACY_URL}" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.</span>
    </label>
    <label class="gb-legal-consent">
     <input type="checkbox" name="marketing">
     <span>Quero receber, por e-mail, novidades, dicas e comunicações promocionais do GB+. <small>Opcional. Posso cancelar a qualquer momento em Mais › Preferências de e-mail. Meus lançamentos financeiros não serão enviados para campanhas de marketing.</small></span>
    </label>
    <p class="gb-legal-hint">A escolha sobre e-mails promocionais não afeta seu acesso ao GB+. Mensagens necessárias para segurança e recuperação de conta continuam disponíveis.</p>
    <p class="gb-legal-error" role="alert" aria-live="polite"></p>
    <button class="auth-primary" type="submit">Salvar escolhas e continuar</button>
    <button type="button" class="auth-forgot" id="gb-legal-logout">Sair da conta</button>
   </form>
  </div></section>`;
 return new Promise((resolve,reject)=>{
  const form=gate.querySelector('#gb-legal-form');
  const feedback=form.querySelector('.gb-legal-error'),button=form.querySelector('[type=submit]');
  let saving=false;
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(saving)return;
   if(!form.elements.terms.checked){feedback.textContent='É necessário aceitar os termos para usar esta versão do GB+.';return;}
   saving=true;button.disabled=true;feedback.textContent='';
   try{
    const {data,error}=await client.rpc('gbplus_accept_updated_policies',{
      p_accept_terms:true,p_marketing:form.elements.marketing.checked
    });
    if(error||!data?.ok||data.terms_version!==LEGAL_VERSION)throw Error(errorText(error));
    resolve(data);
   }catch(error){feedback.textContent=errorText(error);}
   finally{saving=false;button.disabled=false;}
  });
  gate.querySelector('#gb-legal-logout').addEventListener('click',async()=>{
   if(saving)return;
   try{await client.auth.signOut({scope:'local'});location.reload();}
   catch(error){feedback.textContent=errorText(error);}
  });
 });
}

export async function setMarketingConsent(client,enabled){
 if(typeof enabled!=='boolean')throw Error('Escolha inválida.');
 const {data,error}=await client.rpc('gbplus_set_marketing_consent',{p_marketing:enabled});
 if(error||!data?.ok)throw Error(errorText(error));
 return data;
}
