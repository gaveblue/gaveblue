// Cadastro do consumidor, RC32. Dados pessoais permanecem apenas na memória até autenticação.
export const digits=v=>String(v??'').replace(/\D/g,'');
export function cpfValid(v){
 const n=digits(v);if(!/^\d{11}$/.test(n)||/^(\d)\1{10}$/.test(n))return false;
 for(let k=9;k<=10;k++){let sum=0;for(let i=0;i<k;i++)sum+=Number(n[i])*(k+1-i);if((sum*10%11)%10!==Number(n[k]))return false}
 return true;
}
const states='AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const slugOk=s=>typeof s==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)&&s.length<=60;
const returnKey='intervalo.customer.return.v1';
export function returnTarget(link){
 const q=new URLSearchParams(location.search);let slug=q.get('voltar')==='checkout'?q.get('loja'):null;
 try{if(slugOk(slug))sessionStorage.setItem(returnKey,slug);else slug=sessionStorage.getItem(returnKey)}catch{}
 return slugOk(slug)?link('/checkout?loja='+encodeURIComponent(slug)):link('/explorar');
}
export function clearReturnTarget(){try{sessionStorage.removeItem(returnKey)}catch{}}
export function finishCustomer(link){
 const target=returnTarget(link);try{sessionStorage.removeItem(returnKey)}catch{}location.assign(target);
}
const redirect=()=>location.origin+'/intervalo/cliente/';
export async function googleLogin(auth){
 const {error}=await auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect()}});
 if(error)throw error;
}
export function googleButton(){
 return '<button type="button" id="iv-client-google" class="iv-client-google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.97 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9h12.94c-.58 2.96-2.22 5.48-4.75 7.18l7.72 5.99c4.51-4.16 7.07-10.29 7.07-17.62Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.77 24c0-1.59.28-3.13.76-4.59l-7.97-6.19A23.93 23.93 0 0 0 0 24c0 3.86.92 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.83l-7.72-5.99A14.35 14.35 0 0 1 24 38.5c-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48Z"/></svg> Continuar com Google</button>';
}
export function onboardingStyle(){return "<style>\n.iv-client-welcome{text-align:center;max-width:420px}.iv-client-welcome h1{letter-spacing:-.7px}.iv-client-welcome .iv-client-card{box-shadow:none;padding:20px}.iv-client-welcome .iv-client-primary,.iv-client-welcome .iv-client-secondary{width:100%;min-height:46px}.iv-client-welcome .iv-client-guest{display:block;margin:18px 0;text-align:center;color:#6b7788;font-size:13px}.iv-client-welcome .iv-client-brand-mark{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 17px;border-radius:19px;background:#ff7900;color:#fff;font-size:33px;font-style:italic;font-weight:900}\ndialog.iv-client-sheet{position:fixed;inset:auto 0 0;margin:0 auto;padding:0;width:min(100%,540px);max-width:100%;max-height:min(88dvh,var(--iv-client-height,98dvh));border:0;outline:0;border-radius:23px 23px 0 0;overflow:visible;background:#fff;color:#26364b;box-shadow:0 -12px 40px #19283b26}dialog.iv-client-sheet:not([open]){display:none!important}dialog.iv-client-sheet::backdrop{background:#17243699}.iv-client-sheet-frame{display:flex;flex-direction:column;max-height:min(88dvh,var(--iv-client-height,98dvh));overflow:hidden;border-radius:23px 23px 0 0;background:#fff}dialog.iv-client-sheet.is-expanded,dialog.iv-client-sheet.is-expanded .iv-client-sheet-frame{max-height:var(--iv-client-height,98dvh)}.iv-client-sheet-grip{height:27px;flex:none;display:grid;place-items:center;touch-action:none;cursor:ns-resize}.iv-client-sheet-grip span{width:42px;height:5px;border-radius:99px;background:#d8dee7}.iv-client-sheet-header{position:static!important;display:flex;justify-content:space-between;gap:10px;padding:0 19px 13px;background:#fff;border:0!important;flex:none}.iv-client-sheet-header>div{min-width:0;flex:1}.iv-client-sheet-header h2{font-size:22px;letter-spacing:-.6px;margin:7px 0 4px;line-height:1.2}.iv-client-sheet-header p{margin:0;font-size:12px}.iv-client-sheet-header .iv-client-step{margin:9px 0}.iv-client-sheet-x{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:10px;background:#f3f5f7;color:#64748b;font-size:24px;line-height:1;cursor:pointer;flex:none}.iv-client-sheet-scroll{overflow-y:auto;min-height:0;flex:1;padding:5px 19px 13px;overscroll-behavior:contain}.iv-client-sheet-scroll .iv-client-form{gap:11px}.iv-client-sheet-scroll .iv-client-form input,.iv-client-sheet-scroll .iv-client-form select{min-height:46px;font:inherit;font-size:16px;padding:10px 11px;width:100%;min-width:0;box-sizing:border-box;border:1px solid #dce2e9;background:#fff;border-radius:11px;color:#26364b}.iv-client-sheet-scroll .iv-client-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:9px}.iv-client-sheet-scroll .iv-client-form small{font-size:11px;font-weight:400;line-height:1.4}.iv-client-sheet-scroll .iv-client-consent{display:flex!important;align-items:flex-start;font-size:12px!important;line-height:1.5;font-weight:400!important;gap:7px}.iv-client-sheet-scroll .iv-client-consent input{width:18px!important;min-height:18px!important;flex:none;accent-color:#ff7900}.iv-client-sheet-scroll .iv-client-error:empty{display:none}.iv-client-sheet-footer{display:flex;gap:9px;padding:12px 19px max(14px,env(safe-area-inset-bottom));border-top:1px solid #e9edf2;background:#fff;flex:none}.iv-client-sheet-footer .iv-client-primary{flex:1;min-height:46px}.iv-client-sheet-footer .iv-client-secondary{min-height:46px}.iv-client-password{position:relative;display:block}.iv-client-password input{padding-right:50px!important}.iv-client-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:42px;height:40px;border:0;background:transparent;color:#64748b;border-radius:10px;cursor:pointer}.iv-client-eye[aria-pressed=true]{color:#e86f00}.iv-client-eye:focus-visible,.iv-client-sheet-x:focus-visible{outline:2px solid #ff9b47}.iv-client-sheet button:disabled{opacity:.55;cursor:wait}@media(max-width:350px){.iv-client-sheet-scroll .iv-client-grid{grid-template-columns:1fr}.iv-client-sheet-header,.iv-client-sheet-scroll,.iv-client-sheet-footer{padding-left:15px;padding-right:15px}}@media(max-height:430px){.iv-client-sheet-header p{display:none}.iv-client-sheet-header h2{font-size:18px}.iv-client-sheet-grip{height:18px}.iv-client-sheet-footer{padding-top:7px;padding-bottom:7px}}\n</style>"+'<style>.iv-client-wizard{max-width:460px;margin:16px auto 90px}.iv-client-wizard h1{font-size:27px;margin:12px 0 5px;letter-spacing:-.7px}.iv-client-step{display:flex;gap:6px;margin:20px 0 18px}.iv-client-step i{height:4px;background:#e7ebf1;border-radius:8px;flex:1}.iv-client-step i.active{background:#ff7900}.iv-client-wizard .iv-client-form{gap:12px}.iv-client-wizard .iv-client-form input,.iv-client-wizard .iv-client-form select{font:inherit;font-size:14px;min-height:46px;box-sizing:border-box;width:100%;border:1px solid #dce2e9;border-radius:11px;padding:10px;background:#fff;color:#263249}.iv-client-wizard .iv-client-form input:focus{outline:2px solid #fed7aa}.iv-client-wizard .iv-client-form small{font-weight:400;color:#8290a0;font-size:11px;line-height:1.5}.iv-client-google{display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 16px;border:1px solid #dce2e9;background:#fff;color:#334155;border-radius:12px;width:100%;font:inherit;font-size:14px;font-weight:650;cursor:pointer}.iv-client-divider{display:flex;align-items:center;gap:12px;font-size:12px;color:#8995a5;margin:17px 0}.iv-client-divider:before,.iv-client-divider:after{content:"";height:1px;background:#e6eaf0;flex:1}.iv-client-wizard .iv-client-actions{display:flex;gap:8px}.iv-client-wizard .iv-client-primary{flex:1;min-height:46px}.iv-client-wizard .iv-client-consent{display:flex!important;grid-template-columns:none!important;align-items:flex-start;font-size:12px!important;line-height:1.5;font-weight:400!important}.iv-client-wizard .iv-client-consent input{width:18px!important;min-height:18px!important;margin:2px 6px 0 0;flex:none;accent-color:#ff7900}.iv-client-wizard a{color:#d96b00;text-decoration:underline}.iv-client-wizard .iv-client-card{padding:18px;margin-top:12px}.iv-client-wizard .iv-client-grid{grid-template-columns:1fr 1fr}.iv-client-wizard button:disabled,.iv-client-google:disabled{opacity:.55;cursor:wait}@media(max-width:350px){.iv-client-wizard .iv-client-grid{grid-template-columns:1fr}}.iv-client-compact-onboarding .iv-client-sheet-header{padding-bottom:8px}.iv-client-compact-onboarding .iv-client-sheet-header .iv-client-step{margin:6px 0 8px}.iv-client-compact-onboarding .iv-client-sheet-header h2{margin:0 0 3px;font-size:21px}.iv-client-compact-onboarding .iv-client-sheet-scroll{padding-top:3px;padding-bottom:11px}.iv-client-compact-onboarding .iv-client-sheet-scroll .iv-client-form{gap:7px}.iv-client-compact-onboarding .iv-client-form label{gap:3px;font-size:12px}.iv-client-compact-onboarding .iv-client-form input,.iv-client-compact-onboarding .iv-client-form select{min-height:44px;padding-top:8px;padding-bottom:8px}.iv-client-compact-onboarding .iv-client-form .iv-client-grid{gap:7px;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.iv-client-compact-onboarding .iv-client-form .iv-client-grid-street,.iv-client-compact-onboarding .iv-client-form .iv-client-grid-cep{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}.iv-client-compact-onboarding .iv-client-address-optional{border:0;margin:2px 0;padding:0}.iv-client-compact-onboarding .iv-client-address-optional summary{font-size:12px;color:#d66c00;cursor:pointer;padding:7px 0;line-height:1.4}.iv-client-compact-onboarding .iv-client-address-optional>div{display:grid;gap:7px;padding-top:3px}.iv-client-compact-onboarding .iv-client-form .iv-client-consent{margin-top:3px;gap:6px}.iv-client-compact-onboarding .iv-client-error{margin:3px 0 0}.iv-client-compact-onboarding .iv-client-form>small{margin-top:0!important}/* RC36: neutraliza margens e pesos do formulário administrativo. */.iv-client-sheet .iv-client-form label{margin:0!important;display:grid;gap:4px;font-size:12px;line-height:1.3;font-weight:600}.iv-client-sheet .iv-client-form input,.iv-client-sheet .iv-client-form select{font-weight:400;font-size:14px;line-height:1.35;min-height:42px;padding:10px}.iv-client-sheet .iv-client-form input::placeholder{color:#939eac;font-weight:400;opacity:1}.iv-client-sheet .iv-client-form input:focus,.iv-client-sheet .iv-client-form select:focus{outline:none;border-color:#ffad72;box-shadow:0 0 0 2px #ff790018}.iv-client-compact-onboarding .iv-client-sheet-scroll .iv-client-form{gap:8px}.iv-client-compact-onboarding .iv-client-sheet-header{padding:0 17px 8px}.iv-client-compact-onboarding .iv-client-sheet-scroll{padding:3px 17px 12px}.iv-client-compact-onboarding .iv-client-sheet-footer{padding:10px 17px max(12px,env(safe-area-inset-bottom))}.iv-client-compact-onboarding .iv-client-sheet-grip{height:23px}.iv-client-compact-onboarding .iv-client-form>small{margin:0!important;font-size:10.5px;line-height:1.4}.iv-client-compact-onboarding .iv-client-sheet-header h2{font-size:20px;line-height:1.2}.iv-client-compact-onboarding .iv-client-sheet-header p{font-size:12px;line-height:1.4}.iv-client-sheet .iv-client-form .iv-client-consent{display:flex!important}.iv-client-sheet .iv-client-form .iv-client-consent input{padding:0;min-height:18px}.iv-client-sheet-footer button{font-size:13px;font-weight:650}.iv-client-sheet .iv-client-sheet-x{font-size:22px}.iv-client-sheet .iv-client-form .iv-client-eye{padding:0}</style>'}

