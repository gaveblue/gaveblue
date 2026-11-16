import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.50.0/+esm';
import {icon} from './ui-icons.js?v=1.0.0-rc.1';

// Área do consumidor independente do Auth e dos papéis dos funcionários.
// O checkout visitante não depende desta sessão nem de cadastro.
export const customerAuth=createClient(
 'https://fynaaiazebydorzllwip.supabase.co','sb_publishable_mGpfDRlZ0MSaa9MV_xMJsg_FT47wa_d',
 {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,
  flowType:'implicit',storageKey:'intervalo.customer.auth.v1'}}
);
const cleanPhone=x=>String(x||'').replace(/\D/g,'');
export async function renderCustomer({box,esc,link}){
 document.body.classList.add('iv-marketplace','iv-commerce');
 const css='<link rel="stylesheet" href="/intervalo/marketplace-preview-rc1.css?v=1.1.0-rc.4">'
  +'<link rel="stylesheet" href="/intervalo/marketplace-commerce-rc4.css?v=1.1.0-rc.4">'
  +'<style>.iv-client{max-width:760px;margin:25px auto 80px}.iv-client h1{font-size:clamp(28px,5vw,40px);margin:8px 0}.iv-client h2{margin:0 0 12px}.iv-client-head{margin-bottom:22px}.iv-client-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.iv-client-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:16px}.iv-client-primary{background:#f97316;border:0;color:white;border-radius:12px;padding:12px 17px;font-weight:750;cursor:pointer}.iv-client-secondary{background:#fff;border:1px solid #dbe1e8;color:#334155;border-radius:12px;padding:11px 14px;cursor:pointer}.iv-client-form{display:grid;gap:13px}.iv-client-form label{display:grid;gap:5px;font-weight:650;font-size:13px}.iv-client-form input{width:100%;padding:11px;border:1px solid #ccd5df;border-radius:11px;background:#fff}.iv-client-form input:focus{outline:2px solid #fed7aa}.iv-client-card{border:1px solid #e7ebf0;border-radius:18px;background:#fff;padding:22px;margin:16px 0;box-shadow:0 4px 20px #15243c06}.iv-client-muted{font-size:13px;color:#69778a;line-height:1.6}.iv-client-error{color:#b42318;font-size:13px}.iv-client-ok{color:#0d766d;font-size:13px}.iv-client-address{border-top:1px solid #edf0f3;padding:15px 0}.iv-client-address:first-child{border-top:0}.iv-client-address b{display:block}.iv-client-address p{margin:4px 0;font-size:13px;color:#64748b}@media(max-width:600px){.iv-client-grid{grid-template-columns:1fr}.iv-client-card{padding:18px}}</style>';
 const page=x=>box('<div class="iv-mkt-shell">'+css
  +'<nav class="iv-mkt-nav" aria-label="Navegação do consumidor"><a class="iv-mkt-brand" href="'+link('/explorar')+'">intervalo</a>'
  +'<div class="iv-mkt-links"><a href="'+link('/explorar')+'">'+icon('arrowLeft',16)+' Restaurantes</a></div></nav>'
  +'<main class="iv-client">'+x+'</main></div>');
 const notice='<p class="iv-client-muted">A conta é opcional. Você continua podendo comprar sem cadastro. Ela é separada do acesso de funcionários e restaurantes.</p>';
 const setMsg=(id,message,isError)=>{const el=document.getElementById(id);if(el){el.textContent=message;el.className=isError?'iv-client-error':'iv-client-ok'}};
 const {data:ud,error:userError}=await customerAuth.auth.getUser();
 if(userError&&userError.name!=='AuthSessionMissingError'){
  page('<section class="iv-client-card"><h2>Não foi possível verificar seu acesso</h2><p class="iv-client-error">'+esc(userError.message)+'</p><a href="'+link('/cliente')+'">Tentar novamente</a></section>');return;
 }
 const user=ud?.user;
 if(!user){
  page('<header class="iv-client-head"><span class="iv-mkt-eyebrow">PARA QUEM PEDE</span><h1>Minha conta</h1>'+notice+'</header>'
   +'<section class="iv-client-card"><h2 id="iv-client-auth-title">Entrar</h2><form id="iv-client-auth" class="iv-client-form">'
   +'<label id="iv-client-name-row" hidden>Nome completo<input name="name" maxlength="120" autocomplete="name"></label>'
   +'<label>E-mail<input type="email" name="email" maxlength="254" autocomplete="email" required></label>'
   +'<label>Senha<input type="password" name="password" minlength="8" autocomplete="current-password" required></label>'
   +'<p role="status" id="iv-client-auth-status"></p>'
   +'<button class="iv-client-primary" type="submit">Entrar</button></form>'
   +'<div class="iv-client-actions"><button class="iv-client-secondary" id="iv-client-switch" type="button">Criar minha conta</button>'
   +'<a href="'+link('/explorar')+'">Continuar sem cadastro</a></div></section>'
   +'<section class="iv-client-card"><h2>Já fez um pedido sem conta?</h2>'
   +'<p class="iv-client-muted">Acompanhe pelo link privado mostrado ao confirmar a compra. Não é necessário entrar nesta área.</p></section>');
  const form=document.getElementById('iv-client-auth'),sw=document.getElementById('iv-client-switch');
  let registering=false;
  sw.onclick=()=>{
   registering=!registering;
   document.getElementById('iv-client-name-row').hidden=!registering;
   document.getElementById('iv-client-auth-title').textContent=registering?'Criar conta':'Entrar';
   form.querySelector('button[type=submit]').textContent=registering?'Cadastrar':'Entrar';
   form.elements.password.autocomplete=registering?'new-password':'current-password';
   sw.textContent=registering?'Já tenho conta':'Criar minha conta';
   setMsg('iv-client-auth-status','',false);
  };
  form.onsubmit=async e=>{
   e.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;
   const email=form.elements.email.value.trim().toLowerCase(),password=form.elements.password.value;
   const name=String(form.elements.name.value||'').trim();
   try{
    if(registering){
     if(name.length<2)throw Error('Informe seu nome para criar a conta.');
     if(password.length<8)throw Error('Use uma senha de pelo menos 8 caracteres.');
     const {data,error}=await customerAuth.auth.signUp({email,password,options:{
      data:{display_name:name},
      emailRedirectTo:location.origin+link('/cliente')
     }});
     if(error)throw error;
     if(!data?.session){setMsg('iv-client-auth-status','Verifique seu e-mail para confirmar o cadastro e depois faça login.',false);return}
     const {error:pe}=await customerAuth.from('customer_profiles')
      .upsert({id:data.user.id,display_name:name},{onConflict:'id'});
     if(pe)throw pe;
    }else{
     const {error}=await customerAuth.auth.signInWithPassword({email,password});
     if(error)throw error;
    }
    return renderCustomer({box,esc,link});
   }catch(err){setMsg('iv-client-auth-status',err.message||'Não foi possível acessar.',true)}
   finally{button.disabled=false}
  };
  return;
 }
 let profile=null,addresses=[];
 try{
  const [p,a]=await Promise.all([
   customerAuth.from('customer_profiles').select('id,display_name,phone').eq('id',user.id).maybeSingle(),
   customerAuth.from('customer_addresses').select('id,label,street,number,complement,neighborhood,city,state,postal_code,reference,created_at')
    .eq('customer_id',user.id).order('created_at',{ascending:false}).limit(20)
  ]);
  if(p.error)throw p.error;if(a.error)throw a.error;
  profile=p.data;addresses=a.data||[];
 }catch(err){
  page('<section class="iv-client-card"><h2>Dados indisponíveis</h2><p class="iv-client-error">'+esc(err.message)+'</p>'
   +'<a href="'+link('/cliente')+'">Tentar novamente</a></section>');return;
 }
 const addressesHtml=addresses.length?addresses.map(a=>'<div class="iv-client-address">'
  +'<b>'+esc(a.label)+'</b><p>'+esc(a.street)+', '+esc(a.number)+' · '+esc(a.neighborhood)+' · '+esc(a.city)+'/'+esc(a.state)+' · CEP '+esc(a.postal_code)+'</p>'
  +'<div class="iv-client-actions"><button class="iv-client-secondary" data-edit="'+esc(a.id)+'" type="button">Editar</button>'
  +'<button class="iv-client-secondary" data-delete="'+esc(a.id)+'" type="button">Excluir</button></div></div>').join('')
  :'<p class="iv-client-muted">Nenhum endereço salvo.</p>';
 page('<header class="iv-client-head"><span class="iv-mkt-eyebrow">ÁREA DO CONSUMIDOR</span><h1>Minha conta</h1>'
  +'<p class="iv-client-muted">'+esc(user.email||'')+' · Seus dados não fazem parte da conta dos funcionários.</p></header>'
  +'<section class="iv-client-card"><h2>Meu perfil</h2><form id="iv-client-profile" class="iv-client-form">'
  +'<label>Nome<input name="name" maxlength="120" required value="'+esc(profile?.display_name||user.user_metadata?.display_name||'')+'"></label>'
  +'<label>Celular<input name="phone" inputmode="tel" maxlength="20" value="'+esc(profile?.phone||'')+'"></label>'
  +'<p id="iv-client-profile-status" role="status"></p><div class="iv-client-actions">'
  +'<button class="iv-client-primary" type="submit">Salvar perfil</button>'
  +'<button id="iv-client-logout" class="iv-client-secondary" type="button">'+icon('logout',15)+' Sair</button></div></form></section>'
  +'<section class="iv-client-card"><h2>Meus endereços</h2><p class="iv-client-muted">Salve até 20 endereços para facilitar pedidos futuros.</p>'
  +'<div id="iv-client-address-list">'+addressesHtml+'</div></section>'
  +'<section class="iv-client-card"><h2 id="iv-client-address-title">Novo endereço</h2>'
  +'<form id="iv-client-address" class="iv-client-form"><label>Nome do endereço<input name="label" value="Casa" maxlength="45" required></label>'
  +'<label>Rua<input name="street" maxlength="160" required></label>'
  +'<div class="iv-client-grid"><label>Número<input name="number" maxlength="25" required></label>'
  +'<label>Complemento<input name="complement" maxlength="120"></label></div>'
  +'<div class="iv-client-grid"><label>Bairro<input name="neighborhood" maxlength="100" required></label>'
  +'<label>Cidade<input name="city" maxlength="100" required></label></div>'
  +'<div class="iv-client-grid"><label>UF<input name="state" maxlength="2" required></label>'
  +'<label>CEP<input name="postal_code" inputmode="numeric" maxlength="9" required></label></div>'
  +'<label>Ponto de referência<input name="reference" maxlength="160"></label>'
  +'<p id="iv-client-address-status" role="status"></p>'
  +'<div class="iv-client-actions"><button class="iv-client-primary" type="submit">Salvar endereço</button>'
  +'<button class="iv-client-secondary" id="iv-client-clear" type="button">Limpar</button></div></form></section>'
  +'<section class="iv-client-card"><h2>Meus pedidos</h2><p class="iv-client-muted">Os pedidos feitos sem cadastro continuam acessíveis somente pelo link privado recebido na compra. O histórico vinculado à conta será disponibilizado em uma próxima etapa.</p>'
  +'<a href="'+link('/pedido')+'">Como acompanhar um pedido</a></section>');
 const profileForm=document.getElementById('iv-client-profile');
 profileForm.onsubmit=async e=>{
  e.preventDefault();
  const name=profileForm.elements.name.value.trim(),phone=cleanPhone(profileForm.elements.phone.value);
  if(name.length<2||name.length>120||phone&&phone.length<10){setMsg('iv-client-profile-status','Confira nome e celular.',true);return}
  const b=profileForm.querySelector('button[type=submit]');b.disabled=true;
  const {error}=await customerAuth.from('customer_profiles').upsert({
   id:user.id,display_name:name,phone:phone||null,updated_at:new Date().toISOString()
  },{onConflict:'id'});
  b.disabled=false;
  setMsg('iv-client-profile-status',error?error.message:'Perfil atualizado.',Boolean(error));
 };
 document.getElementById('iv-client-logout').onclick=async()=>{
  const {error}=await customerAuth.auth.signOut();
  if(error){setMsg('iv-client-profile-status',error.message,true);return}
  await renderCustomer({box,esc,link});
 };
 let editing=null;
 const form=document.getElementById('iv-client-address');
 const reset=()=>{editing=null;form.reset();document.getElementById('iv-client-address-title').textContent='Novo endereço';setMsg('iv-client-address-status','',false)};
 document.getElementById('iv-client-clear').onclick=reset;
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
  const a=addresses.find(v=>v.id===b.dataset.edit);if(!a)return;
  editing=a.id;
  for(const field of ['label','street','number','complement','neighborhood','city','state','postal_code','reference']){
   form.elements[field].value=a[field]||'';
  }
  document.getElementById('iv-client-address-title').textContent='Editar endereço';
  form.scrollIntoView({behavior:'smooth',block:'start'});
 });
 document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{
  if(!confirm('Excluir este endereço salvo?'))return;
  b.disabled=true;
  const {error}=await customerAuth.from('customer_addresses').delete()
   .eq('id',b.dataset.delete).eq('customer_id',user.id);
  if(error){b.disabled=false;alert(error.message);return}
  await renderCustomer({box,esc,link});
 });
 form.onsubmit=async e=>{
  e.preventDefault();
  const fd=new FormData(form);
  const values=Object.fromEntries(['label','street','number','complement','neighborhood','city','state','postal_code','reference']
   .map(k=>[k,String(fd.get(k)||'').trim()]));
  values.state=values.state.toUpperCase();values.postal_code=cleanPhone(values.postal_code);
  if(values.street.length<2||values.neighborhood.length<2||values.city.length<2
    ||!/^[A-Z]{2}$/.test(values.state)||!/^\d{8}$/.test(values.postal_code)){
    setMsg('iv-client-address-status','Verifique o endereço, a UF e o CEP.',true);return;
  }
  if(!profile){setMsg('iv-client-address-status','Salve primeiro seu perfil para adicionar endereços.',true);return}
  if(!editing&&addresses.length>=20){setMsg('iv-client-address-status','Limite de 20 endereços atingido.',true);return}
  const button=form.querySelector('button[type=submit]');button.disabled=true;
  const payload={...values,updated_at:new Date().toISOString()};
  const result=editing
   ?await customerAuth.from('customer_addresses').update(payload).eq('customer_id',user.id).eq('id',editing)
   :await customerAuth.from('customer_addresses').insert({customer_id:user.id,...values});
  button.disabled=false;
  if(result.error){setMsg('iv-client-address-status',result.error.message,true);return}
  await renderCustomer({box,esc,link});
 };
}
