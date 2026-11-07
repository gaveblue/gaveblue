import {createGbplusClient} from '../integrations/supabase/client.js';
import {cloudConfig} from '../js/cloud-config.js';

const client = createGbplusClient(window.supabase.createClient,cloudConfig);
const main = document.querySelector('#main'), dialog = document.querySelector('#editor');
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => value ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'}).format(new Date(value)) : 'Nunca acessou';
let users=[], page=1, total=null, hasMore=false, actor=null, query='', filter='all', busy=false, generation=0;
const notice = message => {document.querySelector('#notice').textContent=message;};
function clear(){users=[];actor=null;dialog.close();notice('');}

async function api(body){
  const {data,error}=await client.auth.getSession();
  if(error||!data.session)throw Object.assign(Error('Entre na sua conta para continuar.'),{status:401});
  const response=await fetch(`${cloudConfig.url}/functions/v1/gbplus-admin`,{
    method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',apikey:cloudConfig.publishableKey,
      Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify(body)
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(Error(result.error||'Não foi possível acessar o painel. Tente novamente.'),{status:response.status});
  return result;
}
function login(message=''){
  clear();main.innerHTML=`<section class="login"><span class="eyebrow">GB+ · Acesso restrito</span><h1>Painel gerencial</h1><p>Entre com sua conta de administrador do GB+.</p>
  <form id="login"><label><span>E-mail</span><input name="email" type="email" autocomplete="username" required maxlength="254"></label>
  <label><span>Senha</span><input name="password" type="password" autocomplete="current-password" required maxlength="128"></label>
  <div class="error" role="alert">${esc(message)}</div><button class="primary">Entrar no painel</button></form>
  <button id="google" class="google">Continuar com o Google</button><p><a href="../gbplus/?web=1">Recuperar senha no GB+</a></p><p>O acesso administrativo precisa ser liberado para sua conta.</p></section>`;
  document.querySelector('#login').onsubmit=async event=>{
    event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;
    try{const values=new FormData(form);const {error}=await client.auth.signInWithPassword({email:String(values.get('email')).trim(),password:String(values.get('password'))});
      form.elements.password.value='';if(error)throw Error('Não foi possível entrar. Confira seu e-mail e senha.');await load();
    }catch(error){form.querySelector('.error').textContent=error.message;}finally{button.disabled=false;}
  };
  document.querySelector('#google').onclick=async event=>{
    event.currentTarget.disabled=true;
    const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${cloudConfig.siteUrl}admin.html`,queryParams:{prompt:'select_account'}}});
    if(error)login('Não foi possível iniciar o login com Google. Tente novamente.');
  };
}
function denied(){
  clear();main.innerHTML='<section class="locked card"><span class="eyebrow">Acesso restrito</span><h1>Conta sem permissão</h1><p>Seu login é válido, mas esta conta não é administradora do GB+.</p><a class="button" href="./?web=1">Voltar ao financeiro</a><button id="logout">Trocar de conta</button></section>';bindLogout();
}
function bindLogout(){document.querySelector('#logout').onclick=async()=>{
  const {error}=await client.auth.signOut({scope:'local'});if(error)return notice('Não foi possível sair. Confira a conexão.');generation++;login();
};}
async function load(){
  if(busy)return;busy=true;const requestGeneration=++generation;
  try{
    const result=await api({action:'list',page});if(requestGeneration!==generation)return;
    users=result.users;actor=result.actor;total=result.total;hasMore=result.hasMore;render();
  }catch(error){
    if(requestGeneration!==generation)return;
    if(error.status===401)login(error.message);else if(error.status===403)denied();
    else{clear();main.innerHTML=`<section class="locked card"><h1>Painel indisponível</h1><p>${esc(error.message)}</p><button id="retry">Tentar novamente</button><a class="button" href="./?web=1">Voltar ao GB+</a></section>`;document.querySelector('#retry').onclick=load;}
  }finally{busy=false;}
}
function render(){
  main.innerHTML=`<div class="heading"><div><span class="eyebrow">Controle de acesso</span><h1>Usuários e perfis</h1><p>Gerencie quem utiliza o GB+ e mantenha os cadastros em dia.</p></div><div class="session">${esc(actor.email)}<br><button id="logout">Sair do painel</button></div></div>
  <section class="cards" aria-label="Resumo de usuários"><div class="card"><span>Usuários cadastrados</span><strong>${total??'—'}</strong><small>Total informado pelo servidor</small></div><div class="card"><span>Confirmados nesta página</span><strong>${users.filter(u=>u.confirmed).length}</strong><small>De ${users.length} perfis carregados</small></div><div class="card"><span>Suspensos nesta página</span><strong>${users.filter(u=>u.suspended).length}</strong><small>Novos logins bloqueados</small></div></section>
  <section class="panel"><div class="toolbar"><label><span>Buscar nesta página</span><input id="search" type="search" placeholder="Nome ou e-mail" value="${esc(query)}" maxlength="254"></label><label><span>Situação</span><select id="filter"><option value="all">Todas as contas</option><option value="active">Login liberado</option><option value="suspended">Login suspenso</option><option value="pending">E-mail não confirmado</option><option value="admin">Administradores</option></select></label><button id="refresh">Atualizar</button></div>
  <div class="table-scroll"><table><thead><tr><th scope="col">Usuário</th><th scope="col">Situação</th><th scope="col">Login</th><th scope="col">Último acesso</th><th scope="col">Gerenciar</th></tr></thead><tbody id="rows"></tbody></table></div>
  <footer class="page-footer"><span id="count"></span><div><button id="prev" ${page===1?'disabled':''}>Anterior</button><button id="next" ${!hasMore?'disabled':''}>Próxima</button></div></footer></section>
  <p class="footnote">Os registros financeiros permanecem nas contas de seus titulares. Senhas não são exibidas nem definidas neste painel.</p>`;
  bindLogout();document.querySelector('#filter').value=filter;
  document.querySelector('#search').oninput=e=>{query=e.target.value;rows();};
  document.querySelector('#filter').onchange=e=>{filter=e.target.value;rows();};
  document.querySelector('#refresh').onclick=load;
  document.querySelector('#prev').onclick=()=>{if(page>1){page--;load();}};
  document.querySelector('#next').onclick=()=>{if(hasMore){page++;load();}};
  rows();
}
function rows(){
  const term=query.trim().toLocaleLowerCase('pt-BR');
  const visible=users.filter(u=>(`${u.name} ${u.email}`).toLocaleLowerCase('pt-BR').includes(term)&&
    (filter==='all'||filter==='active'&&!u.suspended||filter==='suspended'&&u.suspended||filter==='pending'&&!u.confirmed||filter==='admin'&&u.admin));
  document.querySelector('#rows').innerHTML=visible.map(u=>`<tr><td><div class="person"><span class="avatar">${esc((u.name||u.email||'?').slice(0,2).toUpperCase())}</span><div><strong>${esc(u.name||'Sem nome cadastrado')}</strong><span class="sub">${esc(u.email)}</span></div></div></td><td><span class="badge ${u.suspended?'paused':!u.confirmed?'pending':''}">${u.suspended?'Suspenso':u.confirmed?'Ativo':'Não confirmado'}</span>${u.admin?'<span class="badge admin">Admin</span>':''}</td><td>${u.providers.map(p=>p==='google'?'Google':'E-mail').join(' + ')||'—'}</td><td>${date(u.last_sign_in_at)}<span class="sub">Cadastro: ${date(u.created_at)}</span></td><td><button data-id="${esc(u.id)}" aria-label="Gerenciar ${esc(u.email)}">Gerenciar</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Nenhum usuário encontrado nesta página.</td></tr>';
  document.querySelector('#count').textContent=`Página ${page} · ${visible.length} de ${users.length} perfis carregados`;
  document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openUser(users.find(u=>u.id===b.dataset.id)));
}
function showDialog(content){dialog.innerHTML=content;dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>dialog.close());if(!dialog.open)dialog.showModal();}
function openUser(user){
  if(!user)return;
  showDialog(`<h2 id="dialog-title">Gerenciar perfil</h2><p>${esc(user.email)}</p><div class="note">Cadastro em ${date(user.created_at)} · ${user.confirmed?'E-mail confirmado':'E-mail não confirmado'}</div><div class="details"><button id="edit">Editar nome e celular</button><button id="recover" ${user.suspended?'disabled':''}>Enviar recuperação de acesso</button>${!user.admin?`<button id="status" class="${user.suspended?'':'danger'}">${user.suspended?'Reativar login':'Suspender login'}</button>`:'<p class="note">O acesso de administradores é protegido contra suspensão por este painel.</p>'}</div><div class="actions"><button data-close>Fechar</button></div>`);
  document.querySelector('#edit').onclick=()=>editUser(user);
  document.querySelector('#recover').onclick=()=>confirmAction(user,'recovery');
  const status=document.querySelector('#status');if(status)status.onclick=()=>confirmAction(user,user.suspended?'reactivate':'suspend');
}
function editUser(user){
  showDialog(`<h2 id="dialog-title">Editar perfil</h2><p>${esc(user.email)}</p><form id="profile"><label><span>Nome completo</span><input name="name" required minlength="2" maxlength="120" value="${esc(user.name)}"></label><label><span>Celular com DDD</span><input name="phone" type="tel" maxlength="20" value="${esc(user.phone)}"></label><p class="error" role="alert"></p><div class="actions"><button type="button" data-close>Cancelar</button><button class="primary">Salvar alterações</button></div></form>`);
  document.querySelector('#profile').onsubmit=e=>{e.preventDefault();const fields=new FormData(e.currentTarget);mutate(user,'profile',{name:fields.get('name'),phone:fields.get('phone')});};
}
function confirmAction(user,action){
  const messages={recovery:['Enviar recuperação de acesso?','O titular receberá um e-mail para definir sua própria senha. O link retorna ao GB+.'],suspend:['Suspender novos logins?','A conta e seus registros serão preservados. Sessões já abertas podem continuar válidas até o token expirar; este comando não encerra imediatamente todos os acessos.'],reactivate:['Reativar login?','O titular poderá voltar a entrar na conta e acessar os registros preservados.']};
  showDialog(`<h2 id="dialog-title">${messages[action][0]}</h2><p>${esc(user.email)}</p><p>${messages[action][1]}</p><p class="error" role="alert"></p><div class="actions"><button data-close>Cancelar</button><button id="confirm" class="${action==='suspend'?'danger':'primary'}">Confirmar</button></div>`);
  document.querySelector('#confirm').onclick=()=>mutate(user,action);
}
async function mutate(user,action,extra={}){
  if(dialog.dataset.busy==='true')return;dialog.dataset.busy='true';dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{await api({action,user_id:user.id,...extra});dialog.close();await load();notice(action==='recovery'?'Solicitação de recuperação enviada. O titular deve conferir o e-mail.':'Alteração salva.');}
  catch(error){if(error.status===401){generation++;login(error.message);}else if(error.status===403){generation++;denied();}else{const el=dialog.querySelector('.error');if(el)el.textContent=error.message;}}
  finally{dialog.dataset.busy='false';dialog.querySelectorAll('button').forEach(b=>b.disabled=false);}
}
client.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){generation++;login();}
  if(event==='SIGNED_IN'&&actor&&session?.user?.id!==actor.id){
    generation++;clear();main.innerHTML='<p class="loading">Verificando a nova conta…</p>';setTimeout(load,0);
  }
});
window.addEventListener('offline',()=>notice('Sem conexão. O gerenciamento exige acesso online.'));
window.addEventListener('pageshow',event=>{if(event.persisted){clear();load();}});
const callback=new URL(location.href);
if(callback.searchParams.has('error')||callback.hash.includes('error=')){
  history.replaceState(null,'',location.pathname);login('O login com Google foi cancelado ou não pôde ser concluído.');
}else await load();
