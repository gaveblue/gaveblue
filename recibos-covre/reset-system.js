(() => {
  'use strict';
  const el=id=>document.getElementById(id);
  const panel=document.createElement('section');panel.className='panel settings-block reset-system-panel';
  panel.innerHTML='<h3>Restaurar sistema</h3><p>Apague os dados deste gerador neste navegador e volte ao primeiro acesso.</p><button type="button" id="reset-system" class="danger">Restaurar sistema</button>';
  el('settings-backup').querySelector('.settings-content').append(panel);
  const dialog=document.createElement('dialog');dialog.id='reset-system-dialog';dialog.className='form-dialog reset-system-dialog';dialog.setAttribute('aria-labelledby','reset-system-title');
  dialog.innerHTML='<form id="reset-system-form"><h2 id="reset-system-title">Apagar todos os dados locais?</h2><p>Serão apagados recibos, PDFs e anexos guardados no navegador, parceiros, contas, movimentações, saldos, perfil, layouts e configurações de pasta. A numeração dos recibos voltará a 0001.</p><p><strong>Esta ação não pode ser desfeita.</strong> Os arquivos já salvos em pastas do computador e os dados de outros sistemas serão mantidos.</p><p>Você precisará cadastrar o perfil novamente. O backup do histórico permite recuperar recibos, parceiros e movimentações; perfil e preferências precisam ser configurados novamente.</p><button type="button" id="reset-system-backup" class="secondary">Exportar histórico antes</button><label>Digite APAGAR para confirmar<input id="reset-system-confirm" autocomplete="off" spellcheck="false" required></label><p id="reset-system-status" role="status" aria-live="polite"></p><div class="backup-actions"><button type="button" id="reset-system-cancel" class="secondary">Cancelar</button><button type="submit" id="reset-system-submit" class="danger" disabled>Apagar tudo e reiniciar</button></div></form>';
  document.body.append(dialog);
  let resetting=false;
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('gaveblue-recibos-reset'):null;
  if(channel)channel.onmessage=event=>{if(event.data==='complete'&&!resetting)location.reload();};
  el('reset-system').onclick=()=>{el('reset-system-form').reset();el('reset-system-submit').disabled=true;el('reset-system-status').textContent='';dialog.showModal();el('reset-system-cancel').focus();};
  el('reset-system-confirm').oninput=()=>{el('reset-system-submit').disabled=el('reset-system-confirm').value!=='APAGAR';};
  el('reset-system-cancel').onclick=()=>{if(!resetting)dialog.close();};
  dialog.addEventListener('cancel',event=>{if(resetting)event.preventDefault();});
  el('reset-system-backup').onclick=async()=>{dialog.close();await el('backup').onclick();};
  el('reset-system-form').onsubmit=async event=>{
    event.preventDefault();if(resetting||el('reset-system-confirm').value!=='APAGAR')return;
    resetting=true;dialog.querySelectorAll('button,input').forEach(control=>control.disabled=true);el('reset-system-status').textContent='Restaurando o sistema…';
    try{
      await databaseReady;
      await navigator.locks.request('covre-receipt-number',()=>new Promise((resolve,reject)=>{
        // Only this generator's database is reset. No shared origin storage or PC files are touched.
        db.close();const request=indexedDB.deleteDatabase('gaveblue-recibos-frete');
        request.onblocked=()=>{el('reset-system-status').textContent='Aguardando outras abas liberarem o histórico. Feche as outras abas deste gerador para concluir.';};
        request.onerror=()=>reject(new Error('Não foi possível apagar o histórico. Recarregue a página e tente novamente.'));
        request.onsuccess=resolve;
      }));
      channel?.postMessage('complete');location.reload();
    }catch(error){el('reset-system-status').textContent=error.message;el('reset-system-cancel').disabled=false;el('reset-system-cancel').textContent='Recarregar';el('reset-system-cancel').onclick=()=>location.reload();}
  };
  databaseReady.then(()=>{
    db.onversionchange=()=>{
      db.close();if(resetting)return;
      const notice=document.createElement('dialog');notice.className='form-dialog reset-system-dialog';notice.setAttribute('aria-label','Histórico fechado em outra aba');notice.innerHTML='<h2>Histórico fechado em outra aba</h2><p>Aguarde a restauração do sistema terminar. Esta página será recarregada para usar os dados atualizados.</p><button type="button">Recarregar</button>';notice.querySelector('button').onclick=()=>location.reload();notice.addEventListener('cancel',event=>event.preventDefault());document.body.append(notice);notice.showModal();
    };
  }).catch(()=>{});
})();
