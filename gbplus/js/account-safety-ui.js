// GB+ 2.6.1 — accessible destructive-action dialogs; presentation only.
import {esc,button,icon} from './ui.js?v=20261105-72';
import {financialResetCounts,canResetFinancialData,canDeleteAccount} from './account-safety.js?v=20261106-2610';

export function resetAccountModal(db,online=false){
 const counts=financialResetCounts(db);
 const labels=[['Lançamentos',counts.titles],['Baixas',counts.payments],['Contas',counts.accounts],
  ['Cartões',counts.cards],['Compras no cartão',counts.cardPurchases],['Transferências',counts.transfers],
  ['Parceiros',counts.partners],['Importações',counts.imports],['Bancos personalizados',counts.institutions]];
 return '<form id="gb-reset-form" class="gb-danger-form" autocomplete="off">'+
  '<p class="gb-danger-intro">Limpar todos os registros financeiros e recomeçar do zero'+(online?' em todos os dispositivos sincronizados':' neste navegador')+'.</p>'+
  '<div class="gb-danger-counts" aria-label="Resumo dos registros que serão apagados">'+
   labels.map(([label,num])=>'<span>'+esc(label)+' <strong>'+num+'</strong></span>').join('')+'</div>'+
  '<p class="gb-danger-preserved"><strong>Seu login, e-mail e perfil pessoal serão mantidos.</strong> Esta ação não exclui sua conta de acesso.</p>'+
  '<p class="gb-danger-warning">Os dados financeiros apagados não podem ser recuperados sem um backup.</p>'+
  button(icon('download')+' Exportar backup JSON','backup')+
  '<label class="gb-danger-ack"><input type="checkbox" name="acknowledged"><span>Entendo que os registros e históricos financeiros serão apagados permanentemente.</span></label>'+
  '<label class="gb-danger-phrase">Para confirmar, digite <strong>LIMPAR</strong><input name="confirmation" type="text" maxlength="12" placeholder="Digite LIMPAR" autocapitalize="characters" spellcheck="false" required></label>'+
  '<div class="form-error" role="alert"></div><div class="gb-danger-actions">'+
   button('Cancelar','close')+
   '<button id="gb-reset-execute" type="button" class="button danger" data-action="settings-reset-execute" disabled>Limpar meus dados</button></div></form>';
}

export function deleteAccountModal(user){
 const email=user?.email||'';
 if(!email)throw Error('Entre em sua conta com um e-mail válido para solicitar a exclusão.');
 return '<form id="gb-delete-form" class="gb-danger-form" autocomplete="off">'+
  '<p class="gb-danger-intro"><strong>Esta ação exclui definitivamente a conta GB+.</strong> Seu login, cadastro pessoal, histórico e dados financeiros serão removidos. Não poderá recuperá-los depois.</p>'+
  '<p class="gb-danger-warning">Se deseja só recomeçar o financeiro, use Limpar todos os dados. Faça um backup antes de excluir a conta.</p>'+
  button(icon('download')+' Exportar backup JSON','backup')+
  '<label class="gb-danger-phrase">Digite seu e-mail cadastrado: <strong>'+esc(email)+'</strong><input name="email" type="email" maxlength="254" placeholder="E-mail da conta" autocomplete="off" autocapitalize="none" spellcheck="false" required></label>'+
  '<label class="gb-danger-phrase">Para confirmar, digite <strong>EXCLUIR</strong><input name="confirmation" type="text" maxlength="12" placeholder="Digite EXCLUIR" autocapitalize="characters" spellcheck="false" required></label>'+
  '<label class="gb-danger-ack"><input type="checkbox" name="acknowledged"><span>Entendo que a exclusão do login e dos dados é permanente.</span></label>'+
  '<div class="form-error" role="alert"></div><div class="gb-danger-actions">'+
   button('Cancelar','close')+
   '<button id="gb-delete-execute" type="button" class="button danger" data-action="settings-delete-execute" disabled>Excluir minha conta definitivamente</button></div></form>';
}

export function syncAccountDangerConfirm(form,user=null,busy=false){
 if(!form)return;
 if(form.id==='gb-reset-form'){
  const btn=form.querySelector('#gb-reset-execute');
  if(btn)btn.disabled=busy||!canResetFinancialData(form.elements.confirmation?.value,form.elements.acknowledged?.checked);
 }else if(form.id==='gb-delete-form'){
  const btn=form.querySelector('#gb-delete-execute');
  if(btn)btn.disabled=busy||!canDeleteAccount(form.elements.confirmation?.value,
    form.elements.email?.value,user?.email,form.elements.acknowledged?.checked);
 }
}
