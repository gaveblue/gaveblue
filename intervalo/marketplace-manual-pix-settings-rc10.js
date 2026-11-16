import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {sheetifyForms,showFormSheetError} from './operational-sheets-rc15.js?v=1.0.0-rc.15';
// Pix estático manual: habilita somente após cadastro da chave pelo Master.
export async function initManualPixSettings({supabase,restaurant,role,esc}){
 const root=document.getElementById('iv-on-manual-pix');if(!root)return;
 const call=async(action,extra={})=>{
  const {data,error}=await supabase.functions.invoke('marketplace-manual-pix-admin',{body:{action,restaurant_id:restaurant.id,...extra}});
  if(error||data?.error){let s=data?.error||error?.message||'Erro ao configurar Pix';try{s=(await error?.context?.json?.())?.error||s}catch{}throw Error(s)}
  return data;
 };
 const load=async()=>{
  root.innerHTML='<p class="iv-on-hint">Consultando Pix manual...</p>';
  try{
   const setting=await call('get');
   if(!root.isConnected)return;
   const enabled=setting.enabled===true;
   root.innerHTML='<div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('money',19)+'</span>'
    +'<div><h2>Pix direto do restaurante</h2><p>QR Code e Copia e Cola · confirmação manual</p></div></div>'
    +'<div class="iv-on-sales-state"><div><small>Status</small><strong>'+(enabled?'Ativado':'Não configurado')+'</strong>'
    +'<p>'+(enabled?'O cliente tem 10 minutos para pagar ou sinalizar o pagamento. Confira o extrato antes de aceitar.':'Cadastre a chave Pix, o nome e a cidade do recebedor para oferecer o QR Code próprio.')+'</p></div></div>'
    +(setting.configured?'<div class="iv-on-detail"><span>Chave Pix</span><strong>'+esc(setting.key_mask)+'</strong></div>':'')
    +'<p class="iv-on-hint">O QR Code estático não expira no aplicativo bancário. O prazo de 10 minutos é do pedido no Intervalo.</p>'
    +(setting.can_edit?'<button type="button" class="iv-on-button" id="iv-manual-pix-config">'+icon('settings',16)+' Configurar Pix manual</button>'
     +(enabled?'<button type="button" class="iv-on-button secondary" id="iv-manual-pix-off">Desativar Pix manual</button>':''):'')
    +'<form id="iv-manual-pix-form" autocomplete="off">'
    +'<label class="iv-on-field">Chave Pix recebedora<input name="pix_key" type="text" spellcheck="false" autocomplete="off" maxlength="77" required placeholder="CPF, CNPJ, telefone, e-mail ou chave aleatória"></label>'
    +'<label class="iv-on-field">Nome do titular da chave Pix<input name="recipient_name" maxlength="120" required value="'+esc(setting.recipient_name||'')+'"></label>'
    +'<label class="iv-on-field">Cidade do titular<input name="recipient_city" maxlength="100" required value="'+esc(setting.recipient_city||'')+'"></label>'
    +'<p class="iv-on-hint">Informe uma chave Pix realmente cadastrada em sua conta bancária. Se alterar a chave, confirme os dados do recebedor no seu banco.</p>'
    +'<button class="iv-on-button" type="submit">Salvar e ativar Pix manual</button></form>';
   const form=root.querySelector('#iv-manual-pix-form');
   form.onsubmit=async e=>{
    e.preventDefault();const button=form.querySelector('[type="submit"]');
    button.disabled=true;button.textContent='Salvando...';
    try{
     const data=Object.fromEntries(new FormData(form).entries());
     await call('save',data);sheet?.close();await load();
    }catch(e){if(!showFormSheetError(form,e.message))alert(e.message);button.disabled=false;button.textContent='Salvar e ativar Pix manual'}
   };
   const [sheet]=sheetifyForms([{id:'iv-manual-pix-form',label:'Configurar Pix manual',title:'Pix direto',description:'Receber na conta do restaurante, sem intermediador.'}]);
   if(sheet){sheet.trigger.hidden=true;sheet.trigger.style.display='none';
    root.querySelector('#iv-manual-pix-config')?.addEventListener('click',()=>sheet.trigger.click())}
   root.querySelector('#iv-manual-pix-off')?.addEventListener('click',async e=>{
    if(!confirm('Desativar Pix direto para novos pedidos?'))return;
    e.currentTarget.disabled=true;
    try{await call('disable');await load()}catch(err){alert(err.message);e.currentTarget.disabled=false}
   });
  }catch(e){root.innerHTML='<p class="iv-on-hint">'+esc(e.message)+'</p><button class="iv-on-button secondary" id="iv-manual-pix-retry">Tentar novamente</button>';root.querySelector('#iv-manual-pix-retry')?.addEventListener('click',load)}
 };
 await load();
}