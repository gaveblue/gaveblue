// File bytes live in a user-selected folder. IndexedDB retains metadata and handles.
(() => {
  'use strict';
  const configId='receipt-file-storage',supported=typeof window.showDirectoryPicker==='function';
  const el=id=>document.getElementById(id);
  const panel=document.createElement('section');panel.className='panel file-storage-panel';panel.id='file-storage-settings';
  panel.innerHTML=`<h2>Destino dos arquivos</h2><p>Escolha uma pasta do seu computador. Os PDFs e comprovantes serão organizados automaticamente dentro dela.</p><p id="file-storage-mode" role="status">Carregando configuração…</p><button type="button" id="file-choose">Escolher pasta no computador</button><p id="file-operation" role="status" aria-live="polite"></p><details id="file-advanced"><summary>Arquivos antigos e outras opções</summary><h3>Recibos já existentes</h3><p>Copie os antigos para a pasta com um backup verificado. Os originais continuam no navegador até você decidir liberar espaço.</p><div class="quick-actions"><button type="button" class="secondary" id="file-migrate">Copiar antigos para a pasta</button><button type="button" class="secondary" id="file-release">Liberar cópias do navegador</button></div><hr><div class="quick-actions"><button type="button" class="secondary" id="file-authorize">Autorizar pastas novamente</button><button type="button" class="secondary" id="file-browser">Salvar novos arquivos no navegador</button></div><p class="profile-note">Mantenha os arquivos na pasta escolhida. Excluir um recibo do histórico não apaga seus arquivos do PC. Use Backup para levar o histórico completo a outro navegador.</p></details>`;
  el('layout-settings').querySelector('.section-heading').after(panel);
  const storageCaption=document.querySelector('#local-storage-card .storage-heading p');if(storageCaption)storageCaption.textContent='Uso do armazenamento do navegador. Arquivos salvos na pasta do PC ficam fora deste limite.';
  const backupLink=document.createElement('button');backupLink.type='button';backupLink.className='secondary';backupLink.textContent='Configurar pasta e migrar arquivos';backupLink.onclick=()=>window.receiptSettings.open('files');el('backup-screen').querySelector('.backup-actions').append(backupLink);
  const style=document.createElement('style');style.textContent='.file-storage-panel{margin-bottom:24px}.file-storage-panel p,.file-storage-panel small{line-height:1.6;color:#62748b}.file-storage-panel hr{border:0;border-top:1px solid #e5eaf2;margin:20px 0}.file-storage-panel .quick-actions{flex-wrap:wrap}.file-storage-panel .error{color:#b42332}.file-release-dialog{width:min(520px,calc(100vw - 32px));border:1px solid #e2e8f0;border-radius:20px;padding:28px;box-sizing:border-box}.file-release-dialog::backdrop{background:#17203380;backdrop-filter:blur(5px)}.file-release-dialog p{line-height:1.6;color:#62748b}';document.head.append(style);
  let running=false;
  const destinationDialog=document.createElement('dialog');destinationDialog.className='file-release-dialog';destinationDialog.id='file-destination-dialog';destinationDialog.setAttribute('aria-labelledby','file-destination-title');
  destinationDialog.innerHTML='<span class="section-kicker">Seus arquivos no computador</span><h2 id="file-destination-title">Onde deseja salvar os recibos?</h2><p id="file-destination-intro">Escolha uma pasta do seu PC para guardar os PDFs e comprovantes. Basta escolher o destino: o sistema cria e organiza as subpastas para você.</p><p id="file-destination-status" role="status" aria-live="polite"></p><div class="quick-actions"><button type="button" id="file-destination-choose">Escolher pasta no computador</button><button type="button" class="secondary" id="file-destination-later">Escolher depois</button><button type="button" id="file-destination-done" hidden>Começar a usar</button></div><p class="profile-note">Seus recibos já existentes serão mantidos. Você pode trocar a pasta depois em Configurações.</p>';
  document.body.append(destinationDialog);
  style.textContent+='.file-release-dialog .quick-actions{flex-wrap:wrap}.file-release-dialog{max-height:calc(100dvh - 32px);overflow:auto}.file-storage-panel summary{cursor:pointer;padding:12px 0;color:#62748b}';
  const config=async()=>{await databaseReady;return (await transaction('readonly',s=>s.get(configId),'config'))?.value||{active:null,folders:[]};};
  async function saveConfig(value){await transaction('readwrite',s=>s.put({id:configId,value}),'config');}
  const note=(message,error=false)=>{el('file-operation').textContent=message;el('file-operation').classList.toggle('error',error);if(destinationDialog.open){el('file-destination-status').textContent=message;el('file-destination-status').style.color=error?'#b42332':'';}};
  async function display(){
    const settings=await config(),active=settings.folders.find(f=>f.id===settings.active);
    el('file-storage-mode').textContent=active?'Novos arquivos: pasta '+active.name+' / PDFs e anexos.':'Novos arquivos: navegador (IndexedDB). Os registros existentes foram preservados.';
    el('file-choose').textContent=active?'Trocar pasta de destino':'Escolher pasta no computador';
    el('file-destination-choose').disabled=running;el('file-destination-later').disabled=running;el('file-destination-done').disabled=running;
    el('file-choose').disabled=running||!supported;el('file-authorize').disabled=running||!supported||!settings.folders.length;
    el('file-browser').disabled=running||!active;el('file-migrate').disabled=running||!active;el('file-release').disabled=running;
    if(!supported)note('Escolher pasta está disponível no Chrome e Edge para computador. Neste navegador, os dados existentes continuam acessíveis no IndexedDB.',true);
  }
  async function permission(folder,write=false,prompt=false){
    if(!folder?.handle)throw new Error('Pasta não configurada. Abra Configurações → Pasta dos recibos no PC.');
    const options={mode:write?'readwrite':'read'};
    let state=await folder.handle.queryPermission(options);
    if(state!=='granted'&&prompt)state=await folder.handle.requestPermission(options);
    if(state!=='granted')throw new Error('Autorize a pasta '+folder.name+' em Configurações → Autorizar pastas novamente. Nenhum arquivo foi removido.');
    return folder;
  }
  async function folderFor(id,write=false,prompt=false){const settings=await config();return permission(settings.folders.find(f=>f.id===id),write,prompt);}
  async function ensureActiveAccess(){const settings=await config();if(settings.active)await permission(settings.folders.find(f=>f.id===settings.active),true,true);}
  const clean=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50)||'sem-numero';
  const digest=async blob=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
  async function fileAt(folder,parts,create=false){
    if(!Array.isArray(parts)||!parts.length||parts.some(p=>typeof p!=='string'||!p||p==='.'||p==='..'||/[\\/]/.test(p)))throw new Error('Referência de arquivo inválida.');
    let dir=folder.handle;for(const part of parts.slice(0,-1))dir=await dir.getDirectoryHandle(part,{create});
    return dir.getFileHandle(parts.at(-1),{create});
  }
  async function readFile(ref){
    const folder=await folderFor(ref.folderId);
    try{
      const file=await (await fileAt(folder,ref.path)).getFile();
      if(file.size!==ref.size||await digest(file)!==ref.sha256)throw new Error('integrity');
      return file;
    }catch(error){throw new Error('Não foi possível ler ou verificar '+folder.name+'/'+ref.path.join('/')+'. Confira se o arquivo foi movido, alterado ou se a pasta está desconectada. As cópias do navegador foram preservadas quando disponíveis.');}
  }
  async function writeFile(folder,parts,blob){
    // Each path contains a fresh revision UUID: never overwrite an older receipt.
    let stream;
    try{const handle=await fileAt(folder,parts,true);stream=await handle.createWritable();await stream.write(blob);await stream.close();}
    catch(error){if(stream)await stream.abort().catch(()=>{});throw new Error('Não foi possível gravar na pasta '+folder.name+'. Verifique a permissão e o espaço no disco. O histórico anterior foi mantido.');}
    const ref={folderId:folder.id,path:parts,size:blob.size,sha256:await digest(blob),type:blob.type};
    await readFile(ref);return ref;
  }
  async function hydrate(record,{pdfOnly=false}={}){
    const loaded={...record};
    if(!(loaded.pdf instanceof Blob)&&loaded.files?.pdf)loaded.pdf=await readFile(loaded.files.pdf);
    if(!pdfOnly){
      if(!loaded.attachment&&loaded.files?.attachment){const ref=loaded.files.attachment,file=await readFile(ref);loaded.attachment={name:ref.name,type:ref.type,bytes:await file.arrayBuffer()};}
      if(!loaded.attachmentPDF&&loaded.files?.attachmentPDF)loaded.attachmentPDF=await readFile(loaded.files.attachmentPDF);
    }
    if(!(loaded.pdf instanceof Blob))throw new Error('PDF indisponível. Autorize a pasta ou restaure um backup pelo menu Backup.');
    return loaded;
  }
  function stripped(record){
    const result={...record,pdf:null,attachmentPDF:null};if(Object.hasOwn(record,'attachment'))result.attachment=null;return result;
  }
  async function copyRecord(record,folder){
    const revision=crypto.randomUUID(),number=clean(record.data.numero||record.id),stem='recibo-'+number+'-'+revision;
    const files={pdf:await writeFile(folder,['PDFs',stem+'.pdf'],record.pdf)};
    const method=record.data.formaPagamento||'cheque',group=method==='cheque'?'cheques':clean(method);
    const attachmentStem=(method==='cheque'?'arquivo-ch'+clean(record.data.cheque):'comprovante-'+group)+'-rec'+number+'-'+revision;
    if(record.attachment){const a=record.attachment;files.attachment={...await writeFile(folder,['anexos',group,attachmentStem+(a.type==='image/png'?'.png':'.jpg')],new Blob([a.bytes],{type:a.type})),name:a.name};}
    if(record.attachmentPDF)files.attachmentPDF=await writeFile(folder,['anexos',group,attachmentStem+'.pdf'],record.attachmentPDF);
    return {...record,files,filesCopiedAt:new Date().toISOString()};
  }
  async function prepare(record){
    const settings=await config();const {files,fileBackup,filesCopiedAt,...fresh}=record;
    if(!settings.active)return fresh;
    const folder=await permission(settings.folders.find(f=>f.id===settings.active),true);
    return stripped(await copyRecord(fresh,folder));
  }
  async function portable(record){
    const r=await hydrate(record),{files,fileBackup,filesCopiedAt,...result}=r;
    result.pdf=await blobBase64(r.pdf);
    if(Object.hasOwn(r,'attachment'))result.attachment=r.attachment?{...r.attachment,bytes:await blobBase64(new Blob([r.attachment.bytes]))}:null;
    result.attachmentPDF=r.attachmentPDF?await blobBase64(r.attachmentPDF):null;return result;
  }
  async function replaceIfUnchanged(before,after){
    await new Promise((resolve,reject)=>{
      const tx=db.transaction('recibos','readwrite'),store=tx.objectStore('recibos'),req=store.get(before.id);let conflict=false;
      req.onsuccess=()=>{const latest=req.result;if(!latest||(latest.updatedAt||latest.createdAt)!==(before.updatedAt||before.createdAt)||JSON.stringify(latest.files)!==JSON.stringify(before.files)){conflict=true;tx.abort();}else store.put(after);};
      tx.oncomplete=resolve;tx.onabort=tx.onerror=()=>reject(new Error(conflict?'Um recibo mudou durante a operação. Os originais foram mantidos; tente novamente.':'Falha ao atualizar o histórico. Os arquivos do PC foram mantidos.'));
    });
  }
  const hasPayload=r=>r.pdf instanceof Blob||Boolean(r.attachment?.bytes)||r.attachmentPDF instanceof Blob;
  async function migrate(){
    await ensureActiveAccess();
    return navigator.locks.request('covre-receipt-number',async()=>{
      const settings=await config(),folder=await permission(settings.folders.find(f=>f.id===settings.active),true);
      const all=await transaction('readonly',s=>s.getAll());const pending=all.filter(r=>hasPayload(r)&&!r.files?.pdf);
      if(!pending.length){note('Não há arquivos antigos pendentes de cópia.');return;}
      note('Criando e verificando backup completo antes da migração…');
      // Split large histories into independently importable backups below the 100 MB import limit.
      const empresas=await transaction('readonly',s=>s.getAll(),'empresas'),sequence=String(await sequenceHighWater()),backupById=new Map();let items=[],batchBytes=0;
      const flush=async()=>{if(!items.length)return;const backupBlob=new Blob([JSON.stringify({format:'gaveblue-frete',version:2,records:items,empresas,sequence})],{type:'application/json'});if(backupBlob.size>100*1024*1024)throw new Error('Um recibo excede o tamanho permitido para backup. Os originais foram mantidos.');const ref=await writeFile(folder,['Backups','antes-da-migracao-'+today()+'-'+crypto.randomUUID()+'.json'],backupBlob);for(const item of items)backupById.set(item.id,ref);items=[];batchBytes=0;};
      for(const record of all){const item=await portable(record),size=new Blob([JSON.stringify(item)]).size;if(batchBytes+size>80*1024*1024||items.length>=1000)await flush();items.push(item);batchBytes+=size;}await flush();
      let count=0;for(const record of pending){const copied=await copyRecord(await hydrate(record),folder);copied.fileBackup=backupById.get(record.id);await replaceIfUnchanged(record,copied);note('Copiados e verificados: '+(++count)+' de '+pending.length+'. Originais mantidos no navegador.');}
      note(count+' recibos copiados e verificados. Backup completo na subpasta Backups (importe todas as partes para restaurar). Os originais continuam no navegador.');
    });
  }
  async function release(){
    return navigator.locks.request('covre-receipt-number',async()=>{
      const pending=(await transaction('readonly',s=>s.getAll())).filter(r=>r.files?.pdf&&hasPayload(r));
      if(!pending.length){note('Não há cópias verificadas para liberar. Copie os antigos para a pasta primeiro.');return;}
      let count=0;const checkedBackups=new Set();
      for(const record of pending){
        if(!record.fileBackup)throw new Error('O backup da migração não foi encontrado. As cópias do navegador foram mantidas.');
        const backupKey=JSON.stringify(record.fileBackup);if(!checkedBackups.has(backupKey)){await readFile(record.fileBackup);checkedBackups.add(backupKey);}
        for(const [key,payload] of [['pdf',record.pdf],['attachment',record.attachment?new Blob([record.attachment.bytes],{type:record.attachment.type}):null],['attachmentPDF',record.attachmentPDF]]){
          if(!payload)continue;const ref=record.files[key];if(!ref)throw new Error('Cópia incompleta. Os arquivos do navegador foram mantidos.');
          await readFile(ref);if(await digest(payload)!==ref.sha256)throw new Error('O arquivo do navegador difere da cópia. Nenhum arquivo deste recibo foi removido.');
        }
        await replaceIfUnchanged(record,stripped(record));note('Espaço liberado em '+(++count)+' de '+pending.length+' recibos. Histórico preservado.');
      }
      note('Cópias pesadas de '+count+' recibos removidas do navegador. PDFs e anexos continuam na pasta e o histórico foi preservado.');
    });
  }
  async function action(fn){if(running)return;running=true;await display();try{await fn();await refresh();}catch(error){note(error.name==='AbortError'?'Operação cancelada. Os dados existentes foram mantidos.':error.message,true);}finally{running=false;await display();}}
  const chooseFolder=async()=>{
    if(running)return;
    // Open the browser picker immediately in the user's click gesture.
    let handle;try{handle=await window.showDirectoryPicker({id:'recibos-folder',mode:'readwrite'});}catch(error){note(error.name==='AbortError'?'Nenhuma pasta foi escolhida. Você pode tentar novamente ou escolher depois.':error.message,error.name!=='AbortError');return;}
    await action(async()=>{const settings=await config();let folder;for(const entry of settings.folders){try{if(await entry.handle.isSameEntry(handle)){folder=entry;break;}}catch{}}
      if(!folder){folder={id:crypto.randomUUID(),name:handle.name,handle};settings.folders.push(folder);}else folder.handle=handle;
      await permission(folder,true,true);settings.active=folder.id;settings.setupDismissed=true;await saveConfig(settings);note('Pasta ativada: '+folder.name+'. Novos PDFs e comprovantes serão organizados nela automaticamente.');
      if(destinationDialog.open){el('file-destination-title').textContent='Destino dos arquivos definido';el('file-destination-intro').textContent='Tudo pronto. Não é preciso criar subpastas nem escolher o destino a cada recibo.';el('file-destination-choose').textContent='Trocar pasta';el('file-destination-choose').classList.add('secondary');el('file-destination-later').hidden=true;el('file-destination-done').hidden=false;}
    });
  };
  el('file-choose').onclick=chooseFolder;el('file-destination-choose').onclick=chooseFolder;
  el('file-destination-done').onclick=()=>{if(!running)destinationDialog.close();};
  const chooseLater=()=>action(async()=>{const settings=await config();settings.setupDismissed=true;await saveConfig(settings);destinationDialog.close();note('Você pode escolher a pasta depois em Configurações. Até lá, os arquivos continuam no navegador.');});
  el('file-destination-later').onclick=chooseLater;
  destinationDialog.addEventListener('cancel',event=>{event.preventDefault();if(!running){if(!el('file-destination-done').hidden)destinationDialog.close();else chooseLater();}});
  async function offerDestination(){const settings=await config();if(!supported||settings.active||settings.setupDismissed||settings.folders.length||document.querySelector('dialog[open]'))return;const savedProfile=await transaction('readonly',s=>s.get('local-profile'),'config');if(savedProfile&&!destinationDialog.open&&!document.querySelector('dialog[open]'))destinationDialog.showModal();}
  el('profile-dialog')?.addEventListener('close',()=>offerDestination().catch(error=>note(error.message,true)));
  el('file-authorize').onclick=()=>action(async()=>{const settings=await config();for(const folder of settings.folders)await permission(folder,true,true);note('Acesso às pastas autorizado.');});
  el('file-browser').onclick=()=>action(async()=>{const settings=await config();settings.active=null;await saveConfig(settings);note('Novas gravações usarão o navegador. Os recibos que já estão em pastas continuam vinculados a elas.');});
  el('file-migrate').onclick=()=>action(migrate);
  const confirmDialog=document.createElement('dialog');confirmDialog.className='file-release-dialog';confirmDialog.innerHTML='<h2>Liberar espaço no navegador?</h2><p>Vamos verificar novamente o backup, os PDFs e os anexos na pasta antes de remover suas cópias do IndexedDB. Os dados do histórico e a numeração serão mantidos. Depois disso, a pasta precisará estar disponível para abrir os arquivos.</p><div class="quick-actions"><button type="button" class="secondary" id="file-release-cancel">Cancelar</button><button type="button" id="file-release-confirm">Verificar e liberar espaço</button></div>';document.body.append(confirmDialog);
  el('file-release').onclick=()=>confirmDialog.showModal();el('file-release-cancel').onclick=()=>confirmDialog.close();el('file-release-confirm').onclick=()=>{confirmDialog.close();action(release);};
  window.receiptFiles={prepare,hydrate,ensureActiveAccess,portable};
  databaseReady.then(async()=>{await display();await offerDestination();}).catch(error=>note(error.message,true));
})();
