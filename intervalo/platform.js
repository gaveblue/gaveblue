// Intervalo — painel da Gaveblue: restaurantes, convites Master e módulos.
export async function renderPlatform({supabase,box,esc,link}){
 const css='<style>.p-grid{display:grid;grid-template-columns:1fr 1.2fr;gap:16px}.p-card{border:1px solid #e2e8f0;border-radius:14px;padding:20px;background:#fff;margin:13px 0}.p-form label{display:block;margin:12px 0;font-weight:700;font-size:12px}.p-form input{display:block;width:100%;margin-top:7px;padding:11px;border:1px solid #cbd5e1;border-radius:9px}.p-btn{padding:11px 14px;background:#0f766e;color:white;border:0;border-radius:9px;cursor:pointer;font-size:12px;font-weight:700}.p-btn.alt{background:#e2e8f0;color:#334155}.p-btn.danger{background:#fff1f2;color:#9f1239}.p-modules{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.p-module{border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#334155;padding:9px 10px;font-size:12px;cursor:pointer}.p-module.on{border-color:#99f6e4;background:#f0fdfa;color:#115e59;font-weight:750}.p-info{color:#64748b;font-size:12px}@media(max-width:800px){.p-grid{grid-template-columns:1fr}}</style>';
 const modules=[['gestao','Gestão'],['garcom','Garçom'],['cozinha','Cozinha'],['caixa','Caixa'],['cardapio','Cardápio']];
 const call=async(name,body)=>{const {data,error}=await supabase.functions.invoke(name,{body});if(error||data?.error){let msg=data?.error??error?.message??'Falha';try{const info=await error?.context?.json?.();if(info?.error)msg=info.error}catch{}throw Error(msg)}return data};
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
    out+='</div><button type="button" class="p-btn '+(r.status==='active'?'danger':'alt')+'" data-status="'+esc(r.id)+'" data-value="'+(r.status==='active'?'suspended':'active')+'">'+(r.status==='active'?'Suspender restaurante':'Reativar restaurante')+'</button></article>';
   }
   out+='</section></div>';box(out);
   const form=document.getElementById('platform-new');
   form.onsubmit=async e=>{e.preventDefault();const b=form.querySelector('button');b.disabled=true;try{const v=Object.fromEntries(new FormData(form).entries());const r=await call('admin-provision',{...v});alert(r.existing_user?'Restaurante criado. Master já possui login.':'Restaurante criado e convite do Master solicitado.');await reload()}catch(ex){alert(ex.message);b.disabled=false}};
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