// The settings home follows WeFrotas: categories first, one subject per screen.
(() => {
  'use strict';
  const el=id=>document.getElementById(id),root=el('layout-settings');
  const heading=root.querySelector('.section-heading');
  const profileButton=el('edit-local-profile'),files=el('file-storage-settings');
  const layoutNodes=[...root.children].filter(node=>node!==heading&&node!==files);
  const categories=[
    ['profile','Perfil local','Pessoa ou empresa que emite os recibos'],
    ['accounts','Contas bancárias','Cadastro de contas e saldos iniciais do Financeiro'],
    ['files','Arquivos','Pasta de destino, anexos e recibos antigos'],
    ['layout','Layout de impressão','Posição e formatação dos textos e linhas no PDF'],
    ['backup','Backup','Exportação e restauração do histórico'],
    ['about','Sobre os dados','Como seus recibos e arquivos são armazenados']
  ];
  root.setAttribute('aria-label','Configurações');
  const shell=document.createElement('div');shell.className='settings-shell';
  shell.innerHTML=`<div class="section-heading"><div><span class="section-kicker">Recibos Covre</span><h1>Configurações</h1><p>Escolha o que deseja configurar.</p></div></div>
    <div id="settings-home" class="settings-screen"><div class="settings-menu-list">${categories.map(([id,title,subtitle])=>`<button type="button" class="settings-menu-item" data-settings-open="${id}"><span><span class="settings-menu-title">${title}</span><span class="settings-menu-subtitle">${subtitle}</span></span><span class="settings-menu-arrow" aria-hidden="true">›</span></button>`).join('')}</div></div>
    ${categories.map(([id,title])=>`<section id="settings-${id}" class="settings-screen" hidden aria-labelledby="settings-title-${id}"><div class="settings-subhead"><button type="button" class="settings-back-btn" data-settings-back aria-label="Voltar às configurações">← Voltar</button><h2 id="settings-title-${id}" tabindex="-1">${title}</h2></div><div class="settings-content"></div></section>`).join('')}`;
  root.append(shell);
  const content=id=>el('settings-'+id).querySelector('.settings-content');
  content('profile').innerHTML='<section class="panel settings-block"><h3>Dados do emissor</h3><p>Este perfil preenche o pagador e o local de emissão dos novos recibos.</p><dl id="settings-profile-summary"></dl><div id="settings-profile-action"></div></section>';
  el('settings-profile-action').append(profileButton);
  content('files').append(files);
  content('accounts').innerHTML='<section class="panel settings-block"><h3>Contas do Financeiro</h3><p>Cadastre as contas usadas nas baixas dos recibos e informe o saldo inicial de cada uma.</p><button type="button" id="finance-new-account">＋ Nova conta</button><p id="finance-account-status" role="status"></p><div id="finance-account-list"></div></section>';
  const layoutIntro=document.createElement('p');layoutIntro.className='settings-description';layoutIntro.textContent='A página abaixo é o próprio PDF. Clique em um texto ou linha para ajustar.';
  content('layout').append(layoutIntro,...layoutNodes);
  content('backup').append(el('backup-screen').querySelector('.panel'));
  content('about').innerHTML='<section class="panel settings-block"><h3>Neste navegador</h3><p>Perfil, parceiros, histórico e preferências são salvos localmente neste navegador e dispositivo. Outro navegador ou computador terá seus próprios dados.</p></section><section class="panel settings-block"><h3>Na pasta do computador</h3><p>Ao escolher uma pasta em Arquivos, os novos PDFs e comprovantes são salvos nela. O histórico continua no navegador. Os recibos antigos permanecem onde estão até você optar por copiá-los.</p><p>Excluir um recibo do histórico não apaga seus arquivos do computador.</p></section><section class="panel settings-block"><h3>Guarde uma cópia</h3><p>Exporte um backup para preservar o histórico e os anexos ou transferi-los para outro navegador. Limpar os dados do navegador remove seus registros locais.</p></section>';
  heading.remove();
  let active='home',profileRevision=0;
  async function updateProfile(){
    const revision=++profileRevision,list=el('settings-profile-summary');list.textContent='Carregando perfil…';
    try{
      await databaseReady;
      const profile=(await transaction('readonly',s=>s.get('local-profile'),'config'))?.value;
      if(revision!==profileRevision)return;
      list.replaceChildren();
      for(const [label,value] of [['Nome / razão social',profile?.name],['CPF / CNPJ',profile?.document],['Cidade / UF',profile?.city]]){
        const row=document.createElement('div'),term=document.createElement('dt'),description=document.createElement('dd');
        term.textContent=label;description.textContent=value||'Não informado';row.append(term,description);list.append(row);
      }
    }catch(error){list.textContent='Não foi possível carregar o perfil: '+error.message;}
  }
  function open(screen='home'){
    if(screen!=='home'&&!categories.some(([id])=>id===screen))return;
    const previous=active;active=screen;
    setActiveSection('settings','Configurações');
    shell.querySelector('.section-heading').hidden=screen!=='home';
    shell.querySelectorAll('.settings-screen').forEach(node=>node.hidden=node.id!=='settings-'+screen);
    if(screen==='layout')window.receiptLayout.open();
    if(screen==='profile')updateProfile();
    if(screen==='accounts')window.receiptFinance?.reload().catch(error=>{el('finance-account-status').textContent=error.message;});
    const focus=screen==='home'?shell.querySelector(`[data-settings-open="${previous==='home'?'profile':previous}"]`):el('settings-title-'+screen);
    focus?.focus({preventScroll:true});root.scrollIntoView({block:'start'});
  }
  shell.querySelectorAll('[data-settings-open]').forEach(button=>button.onclick=()=>open(button.dataset.settingsOpen));
  shell.querySelectorAll('[data-settings-back]').forEach(button=>button.onclick=()=>open());
  el('profile-dialog').addEventListener('close',()=>{if(active==='profile')updateProfile();});
  el('nav-settings').onclick=()=>open();
  el('nav-backup').onclick=()=>open('backup');
  window.receiptSettings={open};
})();
