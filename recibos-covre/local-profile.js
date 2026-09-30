// Profiles and receipt data stay in this browser's IndexedDB.
(() => {
  'use strict';
  let profile=null, saving=false;
  const dialog=document.createElement('dialog');
  dialog.id='profile-dialog';
  dialog.setAttribute('aria-labelledby','profile-title');
  const fields=[['name','Nome / razão social',80,true],['document','CPF / CNPJ',18,true],['ie','Inscrição estadual',25],['address','Endereço',100],['city','Cidade / UF',50,true],['cep','CEP',9],['bank','Banco',100],['agency','Agência',20],['account','Conta',25]];
  dialog.innerHTML=`<form id="profile-form"><span class="section-kicker">Neste dispositivo</span><h1 id="profile-title">Cadastre seu perfil</h1><p>Informe a pessoa ou empresa que emitirá os recibos. Estes dados preencherão o pagador nos novos recibos.</p><div class="fields">${fields.map(([name,label,max,required])=>`<label${name==='name'?' class="wide"':''}>${label}${required?' *':''}<input name="${name}" maxlength="${max}" ${required?'required':''} ${name==='document'||name==='cep'?'inputmode="numeric"':''}></label>`).join('')}</div><p class="profile-note">O perfil, os parceiros e os recibos ficam somente neste navegador. Outro dispositivo terá seu próprio cadastro. Guarde seus recibos pelo menu Backup.</p><p id="profile-status" role="status"></p><div class="profile-actions"><button id="profile-cancel" class="secondary" type="button">Cancelar</button><button id="profile-save" type="submit">Salvar perfil e começar</button></div></form>`;
  document.body.append(dialog);
  const profileForm=dialog.querySelector('form'),input=name=>profileForm.elements.namedItem(name);
  const status=document.getElementById('profile-status');
  const profileButton=document.createElement('button');profileButton.type='button';profileButton.className='secondary';profileButton.id='edit-local-profile';profileButton.textContent='Editar perfil local';
  document.querySelector('#layout-settings .section-heading').append(profileButton);
  profileButton.onclick=()=>open();
  document.querySelector('.company-badge').onclick=()=>open();
  document.getElementById('profile-cancel').onclick=()=>{if(profile&&!saving)dialog.close();};
  dialog.addEventListener('cancel',event=>{if(!profile||saving)event.preventDefault();});
  function open(){
    profileForm.reset();status.textContent='';
    for(const [name] of fields)input(name).value=profile?.[name]||'';
    input('document').setCustomValidity('');input('cep').setCustomValidity('');
    document.getElementById('profile-cancel').hidden=!profile;
    document.getElementById('profile-title').textContent=profile?'Perfil local':'Cadastre seu perfil';
    document.getElementById('profile-save').textContent=profile?'Salvar perfil':'Salvar perfil e começar';
    if(!dialog.open)dialog.showModal();
  }
  input('document').addEventListener('input',()=>{input('document').value=formatDocument(input('document').value);input('document').setCustomValidity('');});
  input('cep').addEventListener('input',()=>{input('cep').value=input('cep').value.replace(/\D/g,'').slice(0,8).replace(/^(\d{5})(\d)/,'$1-$2');input('cep').setCustomValidity('');});
  function applyDefaults(){if(profile){choosePayer(profile);field('local').value=profile.city;}}
  function applyBrand(){
    document.querySelector('.company-badge').textContent=profile.name;
    document.querySelector('.company-card strong').textContent=profile.name;
    document.querySelector('.company-avatar').textContent=profile.name.split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase();
  }
  profileForm.onsubmit=async event=>{
    event.preventDefault();if(saving)return;
    for(const [name] of fields)input(name).value=input(name).value.trim();
    input('document').setCustomValidity(validDocument(input('document').value)?'':'Informe um CPF ou CNPJ válido.');
    input('cep').setCustomValidity(!input('cep').value||input('cep').value.replace(/\D/g,'').length===8?'':'Informe um CEP com 8 dígitos.');
    if(!profileForm.reportValidity())return;
    saving=true;document.getElementById('profile-save').disabled=true;status.textContent='Salvando neste navegador…';
    try{
      const value=Object.fromEntries(new FormData(profileForm));value.document=formatDocument(value.document);
      await transaction('readwrite',store=>store.put({id:'local-profile',value}),'config');
      const first=!profile;profile=value;applyBrand();applyDefaults();dialog.close();
      if(first)setActiveSection('home','Início');
      await updateStorage();
    }catch(error){status.textContent=error.message||'Não foi possível salvar o perfil local. Tente novamente.';}
    finally{saving=false;document.getElementById('profile-save').disabled=false;}
  };
  const storage=document.createElement('article');storage.className='panel storage-panel';storage.id='local-storage-card';
  storage.innerHTML=`<div class="storage-heading"><div><h2>Armazenamento local</h2><p>Recibos, PDFs e anexos guardados no IndexedDB.</p></div><button type="button" class="secondary" id="refresh-storage">Atualizar</button></div><div class="storage-content"><div class="storage-ring" id="storage-ring" role="img" aria-label="Calculando armazenamento"><strong id="storage-percent">—</strong><span>do limite estimado</span></div><dl><div><dt>Usado pelo site</dt><dd id="storage-used">Calculando…</dd></div><div><dt>Limite estimado</dt><dd id="storage-quota">—</dd></div><div><dt>Disponível estimado</dt><dd id="storage-free">—</dd></div></dl></div><p id="storage-status" role="status"></p><small>Estimativa do navegador para todo o site, incluindo outros módulos. O limite pode mudar conforme o espaço do dispositivo. Limpar os dados do navegador remove os registros locais; mantenha um backup.</small>`;
  document.getElementById('home').append(storage);
  const el=id=>document.getElementById(id);
  const bytes=value=>{const units=['B','KB','MB','GB','TB'];let n=value,i=0;while(n>=1024&&i<units.length-1){n/=1024;i++;}return n.toLocaleString('pt-BR',{maximumFractionDigits:2})+' '+units[i];};
  let storageRevision=0;
  async function updateStorage(){
    const revision=++storageRevision;
    try{
      if(!navigator.storage?.estimate)throw new Error('Este navegador não informa a capacidade de armazenamento.');
      const {usage,quota}=await navigator.storage.estimate();if(revision!==storageRevision)return;
      if(!Number.isFinite(usage)||!Number.isFinite(quota)||quota<=0)throw new Error('O navegador não disponibilizou uma estimativa de capacidade.');
      const percent=Math.min(100,Math.max(0,usage/quota*100));
      const label=percent>0&&percent<0.1?'< 0,1%':percent.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
      el('storage-percent').textContent=label;el('storage-used').textContent=bytes(usage);el('storage-quota').textContent=bytes(quota);el('storage-free').textContent=bytes(Math.max(0,quota-usage));
      el('storage-ring').style.setProperty('--used',percent+'%');el('storage-ring').setAttribute('aria-label',label+' utilizado: '+bytes(usage)+' de '+bytes(quota));
      el('storage-status').textContent=percent>=90?'Pouco espaço disponível. Exporte um backup e revise os anexos antigos.':'Dados armazenados neste navegador e dispositivo.';
    }catch(error){if(revision!==storageRevision)return;for(const id of ['storage-percent','storage-used','storage-quota','storage-free'])el(id).textContent='—';el('storage-ring').style.setProperty('--used','0%');el('storage-ring').setAttribute('aria-label','Capacidade indisponível');el('storage-status').textContent=error.message;}
  }
  el('refresh-storage').onclick=updateStorage;
  window.localProfile={applyDefaults,updateStorage};
  databaseReady.then(async()=>{
    profile=(await transaction('readonly',store=>store.get('local-profile'),'config'))?.value||null;
    if(profile){applyBrand();applyDefaults();setActiveSection('home','Início');}else open();
    await updateStorage();
  }).catch(error=>{open();status.textContent=error.message;document.getElementById('profile-save').disabled=true;});
})();
