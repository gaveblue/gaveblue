// Intervalo — painel da Gaveblue: restaurantes, convites Master e módulos.
export async function renderPlatform({supabase,box,esc,link}){
 const css='<style>.p-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:16px}.p-card{border:1px solid #e2e8f0;border-radius:14px;padding:20px;background:#fff;margin:13px 0}.p-form label{display:block;margin:12px 0;font-weight:700;font-size:12px}.p-form input{display:block;width:100%;margin-top:7px;padding:11px;border:1px solid #cbd5e1;border-radius:9px}.p-btn{padding:11px 14px;background:#0f766e;color:white;border:0;border-radius:9px;cursor:pointer;font-size:12px;font-weight:700}.p-btn.alt{background:#e2e8f0;color:#334155}.p-btn.danger{background:#fff1f2;color:#9f1239}.p-modules{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.p-module{border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#334155;padding:9px 10px;font-size:12px;cursor:pointer}.p-module.on{border-color:#99f6e4;background:#f0fdfa;color:#115e59;font-weight:750}.p-info{color:#64748b;font-size:12px}@media(max-width:800px){.p-grid{grid-template-columns:1fr}}</style>';
 const modules=[['gestao','Gestão'],['garcom','Garçom'],['cozinha','Cozinha'],['caixa','Caixa'],['cardapio','Cardápio']];
 const call=async(name,body)=>{const {data,error}=await supabase.functions.invoke(name,{body});if(error||data?.error){let msg=data?.error??error?.message??'Falha';try{const info=await error?.context?.json?.();if(info?.error)msg=info.error}catch{}throw Error(msg)}return data};

 function askAdminPassword(title,description){
  return new Promise(resolve=>{
   const dialog=document.createElement('dialog');
   dialog.style.cssText='border:1px solid #cbd5e1;border-radius:16px;padding:25px;max-width:430px;width:calc(100% - 30px);box-shadow:0 20px 80px #0003';
   const form=document.createElement('form');form.method='dialog';
   const h=document.createElement('h2');h.textContent=title;
   const para=document.createElement('p');para.className='p-info';para.textContent=description;
   const label=document.createElement('label');label.textContent='Confirme sua senha de Super Admin';
   const input=document.createElement('input');input.type='password';input.required=true;input.autocomplete='current-password';input.style.cssText='width:100%;margin:10px 0;padding:12px;border:1px solid #cbd5e1;border-radius:9px';
   label.append(input);
   const ok=document.createElement('button');ok.className='p-btn';ok.type='submit';ok.textContent='Confirmar operação';
   const cancel=document.createElement('button');cancel.className='p-btn alt';cancel.type='button';cancel.style.marginLeft='10px';cancel.textContent='Cancelar';
   cancel.onclick=()=>dialog.close('cancel');
   form.append(h,para,label,ok,cancel);
   form.onsubmit=e=>{e.preventDefault();const password=input.value;dialog.close('done');resolve(password)};
   dialog.onclose=()=>{if(dialog.returnValue!=='done')resolve(null);dialog.remove()};
   dialog.append(form);document.body.append(dialog);dialog.showModal();input.focus();
  });
 }
 function displayTemporaryPassword(temp,email){
  const dialog=document.createElement('dialog');
  dialog.style.cssText='border:1px solid #cbd5e1;border-radius:16px;padding:25px;max-width:470px;width:calc(100% - 30px);box-shadow:0 20px 80px #0003';
  const title=document.createElement('h2');title.textContent='Senha provisória criada';
  const msg=document.createElement('p');msg.className='p-info';msg.textContent='Conta: '+email+'. Copie a senha agora. Ela não ficará salva no painel e deve ser entregue pessoalmente ou por canal seguro.';
  const inp=document.createElement('input');inp.value=temp;inp.readOnly=true;inp.autocomplete='off';inp.style.cssText='width:100%;padding:14px;border:1px solid #cbd5e1;border-radius:9px;font-size:15px';
  const hint=document.createElement('p');hint.className='p-info';hint.textContent='O funcionário deverá trocar a senha antes de usar o restaurante. Nunca compartilhe esta senha em um canal público.';
  const copy=document.createElement('button');copy.className='p-btn';copy.textContent='Copiar senha';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(inp.value);copy.textContent='Senha copiada'}catch{inp.select();copy.textContent='Selecione e copie a senha'}};
  const close=document.createElement('button');close.className='p-btn alt';close.style.marginLeft='10px';close.textContent='Fechar';
  close.onclick=()=>dialog.close();
  dialog.onclose=()=>{inp.value='';dialog.remove()};
  dialog.append(title,msg,inp,hint,copy,close);
  document.body.append(dialog);dialog.showModal();
 }
 const base=css+'<h1>Super Admin Gaveblue</h1><p class="muted">Gestão central dos restaurantes e módulos do Intervalo.</p><p class="p-info">As habilitações são de teste e não geram cobranças. Planos comerciais e pagamentos de assinaturas permanecem desativados.</p>';
 async function reload(){
  box(base+'<p>Carregando restaurantes...</p>');
  try{
   const data=await call('platform-control',{action:'list'});
   let out=base+'<div class="p-grid"><section class="p-card"><h2>Novo restaurante</h2><form id="platform-new" class="p-form"><label>Nome do restaurante<input name="name" minlength="2" maxlength="120" required></label><label>Slug<input name="slug" minlength="3" maxlength="60" pattern="[a-z0-9]+(-[a-z0-9]+)*" required placeholder="meu-restaurante"></label><label>E-mail do Master<input name="master_email" type="email" required></label><button class="p-btn" type="submit">Cadastrar e convidar</button></form><p class="p-info">Se o e-mail já tiver conta no Intervalo, será criado outro vínculo para o mesmo usuário.</p></section><section><h2>Restaurantes ('+(data.restaurants??[]).length+')</h2>';
   for(const r of data.restaurants??[]){
    const flags=(data.modules??[]).filter(m=>m.restaurant_id===r.id);
    const sub=(data.subscriptions??[]).find(s=>s.restaurant_id===r.id);
    out+='<article class="p-card"><h3>'+esc(r.name)+'</h3><p class="p-info">/'+esc(r.slug)+' · '+esc(r.status)+' · '+esc(sub?.status??'Sem assinatura')+'</p><div class="p-modules">';
    for(const [id,label] of modules){
      const active=flags.some(m=>m.module===id&&m.enabled);
      out+='<button type="button" class="p-module '+(active?'on':'')+'" data-rest="'+esc(r.id)+'" data-module="'+id+'" data-enabled="'+(!active)+'">'+label+' · '+(active?'Ligado':'Desligado')+'</button>';
    }
    out+='</div><h4>Usuários do restaurante</h4>';
    const members=(data.members??[]).filter(m=>m.restaurant_id===r.id);
    if(!members.length)out+='<p class="p-info">Nenhum usuário vinculado.</p>';
    for(const member of members){
      const account=(data.accounts??[]).find(u=>u.id===member.user_id);
      out+='<div class="p-card" style="padding:12px;background:#f8fafc"><b>'+esc(account?.email??'Conta não encontrada')+'</b><p class="p-info">'+esc(member.role)+' · '+esc(member.status)+(account?.confirmed?' · E-mail confirmado':' · E-mail não confirmado')+'</p>';
      if(account?.confirmed&&!account?.is_platform_admin&&member.status!=='revoked'){
        out+='<button type="button" class="p-btn alt" data-reset="'+esc(member.user_id)+'" data-restaurant="'+esc(r.id)+'" data-email="'+esc(account.email)+'">Redefinir senha</button> ';
      }
      if(member.role==='master'&&member.status==='pending')out+='<button type="button" class="p-btn alt" data-renew="'+esc(member.user_id)+'" data-restaurant="'+esc(r.id)+'">Renovar acesso Master</button>';
      out+='</div>';
    }
    out+='<p class="p-info">Para administrar este restaurante com sua própria conta, o Super Admin pode vincular-se explicitamente como Master (ação auditada).</p><button type="button" class="p-btn alt" data-join="'+esc(r.id)+'">Vincular minha conta como Master</button> ';
    out+='<button type="button" class="p-btn '+(r.status==='active'?'danger':'alt')+'" data-status="'+esc(r.id)+'" data-value="'+(r.status==='active'?'suspended':'active')+'">'+(r.status==='active'?'Suspender restaurante':'Reativar restaurante')+'</button></article>';
   }
   out+='</section></div>';box(out);
   const form=document.getElementById('platform-new');
   form.onsubmit=async e=>{e.preventDefault();const b=form.querySelector('button');b.disabled=true;try{const v=Object.fromEntries(new FormData(form).entries());const r=await call('admin-provision',{...v});alert(r.existing_user?'Restaurante criado. Master já possui login.':'Restaurante criado e convite do Master solicitado.');await reload()}catch(ex){alert(ex.message);b.disabled=false}};
   document.querySelectorAll('[data-reset]').forEach(button=>button.onclick=async()=>{
     const email=button.dataset.email;
     if(!confirm('Criar uma nova senha provisória para '+email+'? A senha antiga deixará de funcionar.'))return;
     const password=await askAdminPassword('Redefinir senha','O usuário deverá receber a senha por um canal seguro e trocá-la no primeiro acesso.');
     if(!password)return;
     button.disabled=true;
     try{
       const result=await call('platform-control',{action:'password_reset',restaurant_id:button.dataset.restaurant,user_id:button.dataset.reset,admin_password:password});
       if(!result?.temporary_password)throw Error('O servidor não retornou uma senha provisória');
       displayTemporaryPassword(result.temporary_password,email);
     }catch(e){alert(e.message)}
     finally{button.disabled=false}
   });
   document.querySelectorAll('[data-renew]').forEach(button=>button.onclick=async()=>{
     const password=await askAdminPassword('Renovar vínculo Master','Prolonga o prazo do convite pendente em sete dias. Não altera nem revela a senha existente.');
     if(!password)return;
     button.disabled=true;try{
       await call('platform-control',{action:'renew_master_invite',restaurant_id:button.dataset.restaurant,user_id:button.dataset.renew,admin_password:password});
       alert('Prazo do convite Master renovado. Entre com a conta Master para concluir a ativação.');await reload();
     }catch(e){alert(e.message);button.disabled=false}
   });
   document.querySelectorAll('[data-join]').forEach(button=>button.onclick=async()=>{
     const password=await askAdminPassword('Acessar como Master','Vincula sua própria conta de Super Admin como Master deste restaurante. A ação será registrada na auditoria, sem remover o Master atual.');
     if(!password)return;
     button.disabled=true;try{
       const result=await call('platform-control',{action:'join_as_master',restaurant_id:button.dataset.join,admin_password:password});
       if(result.joined){alert('Sua conta agora é Master deste restaurante. Selecione-o em Meus restaurantes.');location.assign(link('/inicio'));}
     }catch(e){alert(e.message);button.disabled=false}
   });
   document.querySelectorAll('[data-rest][data-module]').forEach(button=>button.onclick=async()=>{
    const enabled=button.dataset.enabled==='true';button.disabled=true;
    try{await call('platform-control',{action:'module_set',restaurant_id:button.dataset.rest,module:button.dataset.module,enabled});await reload()}
    catch(ex){alert(ex.message);button.disabled=false}
   });
   document.querySelectorAll('[data-status]').forEach(button=>button.onclick=async()=>{
    if(!confirm('Confirma a mudança de status? Um restaurante suspenso não pode operar nem publicar cardápio.'))return;
    button.disabled=true;try{await call('platform-control',{action:'restaurant_status',restaurant_id:button.dataset.status,status:button.dataset.value});await reload()}catch(ex){alert(ex.message);button.disabled=false}
   });
  }catch(e){box(base+'<section class="p-card"><p class="error">'+esc(e.message)+'</p></section>')}
 }
 return reload();
}