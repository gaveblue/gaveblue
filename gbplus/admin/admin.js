import {createGbplusClient} from '../integrations/supabase/client.js';
import {cloudConfig} from '../js/cloud-config.js';

const client = createGbplusClient(window.supabase.createClient,cloudConfig);
const main = document.querySelector('#main'), dialog = document.querySelector('#editor');
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => value ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'}).format(new Date(value)) : 'Nunca acessou';
let users=[], page=1, total=null, hasMore=false, actor=null, query='', filter='all', busy=false, generation=0,mailReady=false;
const dateTime=value=>value?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'Sem registro';
const duration=value=>value==null?'Ainda não medido':`${Math.floor(value/3600)}h ${Math.floor(value%3600/60)}min`;
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
    users=result.users;actor=result.actor;total=result.total;hasMore=result.hasMore;mailReady=result.mail_ready===true;render();
  }catch(error){
    if(requestGeneration!==generation)return;
    if(error.status===401)login(error.message);else if(error.status===403)denied();
    else{clear();main.innerHTML=`<section class="locked card"><h1>Painel indisponível</h1><p>${esc(error.message)}</p><button id="retry">Tentar novamente</button><a class="button" href="./?web=1">Voltar ao GB+</a></section>`;document.querySelector('#retry').onclick=load;}
  }finally{busy=false;}
}
function render(){
  main.innerHTML=`<div class="heading"><div><span class="eyebrow">Controle de acesso</span><h1>Usuários e perfis</h1><p>Gerencie quem utiliza o GB+ e mantenha os cadastros em dia.</p></div><div class="session">${esc(actor.email)}<br><button id="logout">Sair do painel</button></div></div>
  <section class="cards" aria-label="Resumo de usuários"><div class="card"><span>Usuários cadastrados</span><strong>${total??'—'}</strong><small>Total informado pelo servidor</small></div><div class="card"><span>Online nesta página</span><strong>${users.filter(u=>u.usage?.online).length}</strong><small>Atividade nos últimos 75 segundos</small></div><div class="card"><span>Marketing autorizado</span><strong>${users.filter(u=>u.usage?.marketing).length}</strong><small>De ${users.length} perfis carregados</small></div><div class="card"><span>Suspensos nesta página</span><strong>${users.filter(u=>u.suspended).length}</strong><small>Novos logins bloqueados</small></div></section>
  <nav class="admin-actions" aria-label="Ações administrativas"><button id="invite" class="primary">+ Cadastrar e convidar</button><button id="compose" ${mailReady?'':'disabled'}>Escrever e-mail</button><button id="history">Histórico de envios</button></nav>
  ${mailReady?'':'<p class="note">O envio de mensagens personalizadas aguarda a configuração segura do provedor.</p>'}
  <section class="panel"><div class="toolbar"><label><span>Buscar nesta página</span><input id="search" type="search" placeholder="Nome ou e-mail" value="${esc(query)}" maxlength="254"></label><label><span>Situação</span><select id="filter"><option value="all">Todas as contas</option><option value="active">Login liberado</option><option value="suspended">Login suspenso</option><option value="pending">E-mail não confirmado</option><option value="admin">Administradores</option></select></label><button id="refresh">Atualizar</button></div>
  <div class="table-scroll"><table><thead><tr><th scope="col">Usuário</th><th scope="col">Situação</th><th scope="col">Atividade</th><th scope="col">Uso do GB+</th><th scope="col">Último login</th><th scope="col">Gerenciar</th></tr></thead><tbody id="rows"></tbody></table></div>
  <footer class="page-footer"><span id="count"></span><div><button id="prev" ${page===1?'disabled':''}>Anterior</button><button id="next" ${!hasMore?'disabled':''}>Próxima</button></div></footer></section>
  <p class="footnote">Online indica atividade recente, não conexão garantida. Tempo aproximado em primeiro plano é medido a partir desta atualização, sem reconstrução do passado. Atualização automática a cada 60 segundos quando nenhum formulário está aberto.</p><p class="footnote">Exibimos quantidades, sem nomes de contas, saldos ou lançamentos. Senhas não são exibidas. Envios aceitos pelo provedor ainda podem falhar na entrega; consulte o Resend para confirmação.</p>`;
  bindLogout();document.querySelector('#filter').value=filter;
  document.querySelector('#search').oninput=e=>{query=e.target.value;rows();};
  document.querySelector('#filter').onchange=e=>{filter=e.target.value;rows();};
  document.querySelector('#refresh').onclick=load;
  document.querySelector('#prev').onclick=()=>{if(page>1){page--;load();}};
  document.querySelector('#next').onclick=()=>{if(hasMore){page++;load();}};
  document.querySelector('#invite').onclick=inviteForm;
  document.querySelector('#compose').onclick=()=>composeForm();
  document.querySelector('#history').onclick=mailHistory;
  rows();
}
function rows(){
  const term=query.trim().toLocaleLowerCase('pt-BR');
  const visible=users.filter(u=>(`${u.name} ${u.email}`).toLocaleLowerCase('pt-BR').includes(term)&&
    (filter==='all'||filter==='active'&&!u.suspended||filter==='suspended'&&u.suspended||filter==='pending'&&!u.confirmed||filter==='admin'&&u.admin));
  document.querySelector('#rows').innerHTML=visible.map(u=>`<tr><td><div class="person"><span class="avatar">${esc((u.name||u.email||'?').slice(0,2).toUpperCase())}</span><div><strong>${esc(u.name||'Sem nome cadastrado')}</strong><span class="sub">${esc(u.email)}</span></div></div></td><td><span class="badge ${u.suspended?'paused':!u.confirmed?'pending':''}">${u.suspended?'Suspenso':u.confirmed?'Ativo':u.invited_at?'Convidado':'Não confirmado'}</span>${u.admin?'<span class="badge admin">Admin</span>':''}</td><td><span class="badge ${u.usage?.online?'':'pending'}">${u.usage?.online?'Online recente':u.usage?.tracked_since?'Sem atividade recente':'Ainda não medido'}</span><span class="sub">${duration(u.usage?.active_seconds)}</span></td><td>${u.usage?.accounts??'—'} contas · ${u.usage?.cards??'—'} cartões<span class="sub">${u.usage?.titles??'—'} lançamentos</span></td><td>${dateTime(u.last_sign_in_at)}<span class="sub">${u.providers.map(p=>p==='google'?'Google':'E-mail').join(' + ')||'—'}</span></td><td><button data-id="${esc(u.id)}" aria-label="Gerenciar ${esc(u.email)}">Gerenciar</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhum usuário encontrado nesta página.</td></tr>';
  document.querySelector('#count').textContent=`Página ${page} · ${visible.length} de ${users.length} perfis carregados`;
  document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openUser(users.find(u=>u.id===b.dataset.id)));
}
function showDialog(content){dialog.innerHTML=content;dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>dialog.close());if(!dialog.open)dialog.showModal();}
function openUser(user){
  if(!user)return;
  const usage=user.usage||{};
  showDialog(`<h2 id="dialog-title">${esc(user.name||'Gerenciar perfil')}</h2><p>${esc(user.email)}</p><div class="note">Cadastro em ${date(user.created_at)} · ${user.confirmed?'E-mail confirmado':'E-mail não confirmado'}</div>
  <dl class="profile-summary"><dt>Celular informado</dt><dd>${esc(user.phone||'Não informado')}</dd><dt>Cidade / UF</dt><dd>${esc([user.city,user.state].filter(Boolean).join(' / ')||'Não informado')}</dd><dt>Última atividade</dt><dd>${dateTime(usage.last_seen_at)}</dd><dt>Tempo aproximado</dt><dd>${duration(usage.active_seconds)}</dd><dt>Medição iniciada</dt><dd>${dateTime(usage.tracked_since)}</dd><dt>Registros cadastrados</dt><dd>${usage.accounts??0} contas, ${usage.cards??0} cartões, ${usage.titles??0} lançamentos, ${usage.partners??0} parceiros</dd><dt>Última gravação financeira</dt><dd>${dateTime(usage.data_updated_at)}</dd><dt>Marketing</dt><dd>${usage.marketing?'Autorizado pelo usuário':'Não autorizado'}<br><small>${dateTime(usage.consent_changed_at)}</small></dd></dl>
  <div class="details"><button id="edit">Editar nome e celular</button><button id="write-user" ${mailReady&&!user.suspended&&user.confirmed?'':'disabled'}>Escrever e-mail para este usuário</button><button id="recover" ${user.suspended?'disabled':''}>Enviar recuperação de acesso</button>${!user.admin?`<button id="status" class="${user.suspended?'':'danger'}">${user.suspended?'Reativar login':'Suspender login'}</button>`:'<p class="note">O acesso de administradores é protegido contra suspensão por este painel.</p>'}</div><div class="actions"><button data-close>Fechar</button></div>`);
  document.querySelector('#edit').onclick=()=>editUser(user);
  document.querySelector('#recover').onclick=()=>confirmAction(user,'recovery');
  document.querySelector('#write-user').onclick=()=>composeForm({ids:[user.id]});
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
function inviteForm(values={}){
 showDialog(`<h2 id="dialog-title">Cadastrar e convidar</h2><p>O novo usuário recebe um convite e define a própria senha. Este cadastro não concede administração nem autoriza marketing.</p><form id="invite-form"><label><span>Nome</span><input name="name" required minlength="2" maxlength="120" value="${esc(values.name||'')}"></label><label><span>E-mail</span><input name="email" type="email" required maxlength="254" value="${esc(values.email||'')}"></label><p class="error" role="alert"></p><div class="actions"><button type="button" data-close>Cancelar</button><button class="primary">Revisar convite</button></div></form>`);
 document.querySelector('#invite-form').onsubmit=event=>{
  event.preventDefault();const fields=Object.fromEntries(new FormData(event.currentTarget));
  const operation_id=crypto.randomUUID();
  showDialog(`<h2 id="dialog-title">Confirmar convite</h2><p>Cadastrar <strong>${esc(fields.name)}</strong> e enviar o convite para <strong>${esc(fields.email)}</strong>?</p><p>O limite do painel é de 30 envios em 24 horas, compartilhado com suas mensagens personalizadas.</p><p class="error" role="alert"></p><div class="actions"><button id="back-invite">Voltar</button><button id="send-invite" class="primary">Cadastrar e enviar convite</button></div>`);
  document.querySelector('#back-invite').onclick=()=>inviteForm(fields);
  document.querySelector('#send-invite').onclick=async()=>{
   dialog.dataset.busy='true';dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
   try{await api({action:'invite',...fields,operation_id});dialog.close();await load();notice('Convite aceito pelo serviço de envio. Confira o histórico e a entrega no provedor.');}
   catch(error){dialog.querySelector('.error').textContent=error.message;document.querySelector('#back-invite').disabled=false;}
   finally{dialog.dataset.busy='false';}
  };
 };
}
function composeForm(draft={}){
 const kind=draft.kind||'service',ids=draft.ids||[];
 const options=users.filter(u=>u.confirmed&&!u.suspended);
 showDialog(`<h2 id="dialog-title">Escrever e-mail</h2><p>Envio individual, sem expor os endereços dos demais destinatários. Selecione até 10 usuários da página atual.</p><form id="compose-form"><label><span>Tipo de comunicação</span><select name="kind"><option value="service">Aviso de serviço / suporte</option><option value="marketing">Marketing / novidades / ofertas</option></select></label><p class="note" id="mail-kind-help"></p><fieldset class="recipients"><legend>Destinatários</legend>${options.map(u=>`<label class="recipient" data-marketing="${Boolean(u.usage?.marketing)}"><input type="checkbox" name="recipient" value="${esc(u.id)}" ${ids.includes(u.id)?'checked':''}><span>${esc(u.name||u.email)}<small>${esc(u.email)} · ${u.usage?.marketing?'marketing autorizado':'sem autorização de marketing'}</small></span></label>`).join('')||'<p>Nenhum destinatário elegível nesta página.</p>'}</fieldset><label><span>Assunto</span><input name="subject" required minlength="3" maxlength="150" value="${esc(draft.subject||'')}"></label><label><span>Mensagem</span><textarea name="message" required minlength="10" maxlength="5000" rows="8" placeholder="Escreva sua mensagem. A assinatura e o descadastro são adicionados automaticamente.">${esc(draft.message||'')}</textarea></label><p class="error" role="alert"></p><div class="actions"><button type="button" data-close>Cancelar</button><button class="primary">Revisar mensagem</button></div></form>`);
 const form=document.querySelector('#compose-form');form.elements.kind.value=kind;
 const applyKind=()=>{
  const marketing=form.elements.kind.value==='marketing';
  document.querySelector('#mail-kind-help').textContent=marketing?'Somente usuários que autorizaram marketing podem receber. O e-mail inclui um link de descadastro.':'Use apenas para informações necessárias à conta, ao funcionamento do serviço ou atendimento. Conteúdo promocional deve usar a opção Marketing.';
  form.querySelectorAll('.recipient').forEach(row=>{const box=row.querySelector('input');box.disabled=marketing&&row.dataset.marketing!=='true';if(box.disabled)box.checked=false;});
 };
 form.elements.kind.onchange=applyKind;applyKind();
 form.onsubmit=event=>{
  event.preventDefault();const fields=new FormData(form),chosen=fields.getAll('recipient');
  if(chosen.length<1||chosen.length>10){form.querySelector('.error').textContent='Selecione entre 1 e 10 destinatários.';return;}
  previewMessage({kind:fields.get('kind'),subject:String(fields.get('subject')).trim(),message:String(fields.get('message')).trim(),ids:chosen});
 };
}
function previewMessage(draft){
 const recipients=draft.ids.map(id=>users.find(u=>u.id===id)).filter(Boolean);
 showDialog(`<h2 id="dialog-title">Prévia do e-mail</h2><p><strong>${draft.kind==='marketing'?'Marketing':'Serviço / suporte'}</strong> · ${recipients.length} destinatário(s)</p><p class="recipient-list">${recipients.map(u=>esc(u.email)).join('<br>')}</p><article class="mail-preview"><strong>GB+ Gestão Financeira</strong><h3>${esc(draft.subject)}</h3><div class="mail-text">${esc(draft.message)}</div><hr><small>${draft.kind==='marketing'?'Você autorizou novidades do GB+. Cancelar recebimento (link individual incluído no envio).':'Mensagem de serviço. Suporte: contato@gaveblue.com.br'}<br>Política de privacidade do GB+</small></article><p class="note">Após confirmar, cada mensagem será enviada individualmente. O consentimento é verificado novamente no servidor. Limite de 30 envios do painel em 24 horas.</p><div id="send-results" role="status"></div><div class="actions"><button id="back-compose">Voltar e editar</button><button id="send-message" class="primary">Confirmar e enviar ${recipients.length} e-mail(s)</button></div>`);
 document.querySelector('#back-compose').onclick=()=>composeForm(draft);
 document.querySelector('#send-message').onclick=async()=>{
  dialog.dataset.busy='true';dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
  const results=document.querySelector('#send-results');let accepted=0;
  for(const [i,user] of recipients.entries()){
   const row=document.createElement('p');row.textContent=`${user.email}: enviando…`;results.append(row);
   try{await api({action:'send_email',user_id:user.id,kind:draft.kind,subject:draft.subject,message:draft.message,operation_id:crypto.randomUUID()});row.textContent=`${user.email}: aceito pelo provedor`;accepted++;}
   catch(error){row.textContent=`${user.email}: ${error.message}`;if(error.status===401||error.status===403)break;}
   if(i<recipients.length-1)await new Promise(resolve=>setTimeout(resolve,1100));
  }
  dialog.dataset.busy='false';dialog.querySelector('.actions').innerHTML='<button id="done-message">Concluir</button>';
  document.querySelector('#done-message').onclick=()=>{dialog.close();load();};
  notice(`${accepted} de ${recipients.length} mensagem(ns) aceita(s) pelo provedor. Confira os resultados individuais.`);
 };
}
async function mailHistory(){
 showDialog('<h2 id="dialog-title">Histórico de envios</h2><p role="status">Carregando…</p><div class="actions"><button data-close>Fechar</button></div>');
 try{const result=await api({action:'mail_history'});if(!dialog.open)return;
  const status={accepted:'Aceito pelo provedor',failed:'Falhou',unknown:'Resultado incerto — conferir Resend',sending:'Processando — conferir antes de repetir'};
  showDialog(`<h2 id="dialog-title">Histórico de envios</h2><p>Últimas 50 operações. “Aceito” não confirma entrega ou leitura. Sem rastreamento de abertura.</p><div class="history-list">${result.jobs.map(job=>`<article><strong>${esc(job.subject)}</strong><p>${esc(job.recipient)}<br>${dateTime(job.created_at)} · ${esc({invite:'Convite',service:'Serviço',marketing:'Marketing'}[job.kind])}<br><span class="badge ${job.status==='accepted'?'':'pending'}">${esc(status[job.status]||job.status)}</span></p></article>`).join('')||'<p>Nenhum envio feito pelo painel.</p>'}</div><div class="actions"><button data-close>Fechar</button></div>`);
 }catch(error){showDialog(`<h2 id="dialog-title">Histórico indisponível</h2><p>${esc(error.message)}</p><div class="actions"><button data-close>Fechar</button></div>`);}
}
dialog.addEventListener('cancel',event=>{if(dialog.dataset.busy==='true')event.preventDefault();});
setInterval(()=>{if(actor&&!document.hidden&&!dialog.open&&document.activeElement?.id!=='search')void load();},60000);
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
