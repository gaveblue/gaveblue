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
export function onboardingStyle(){return '<style>.iv-client-wizard{max-width:460px;margin:16px auto 90px}.iv-client-wizard h1{font-size:27px;margin:12px 0 5px;letter-spacing:-.7px}.iv-client-step{display:flex;gap:6px;margin:20px 0 18px}.iv-client-step i{height:4px;background:#e7ebf1;border-radius:8px;flex:1}.iv-client-step i.active{background:#ff7900}.iv-client-wizard .iv-client-form{gap:12px}.iv-client-wizard .iv-client-form input,.iv-client-wizard .iv-client-form select{font:inherit;font-size:14px;min-height:46px;box-sizing:border-box;width:100%;border:1px solid #dce2e9;border-radius:11px;padding:10px;background:#fff;color:#263249}.iv-client-wizard .iv-client-form input:focus{outline:2px solid #fed7aa}.iv-client-wizard .iv-client-form small{font-weight:400;color:#8290a0;font-size:11px;line-height:1.5}.iv-client-google{display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 16px;border:1px solid #dce2e9;background:#fff;color:#334155;border-radius:12px;width:100%;font:inherit;font-size:14px;font-weight:650;cursor:pointer}.iv-client-divider{display:flex;align-items:center;gap:12px;font-size:12px;color:#8995a5;margin:17px 0}.iv-client-divider:before,.iv-client-divider:after{content:"";height:1px;background:#e6eaf0;flex:1}.iv-client-wizard .iv-client-actions{display:flex;gap:8px}.iv-client-wizard .iv-client-primary{flex:1;min-height:46px}.iv-client-wizard .iv-client-consent{display:flex!important;grid-template-columns:none!important;align-items:flex-start;font-size:12px!important;line-height:1.5;font-weight:400!important}.iv-client-wizard .iv-client-consent input{width:18px!important;min-height:18px!important;margin:2px 6px 0 0;flex:none;accent-color:#ff7900}.iv-client-wizard a{color:#d96b00;text-decoration:underline}.iv-client-wizard .iv-client-card{padding:18px;margin-top:12px}.iv-client-wizard .iv-client-grid{grid-template-columns:1fr 1fr}.iv-client-wizard button:disabled,.iv-client-google:disabled{opacity:.55;cursor:wait}@media(max-width:350px){.iv-client-wizard .iv-client-grid{grid-template-columns:1fr}}</style>'}
export function showOnboarding({auth,page,esc,link,user=null,profile=null,onDone,onLogin}){
 const seed=profile??{},meta=user?.user_metadata??{};
 let stage=0,busy=false,awaiting=false;
 const v={full_name:seed.full_name??meta.full_name??meta.name??'',social_name:seed.social_name??'',display_name:seed.display_name??'',cpf:seed.cpf??'',password:'',again:'',email:user?.email??'',phone:seed.phone??'',postal_code:'',state:'',city:'',street:'',number:'',neighborhood:'',complement:'',reference:'',terms:false};
 const field=(title,k,attrs='')=>'<label>'+title+'<input name="'+k+'" value="'+esc(v[k]??'')+'" '+attrs+'></label>';
 const secret=(title,k)=>'<label>'+title+'<input name="'+k+'" type="password" required minlength="8" maxlength="128" autocomplete="new-password" value="'+esc(v[k])+'"></label>';
 const setError=message=>{const el=document.getElementById('iv-wizard-error');if(el)el.textContent=message};
 const writeForm=form=>{for(const el of form.elements){if(!el.name)continue;v[el.name]=el.type==='checkbox'?el.checked:el.type==='password'?el.value:el.value.trim()}};
 const validate=()=>{
  if(stage===0){
   if(v.full_name.trim().split(/\s+/).length<2||v.full_name.length>150)throw Error('Informe seu nome completo.');
   if(!cpfValid(v.cpf))throw Error('Confira os dígitos do CPF.');
   if(v.social_name&&v.social_name.length<2||v.display_name&&v.display_name.length<2)throw Error('Confira o nome social ou nome no pedido.');
   if(!user&&(v.password.length<8||v.password!==v.again))throw Error('Crie uma senha com pelo menos 8 caracteres e repita a mesma senha.');
  }else if(stage===1){
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
   if(result.error)throw Error('Não foi possível cadastrar. Confira o e-mail e os requisitos da senha ou tente entrar se já tiver conta.');
   if(!result.data.session){awaiting=true;draw();return}
   u=result.data.user;user=u;
  }
  if(!u)throw Error('Não foi possível confirmar seu acesso. Entre novamente.');
  const {error}=await auth.rpc('customer_complete_registration',{p_full_name:v.full_name,p_social_name:v.social_name||null,p_display_name:v.display_name||v.social_name||v.full_name.slice(0,120),p_cpf:digits(v.cpf),p_phone:digits(v.phone),p_accept:v.terms,p_address:{postal_code:digits(v.postal_code),state:v.state,city:v.city,street:v.street,number:v.number,neighborhood:v.neighborhood,complement:v.complement,reference:v.reference}});
  if(error)throw Error('Não foi possível salvar seu cadastro e endereço. Confira os dados e tente novamente.');
  v.password='';v.again='';v.cpf='';onDone();
 };
 function draw(){
  if(awaiting){
   page(onboardingStyle()+'<section class="iv-client-wizard"><h1>Confirme seu e-mail</h1><p class="iv-client-muted">Abra a confirmação enviada para o seu e-mail. Se continuar nesta tela, seus dados permanecem aqui até você concluir. Se abrir em outro navegador, será necessário completar o perfil novamente.</p><p class="iv-client-error" id="iv-wizard-error" role="alert"></p><button class="iv-client-primary" id="iv-wizard-confirm" type="button">Já confirmei, acessar</button><div class="iv-client-actions"><button class="iv-client-secondary" id="iv-wizard-exit" type="button">Voltar ao login</button></div></section>');
   document.getElementById('iv-wizard-exit').onclick=()=>{v.password='';v.again='';onLogin()};
   const b=document.getElementById('iv-wizard-confirm');b.onclick=async()=>{if(busy)return;busy=true;b.disabled=true;try{const r=await auth.auth.signInWithPassword({email:v.email,password:v.password});if(r.error)throw Error('Confirme o e-mail antes de acessar.');user=r.data.user;awaiting=false;await complete()}catch(e){setError(e.message)}finally{busy=false;b.disabled=false}};
   return;
  }
  const titles=['Seus dados','Como podemos falar com você?','Onde você recebe seus pedidos?'];
  const descriptions=['Vamos começar com o básico.','Informe seu contato para os pedidos.','Você poderá adicionar outros endereços depois.'];
  let fields='';
  if(stage===0)fields=field('Nome completo','full_name','required maxlength="150" autocomplete="name"')
   +field('Nome social (opcional)','social_name','maxlength="120" autocomplete="nickname"')
   +field('Nome no pedido (opcional)','display_name','maxlength="120" placeholder="Como deseja ser chamado?"')
   +field('CPF','cpf','required inputmode="numeric" maxlength="14" placeholder="000.000.000-00"')
   +(user?'<small class="iv-client-muted">A senha é gerenciada pelo seu método de acesso.</small>':secret('Crie sua senha (mínimo 8 caracteres)','password')+secret('Repita a senha','again'));
  if(stage===1)fields=field('E-mail','email','type="email" maxlength="254" required autocomplete="email" '+(user?'readonly':''))+field('Celular com DDD','phone','required inputmode="tel" maxlength="15" autocomplete="tel" placeholder="(00) 90000-0000"');
  if(stage===2)fields=field('CEP','postal_code','required inputmode="numeric" maxlength="9" autocomplete="postal-code" placeholder="00000-000"')
   +'<div class="iv-client-grid"><label>UF<select name="state" required><option value="">Selecione</option>'+states.map(s=>'<option '+(v.state===s?'selected':'')+'>'+s+'</option>').join('')+'</select></label>'+field('Cidade','city','required maxlength="100" autocomplete="address-level2"')+'</div>'
   +field('Rua','street','required maxlength="160" autocomplete="street-address"')
   +'<div class="iv-client-grid">'+field('Número','number','required maxlength="25"')+field('Bairro','neighborhood','required maxlength="100"')+'</div>'
   +field('Complemento (opcional)','complement','maxlength="120"')
   +field('Ponto de referência (opcional)','reference','maxlength="160"')
   +'<label class="iv-client-consent"><input type="checkbox" name="terms" '+(v.terms?'checked':'')+' required><span>Li e concordo com os <a href="/intervalo/termos/" target="_blank" rel="noopener noreferrer">Termos de uso</a> e a <a href="/intervalo/privacidade/" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.</span></label>';
  page(onboardingStyle()+'<section class="iv-client-wizard"><small class="iv-client-muted">ETAPA '+(stage+1)+' DE 3</small><div class="iv-client-step" aria-hidden="true">'+[0,1,2].map(i=>'<i class="'+(i<=stage?'active':'')+'"></i>').join('')+'</div><h1>'+titles[stage]+'</h1><p class="iv-client-muted">'+descriptions[stage]+'</p><form class="iv-client-form iv-client-card" id="iv-client-wizard">'+fields+'<p class="iv-client-error" id="iv-wizard-error" role="alert"></p><div class="iv-client-actions"><button class="iv-client-secondary" id="iv-wizard-back" type="button">'+(stage?'Voltar':'Cancelar')+'</button><button class="iv-client-primary" type="submit">'+(stage===2?'Finalizar e acessar':'Continuar')+'</button></div></form><a href="'+returnTarget(link)+'">Continuar sem cadastro</a></section>');
  const form=document.getElementById('iv-client-wizard');
  document.getElementById('iv-wizard-back').onclick=async()=>{if(busy)return;writeForm(form);if(stage>0){stage--;draw()}else{v.password='';v.again='';if(user){await auth.auth.signOut({scope:'local'})}onLogin()}};
  form.onsubmit=async e=>{e.preventDefault();if(busy)return;writeForm(form);try{validate()}catch(err){setError(err.message);return}
   if(stage<2){stage++;draw();return}
   busy=true;const b=form.querySelector('button[type=submit]');b.disabled=true;b.textContent='Salvando...';
   try{await complete()}catch(err){setError(err.message||'Não foi possível finalizar.')}finally{busy=false;b.disabled=false;b.textContent='Finalizar e acessar'}
  };
 }
 draw();
}