export function passwordField(title,name,autocomplete='new-password',minimum=0){
 return '<label>'+title+'<span class="iv-client-password"><input type="password" name="'+name+'" '+(minimum?'minlength="'+minimum+'" ':'')+'maxlength="128" required autocomplete="'+autocomplete+'" placeholder="Digite sua senha"><button type="button" class="iv-client-eye" data-password-toggle="'+name+'" aria-label="Mostrar senha" aria-pressed="false">'+eye(false)+'</button></span></label>';
}
function eye(visible){return '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(visible?'<path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9 5.5A11 11 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.6M6.2 6.2C3.6 8.4 2 12 2 12s4 7 10 7a10 10 0 0 0 4-.8"/>':'<path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>')+'</svg>'}
export function bindPasswordFields(root){
 root.querySelectorAll('[data-password-toggle]').forEach(b=>b.onclick=()=>{
  const input=b.closest('label').querySelector('input'),visible=input.type==='password';
  input.type=visible?'text':'password';b.setAttribute('aria-pressed',String(visible));b.setAttribute('aria-label',visible?'Ocultar senha':'Mostrar senha');b.innerHTML=eye(visible);
 });
}
export function clientSheet({onClose,locked=()=>false}={}){
 const dialog=document.createElement('dialog');
 dialog.className='iv-client-sheet';
 dialog.setAttribute('aria-labelledby','iv-client-sheet-title');
 dialog.innerHTML='<div class="iv-client-sheet-frame"><div class="iv-client-sheet-grip" aria-hidden="true"><span></span></div><header class="iv-client-sheet-header"><div id="iv-client-sheet-heading"></div><button type="button" class="iv-client-sheet-x" aria-label="Fechar painel">×</button></header><div class="iv-client-sheet-scroll"></div><footer class="iv-client-sheet-footer"></footer></div>';
 document.querySelector('.iv-client')?.append(dialog);
 if(!dialog.isConnected)document.body.append(dialog);
 const frame=dialog.querySelector('.iv-client-sheet-frame'),grip=dialog.querySelector('.iv-client-sheet-grip');
 const viewport=window.visualViewport;
 const align=()=>{if(!dialog.open)return;const h=viewport?.height??window.innerHeight;dialog.style.bottom=Math.max(0,window.innerHeight-h-(viewport?.offsetTop??0))+'px';dialog.style.setProperty('--iv-client-height',Math.max(180,Math.floor(h-8))+'px')};
 const close=()=>{if(!locked()&&dialog.open)dialog.close()};
 dialog.querySelector('.iv-client-sheet-x').onclick=close;
 dialog.addEventListener('cancel',e=>{if(locked())e.preventDefault()});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
 let start=null,dy=0;
 grip.addEventListener('pointerdown',e=>{start=e.clientY;dy=0;grip.setPointerCapture?.(e.pointerId)});
 grip.addEventListener('pointermove',e=>{if(start===null)return;dy=e.clientY-start;frame.style.transform=dy>0?'translateY('+Math.min(120,dy)+'px)':''});
 function release(){if(start===null)return;start=null;frame.style.transform='';if(dy>80)close();else if(dy< -45)dialog.classList.add('is-expanded');dy=0;align()}
 grip.addEventListener('pointerup',release);grip.addEventListener('pointercancel',()=>{start=null;frame.style.transform='';dy=0});
 let disposed=false,observer=null;
 const dispose=()=>{if(disposed)return;disposed=true;viewport?.removeEventListener('resize',align);viewport?.removeEventListener('scroll',align);window.removeEventListener('resize',align);observer?.disconnect();dialog.remove()};
 dialog.addEventListener('close',()=>{if(disposed)return;dispose();onClose?.()},{once:true});
 viewport?.addEventListener('resize',align);viewport?.addEventListener('scroll',align);window.addEventListener('resize',align);
 observer=new MutationObserver(()=>{if(!dialog.isConnected)dispose()});observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
 return {dialog,heading:dialog.querySelector('#iv-client-sheet-heading'),body:dialog.querySelector('.iv-client-sheet-scroll'),footer:dialog.querySelector('.iv-client-sheet-footer'),open(){if(!dialog.open)dialog.querySelector('.iv-client-sheet-x').setAttribute('autofocus','');dialog.showModal();align();dialog.querySelector('.iv-client-sheet-x').focus({preventScroll:true})},close,dispose};
}

export function showOnboarding({auth,page,esc,link,user=null,profile=null,onDone,onLogin}){
 const seed=profile??{},meta=user?.user_metadata??{};
 let stage=0,busy=false,awaiting=false;
 const steps=user?['identity','contact','address']:['identity','password','contact','address'];
 const last=steps.length-1;
 const v={name:seed.display_name||seed.social_name||seed.full_name||meta.full_name||meta.name||'',cpf:seed.cpf??'',password:'',again:'',email:user?.email??'',phone:seed.phone??'',postal_code:'',state:'',city:'',street:'',number:'',neighborhood:'',complement:'',reference:'',terms:false};
 const field=(title,k,attrs='')=>'<label>'+title+'<input name="'+k+'" value="'+esc(v[k]??'')+'" '+attrs+'></label>';
 const secret=(title,k)=>passwordField(title,k,'new-password',6);
 const setError=message=>{const el=document.getElementById('iv-wizard-error');if(el)el.textContent=message};
 const writeForm=form=>{for(const el of form.elements){if(!el.name)continue;v[el.name]=el.type==='checkbox'?el.checked:(el.name==='password'||el.name==='again')?el.value:el.value.trim()}};
 const validate=()=>{
  const step=steps[stage];
  if(step==='identity'){
   if(v.name.trim().length<3||v.name.length>120)throw Error('Informe seu nome completo ou social (de 3 a 120 caracteres).');
   if(!cpfValid(v.cpf))throw Error('Confira os dígitos do CPF.');
  }else if(step==='password'){
   if(!user&&v.password.length<6)throw Error('Use pelo menos 6 caracteres.');
   if(!user&&v.password!==v.again)throw Error('As senhas precisam ser iguais.');
  }else if(step==='contact'){
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))throw Error('Informe um e-mail válido.');
   if(!/^[1-9]\d9\d{8}$/.test(digits(v.phone)))throw Error('Informe o celular com DDD (11 dígitos).');
  }else{
   if(digits(v.postal_code).length!==8||!states.includes(v.state)||v.city.length<2||v.street.length<2||!v.number||v.neighborhood.length<2)throw Error('Confira CEP, UF, cidade, rua, número e bairro.');
   if(!v.terms)throw Error('Leia e aceite os termos e a política de privacidade.');
  }
 };
 const complete=async()=>{
  let u=user;
  if(!u){
   const result=await auth.auth.signUp({email:v.email.trim().toLowerCase(),password:v.password,options:{emailRedirectTo:redirect()}});
   if(result.error){
    if(result.error.code==='weak_password'){stage=steps.indexOf('password');draw();throw Error('O servidor exige uma senha mais forte. Tente uma combinação mais longa.');}
    throw Error('Não foi possível cadastrar. Confira o e-mail e os requisitos da senha ou tente entrar se já tiver conta.');
   }
   if(!result.data.session){awaiting=true;draw();return}
   u=result.data.user;user=u;
  }
  if(!u)throw Error('Não foi possível confirmar seu acesso. Entre novamente.');
  const {error}=await auth.rpc('customer_complete_registration',{p_full_name:v.name,p_social_name:null,p_display_name:v.name,p_cpf:digits(v.cpf),p_phone:digits(v.phone),p_accept:v.terms,p_address:{postal_code:digits(v.postal_code),state:v.state,city:v.city,street:v.street,number:v.number,neighborhood:v.neighborhood,complement:v.complement,reference:v.reference}});
  if(error)throw Error('Não foi possível salvar seu cadastro e endereço. Confira os dados e tente novamente.');
  v.password='';v.again='';v.cpf='';sheet.dispose();onDone();
 };
 const leave=async()=>{v.password='';v.again='';v.cpf='';if(user){await auth.auth.signOut({scope:'local'})}onLogin()};
 page(onboardingStyle()+'<section class="iv-client-wizard iv-client-welcome"><h1>Crie sua conta</h1><p class="iv-client-muted">Seus dados e endereços para pedir com mais facilidade.</p></section>');
 const sheet=clientSheet({onClose:leave,locked:()=>busy});
 sheet.dialog.classList.add('iv-client-compact-onboarding');
 function draw(){
  sheet.body.scrollTop=0;
  if(awaiting){
   sheet.heading.innerHTML='<h2 id="iv-client-sheet-title">Confirme seu e-mail</h2>';
   sheet.body.innerHTML='<p class="iv-client-muted">Abra a confirmação enviada ao e-mail. Se abrir em outro navegador, será necessário completar o perfil novamente.</p><p class="iv-client-error" id="iv-wizard-error" role="alert"></p>';
   sheet.footer.innerHTML='<button class="iv-client-secondary" id="iv-wizard-exit" type="button">Voltar</button><button class="iv-client-primary" id="iv-wizard-confirm" type="button">Já confirmei, acessar</button>';
   document.getElementById('iv-wizard-exit').onclick=()=>sheet.close();
   const b=document.getElementById('iv-wizard-confirm');b.onclick=async()=>{if(busy)return;busy=true;b.disabled=true;try{const r=await auth.auth.signInWithPassword({email:v.email,password:v.password});if(r.error)throw Error('Confirme o e-mail antes de acessar.');user=r.data.user;awaiting=false;await complete()}catch(e){setError(e.message)}finally{busy=false;b.disabled=false}};
   return;
  }
  const step=steps[stage];
  const titles={identity:'Seus dados',password:'Crie sua senha',contact:'Seu contato',address:'Seu endereço'};
  const descriptions={identity:'Só precisamos do básico.',password:'Use pelo menos 6 caracteres.',contact:'Para facilitar seus pedidos.',address:'Você pode adicionar outros depois.'};
  let fields='';
  if(step==='identity')fields=field('Nome','name','required minlength="3" maxlength="120" autocomplete="name" placeholder="Como deseja ser chamado?"')
   +'<small class="iv-client-muted" style="margin-top:-7px">Nome completo ou social, exibido nos pedidos.</small>'
   +field('CPF','cpf','required inputmode="numeric" maxlength="14" placeholder="000.000.000-00"');
  if(step==='password')fields=secret('Senha','password')+secret('Repita a senha','again');
  if(step==='contact')fields=field('E-mail','email','type="email" maxlength="254" required autocomplete="email" '+(user?'readonly':''))+field('Celular com DDD','phone','required inputmode="tel" maxlength="15" autocomplete="tel" placeholder="(00) 90000-0000"');
  if(step==='address')fields='<div class="iv-client-grid iv-client-grid-cep">'+field('CEP','postal_code','required inputmode="numeric" maxlength="9" autocomplete="postal-code" placeholder="00000-000"')
   +'<label>UF<select name="state" required><option value="">Selecione</option>'+states.map(s=>'<option '+(v.state===s?'selected':'')+'>'+s+'</option>').join('')+'</select></label></div>'
   +'<div class="iv-client-grid">'+field('Cidade','city','required maxlength="100" autocomplete="address-level2"')+field('Bairro','neighborhood','required maxlength="100"')+'</div>'
   +'<div class="iv-client-grid iv-client-grid-street">'+field('Rua','street','required maxlength="160" autocomplete="street-address"')+field('Número','number','required maxlength="25"')+'</div>'
   +'<details class="iv-client-address-optional" '+(v.complement||v.reference?'open':'')+'><summary>Complemento e ponto de referência (opcionais)</summary><div>'+field('Complemento','complement','maxlength="120"')+field('Ponto de referência','reference','maxlength="160"')+'</div></details>'
   +'<label class="iv-client-consent"><input type="checkbox" name="terms" '+(v.terms?'checked':'')+' required><span>Li e concordo com os <a href="/intervalo/termos/" target="_blank" rel="noopener noreferrer">Termos de uso</a> e a <a href="/intervalo/privacidade/" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.</span></label>';
  sheet.heading.innerHTML='<small class="iv-client-muted">ETAPA '+(stage+1)+' DE '+steps.length+'</small><div class="iv-client-step" aria-hidden="true">'+steps.map((_,i)=>'<i class="'+(i<=stage?'active':'')+'"></i>').join('')+'</div><h2 id="iv-client-sheet-title">'+titles[step]+'</h2><p class="iv-client-muted">'+descriptions[step]+'</p>';
  sheet.body.innerHTML='<form class="iv-client-form" id="iv-client-wizard" novalidate>'+fields+'<p class="iv-client-error" id="iv-wizard-error" role="alert"></p></form>';
  sheet.footer.innerHTML='<button class="iv-client-secondary" id="iv-wizard-back" type="button">'+(stage?'Voltar':'Cancelar')+'</button><button class="iv-client-primary" type="submit" form="iv-client-wizard">'+(stage===last?'Finalizar e acessar':'Continuar')+'</button>';
  const form=document.getElementById('iv-client-wizard');
  if(step==='password'){form.elements.password.value=v.password;form.elements.again.value=v.again;bindPasswordFields(form)}
  form.addEventListener('input',()=>setError(''));
  document.getElementById('iv-wizard-back').onclick=()=>{if(busy)return;writeForm(form);if(stage>0){document.activeElement?.blur();stage--;draw();sheet.dialog.querySelector('.iv-client-sheet-x').focus({preventScroll:true})}else sheet.close()};
  form.onsubmit=async e=>{e.preventDefault();if(busy)return;writeForm(form);try{validate();if(!form.checkValidity()){const invalid=[...form.elements].find(el=>el.willValidate&&!el.validity.valid);invalid?.focus();throw Error('Confira o campo destacado.')}}catch(err){setError(err.message);document.getElementById('iv-wizard-error')?.scrollIntoView({block:'nearest'});return}
   if(stage<last){document.activeElement?.blur();stage++;draw();sheet.dialog.querySelector('.iv-client-sheet-x').focus({preventScroll:true});return}
   busy=true;const b=sheet.footer.querySelector('button[type=submit]');b.disabled=true;b.textContent='Salvando...';
   try{await complete()}catch(err){setError(err.message||'Não foi possível finalizar.')}finally{busy=false;b.disabled=false;b.textContent='Finalizar e acessar';const next=sheet.footer.querySelector('[type=submit]');if(next)next.disabled=false}
  };
 }
 draw();sheet.open();
}
