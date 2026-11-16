import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {sheetifyForms,showFormSheetError} from './operational-sheets-rc15.js?v=1.0.0-rc.15';

// Configuração por restaurante; cobrança Pix em marketplace-infinitepay.
export async function initInfinitePaySettings({supabase,restaurant,role,esc}){
 const target=document.getElementById('iv-on-infinitepay');
 if(!target)return;
 const request=async(action,extra={})=>{
  const {data,error}=await supabase.functions.invoke('marketplace-payments-admin',{
   body:{restaurant_id:restaurant.id,action,...extra}
  });
  if(error||data?.error){
   let reason=data?.error??error?.message??'Não foi possível consultar o serviço';
   try{const response=await error?.context?.json?.();reason=response?.error??reason}catch{}
   throw Error(reason);
  }
  return data;
 };
 target.innerHTML='<div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('card',19)+'</span>'
  +'<div><h2>Pagamento online</h2><p>InfinitePay · Configuração por restaurante</p></div></div>'
  +'<div class="iv-on-infinite-skeleton"><span class="iv-on-skeleton iv-on-skel-title"></span>'
  +'<span class="iv-on-skeleton iv-on-skel-sub"></span></div>';
 const render=info=>{
  const keyReady=info.key_configured===true;
  const named=!!info.handle;
  const complete=named&&keyReady;
  const active=info.payments_available===true;
  const status=active?'Checkout habilitado':complete?'Credenciais preparadas':named?'InfiniteTag salva':'Não conectado';
  const label=active?'O pagamento online está habilitado para esta loja. Confira a primeira compra real antes de usar em produção.':complete?'As credenciais estão preparadas no servidor. O pagamento online ainda não foi ativado.':
   named?'Falta registrar a API Key nas configurações seguras do Supabase.':
   'Vincule a conta InfinitePay deste restaurante para preparar os pagamentos.';
  const stateHTML='<div class="iv-on-infinite-state"><div><strong>'+status+'</strong>'
   +'<p>'+label+'</p></div><span class="iv-on-status '+(complete?'ready':'')+'">'
   +(active?'Ativo':complete?'Preparado':'Desativado')+'</span></div>'
   +(named?'<div class="iv-on-detail"><span>InfiniteTag</span><strong>$'+esc(info.handle)+'</strong></div>':'')
   +'<div class="iv-on-detail"><span>Chave no servidor</span><strong>'+(keyReady?'Presente':'Não cadastrada')+'</strong></div>'
   +'<p class="iv-on-hint">'+(active?'Pix online disponível no checkout do restaurante. QR Code e Pix Copia e Cola aparecem na página segura da InfinitePay.':'O pagamento online permanece indisponível até a configuração completa.')+'</p>'
   +'<div class="iv-on-card-actions">'
   +(info.can_edit?'<button type="button" class="iv-on-button" id="iv-infinite-edit">'+icon('settings',16)+' '
    +(named?'Alterar InfiniteTag':'Configurar InfinitePay')+'</button>':'<span class="iv-on-hint">Somente o Master pode configurar.</span>')
   +(info.can_edit&&named?'<button type="button" class="iv-on-button secondary" id="iv-infinite-disconnect">'
    +icon('x',15)+' Desconectar</button>':'')+'</div>'
   +'<form id="iv-infinite-form" autocomplete="off">'
   +'<label class="iv-on-field">InfiniteTag do restaurante<input name="handle" required minlength="2" maxlength="64" '
   +'value="'+esc(info.handle||'')+'" placeholder="Ex.: novomundo (sem o $)"></label>'
   +'<p class="iv-on-hint">Encontre a InfiniteTag no aplicativo InfinitePay. Não informe sua senha ou chave API neste campo.</p>'
   +(info.secret_setup_hint?'<p class="iv-on-hint">Para completar a configuração, cadastre a API Key em <strong>Supabase → Edge Functions → Secrets</strong> com o nome <code>'
    +esc(info.secret_setup_hint)+'</code>. Nunca compartilhe a chave no chat ou no GitHub.</p>':'')
   +'<button class="iv-on-button" type="submit">'+icon('checkCircle',16)+' Salvar InfiniteTag</button></form>';
  target.innerHTML='<div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('card',19)+'</span>'
   +'<div><h2>Pagamento online · InfinitePay</h2>'
   +'<p>Conta do restaurante · Pagamentos separados da plataforma</p></div></div>'+stateHTML;
  const form=document.getElementById('iv-infinite-form');
  if(!form)return;
  form.onsubmit=async event=>{
   event.preventDefault();
   const button=form.querySelector('[type="submit"]');
   if(button.disabled)return;
   const handle=String(form.elements.namedItem('handle').value||'').trim().replace(/^\$/,'');
   if(!/^[A-Za-z0-9][A-Za-z0-9_.-]{1,63}$/.test(handle)){
    showFormSheetError(form,'Informe sua InfiniteTag sem $, de 2 a 64 caracteres.');return;
   }
   button.disabled=true;button.textContent='Salvando...';
   try{await request('save_handle',{handle});sheet?.close();await load()}
   catch(e){if(!showFormSheetError(form,e.message))alert(e.message);button.disabled=false;button.textContent='Salvar InfiniteTag'}
  };
  const [sheet]=sheetifyForms([{
   id:'iv-infinite-form',label:'Configurar InfinitePay',title:'Conectar InfinitePay',
   description:'Associe a InfiniteTag à conta financeira deste restaurante.'
  }]);
  if(sheet){
   sheet.trigger.hidden=true;sheet.trigger.style.display='none';
   document.getElementById('iv-infinite-edit')?.addEventListener('click',()=>sheet.trigger.click());
  }
  const disconnect=document.getElementById('iv-infinite-disconnect');
  if(disconnect)disconnect.onclick=async()=>{
   if(!confirm('Desconectar a InfiniteTag deste restaurante? Os pedidos atuais não serão alterados.'))return;
   disconnect.disabled=true;
   try{await request('disconnect');sheet?.close();await load()}
   catch(e){alert(e.message);disconnect.disabled=false}
  };
 };
 async function load(){
  try{
   const info=await request('get');
   if(document.getElementById('iv-on-infinitepay')===target)render(info);
  }catch(e){
   if(document.getElementById('iv-on-infinitepay')===target){
    target.innerHTML='<div class="iv-on-card-heading"><span class="iv-on-card-icon">'+icon('card',19)+'</span>'
     +'<div><h2>Pagamento online · InfinitePay</h2><p>Serviço indisponível</p></div></div>'
     +'<p class="iv-on-hint">'+esc(e.message)+'</p>'
     +'<button type="button" class="iv-on-button secondary" id="iv-infinite-retry">Tentar novamente</button>';
    document.getElementById('iv-infinite-retry')?.addEventListener('click',load);
   }
  }
 }
 await load();
}
