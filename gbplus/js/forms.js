import {today,money,dateLabel,pending,paid,accountBalance} from './domain.js?v=20261105-72';
import {esc,field,select,textarea,formFooter,button,icon,titleTable,empty} from './ui.js?v=20261110-309';
import {INDICATORS} from './store.js?v=20261105-78';
import {entrySelect} from './entry-select.js?v=20261108-2861';
import {gbIcon,CATEGORY_ICON_OPTIONS,categoryIconFor} from './gb-icons.js?v=20261109-2900';
import {bankOptions,findBank,bankPicker,bankBadge} from './banks.js?v=20261105-87';
import {dailyStatement} from './daily-statement.js?v=20261105-90';
import {ACCOUNT_ICON_OPTIONS,GOAL_PRESETS,accountKind,accountIcon,goalPreset} from './account-goals.js?v=20261109-2900';
import {financePickerField} from './finance-picker-300.js?v=20261109-3000';
import {servicePickerMarkup,serviceIdentityMarkup,serviceDisplayName} from './service-ui.js?v=20261108-2880';
import {isServiceExpenseCategory} from './service-catalog.js?v=20261108-2880';
import {missingCategorySuggestions,isSelectableExpenseCategory,isPrimaryServiceCategory} from './category-library.js?v=20261108-2862';
const required='required maxlength="200"';
export function titleForm(db,t,type='expense'){
 type=t?.type||type;
 // Faturas são geradas pelo próprio módulo de cartões, nunca pelo lançamento avulso.
 const categoryOptions=db.categories.filter(c=>c.type===type&&isSelectableExpenseCategory(c,t?.categoryId||'')&&(c.name!=='Fatura de cartão'||c.id===t?.categoryId)).map(c=>[c.id,c.name,categoryIconFor(c),isPrimaryServiceCategory(c)]);
 const selectedCategory=db.categories.find(c=>c.id===(t?.categoryId||categoryOptions[0]?.[0]));
 const showService=type==='expense'&&isServiceExpenseCategory(selectedCategory);
 const typeField='<div class="gb-entry-flow-switch" role="group" aria-label="Tipo de lançamento">'+
  '<select id="entry-type" name="type" class="gb-entry-type-source" data-gb-native="true" aria-hidden="true" tabindex="-1">'+
   '<option value="expense"'+(type==='expense'?' selected':'')+'>Despesa</option>'+
   '<option value="income"'+(type==='income'?' selected':'')+'>Receita</option></select>'+
  '<button type="button" data-action="entry-type-pick" data-value="expense" class="gb-entry-flow-option'+(type==='expense'?' is-active':'')+'" aria-pressed="'+(type==='expense')+'">'+
   '<span class="gb-entry-flow-icon is-expense">'+icon('down')+'</span>Despesa</button>'+
  '<button type="button" data-action="entry-type-pick" data-value="income" class="gb-entry-flow-option'+(type==='income'?' is-active':'')+'" aria-pressed="'+(type==='income')+'">'+
   '<span class="gb-entry-flow-icon is-income">'+icon('up')+'</span>Receita</button></div>';
 const missingCategories=missingCategorySuggestions(db.categories);
 const categoryField=entrySelect('Categoria','categoryId',categoryOptions,t?.categoryId,'entry-category',true);
 // PF does not expose partner editing. Preserve any pre-existing partner on edit
 // so that older records remain intact until a dedicated PJ profile is shipped.
 // Keep legacy partner data in FormData without showing a PF field.
 // The partner editor can be restored in the future PJ module without
 // changing the persisted title schema.
 const partnerField='<input type="hidden" name="partnerId" value="'+esc(t?.partnerId||'')+'">';
 const periodicity=t?
   entrySelect('Situação','cancelled',[['false','Ativo'],['true','Cancelado']],String(t.cancelled),'entry-cancelled'):
   entrySelect('Periodicidade','mode',[['single','Único'],['installment','Parcelado'],['recurring','Recorrente']],'single','entry-mode',true);
 const extra=t&&t.mode==='recurring'?
   entrySelect('Aplicar alterações','scope',[['one','Somente este lançamento'],['future','Este e os futuros da recorrência']],'one','entry-scope'):
   '';
 const isSeries=!t||t.mode==='recurring';
 const activeAccounts=(db.accounts||[]).filter(a=>a.active);
 const activeCards=(db.cards||[]).filter(c=>c.active);
 const settlementHtml=!t?
  '<fieldset class="gb-entry-settlement"><legend>Como deseja registrar?</legend>'+
   '<label class="gb-entry-settlement-option"><input type="radio" name="settlement" value="pending" checked><span><strong>Deixar pendente</strong><small>Registrar sem baixar agora.</small></span></label>'+
   '<label class="gb-entry-settlement-option"><input type="radio" name="settlement" value="paid"><span><strong>Baixar em uma conta</strong><small>Registrar pagamento ou recebimento na conta escolhida.</small></span></label>'+
   '<label class="gb-entry-settlement-option gb-entry-card-option"><input type="radio" name="settlement" value="card"><span><strong>Lançar no cartão de crédito</strong><small>A compra entra na fatura, sem baixar a conta agora.</small></span></label>'+
   '<p class="gb-entry-settlement-series" hidden>Parcelas e recorrências bancárias ficam pendentes; compras no cartão geram faturas próprias.</p>'+
   '<div class="gb-entry-settlement-details" hidden>'+
    '<div class="gb-entry-finance-select" data-finance-kind="account">'+
     '<span class="gb-entry-finance-label" id="gb-entry-account-label">Conta da baixa</span>'+
     '<select name="settleAccountId" class="gb-entry-finance-native" data-gb-native="true" aria-hidden="true" tabindex="-1"><option value="">Selecione uma conta</option>'+
      activeAccounts.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join('')+'</select>'+
     '<button type="button" class="gb-entry-finance-trigger" data-action="title-finance-picker" data-kind="account" aria-haspopup="dialog" aria-controls="gb-picker-sheet" aria-expanded="false" aria-label="Selecionar conta da baixa">'+
      '<span class="gb-entry-finance-current">Selecione uma conta</span>'+icon('chevron')+'</button></div>'+
    field('Data da baixa','settleDate',today(),'date','max="'+today()+'"')+
    '<p class="gb-entry-settlement-message">A baixa será gravada junto do título, após confirmar.</p>'+
   '</div>'+
   '<div class="gb-entry-settlement-card" hidden>'+
    '<div class="gb-entry-finance-select" data-finance-kind="card">'+
     '<span class="gb-entry-finance-label" id="gb-entry-card-label">Cartão de crédito</span>'+
     '<select name="settleCardId" class="gb-entry-finance-native" data-gb-native="true" aria-hidden="true" tabindex="-1"><option value="">Selecione um cartão</option>'+
      activeCards.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'</select>'+
     '<button type="button" class="gb-entry-finance-trigger" data-action="title-finance-picker" data-kind="card" aria-haspopup="dialog" aria-controls="gb-picker-sheet" aria-expanded="false" aria-label="Selecionar cartão de crédito">'+
      '<span class="gb-entry-finance-current">Selecione um cartão</span>'+icon('chevron')+'</button></div>'+
    '<p class="gb-entry-settlement-message">Compra única ou até 36 parcelas. Vencimentos serão calculados pelas regras de fechamento e vencimento do cartão; o saldo da conta só muda ao pagar a fatura.</p>'+
   '</div>'+
  '</fieldset>':
  '<p class="gb-entry-edit-note">Para registrar ou estornar baixas de um título existente, use Detalhes do lançamento.</p>';
 return `<form id="title-form" class="gb-entry-form gb-entry-wizard" data-id="${esc(t?.id||'')}" data-mode="${esc(t?.mode||'single')}" data-count="${Number(t?Math.max(1,t.count-t.sequence+1):1)}" data-step="1" data-entry-type="${esc(type)}" data-has-service="${Boolean(t?.serviceId&&showService)}">
  <div class="gb-entry-progress" aria-label="Etapa 1 de 3"><span class="active">1 · Lançamento</span><span>2 · Detalhes</span><span>3 · Confirmação</span></div>
  <section id="gb-entry-step-one" class="gb-entry-stage" data-entry-stage="1" aria-label="Dados do lançamento">
   ${typeField}
   <div class="gb-entry-amount-hero">
    <label for="entry-amount">Valor do lançamento</label>
    <div class="gb-entry-amount-control"><span aria-hidden="true">R$</span>
     <input id="entry-amount" name="amount" type="number" value="${t?t.amount/100:''}" data-mask="money" inputmode="numeric"
      required min="0.01" max="10000000000" step="0.01" placeholder="0,00" aria-label="Valor do lançamento em reais">
    </div>
   </div>
   <div class="form-grid gb-entry-grid">
    <div class="full gb-entry-category-block">
     ${categoryField}
     ${!t&&missingCategories.length?`<button type="button" class="gb-category-expand-btn" data-action="add-suggested-categories">Adicionar ${missingCategories.length} categorias sugeridas</button>`:''}
     <div class="gb-service-area" ${showService?'':'hidden'}>${servicePickerMarkup(t)}</div>
    </div>
    <div class="full gb-entry-description-field">${field('Descrição','description',t?.serviceId?serviceDisplayName(t.serviceId,t.serviceName,t.description):t?.description||'','text','maxlength="300" placeholder="Ex.: Energia do escritório" '+(t?.serviceId&&showService?'readonly aria-describedby="gb-service-naming-hint"':''))}</div>
    ${partnerField}

   </div>
  </section>
  <section id="gb-entry-step-two" class="gb-entry-stage" data-entry-stage="2" aria-label="Periodicidade e observações" hidden>
   <div class="form-grid gb-entry-grid">
    <p class="full gb-entry-amount-recap">Valor informado: <strong>${money(t?.amount||0)}</strong></p>
    <div class="full">${periodicity}</div>
    <div class="full">${field('Documento','document',t?.document||'','text','maxlength="100" placeholder="Nº do documento"')}</div>
    ${!t?'<div id="count-field" class="full" hidden>'+field('Parcelas / meses','count',2,'number','min="2" max="120" step="1"')+'</div>':''}
    ${extra?'<div class="full">'+extra+'</div>':''}
    ${textarea('Observações','notes',t?.notes)}
   </div>
   ${(db.cards||[]).length?'<div class="gb-entry-refund-card" '+(type==='income'?'':'hidden')+'>'+select('Cartão relacionado ao reembolso (opcional)','relatedCardId',[['','Não vincular'],...(db.cards||[]).map(c=>[c.id,c.name])],t?.relatedCardId||'')+'<p>Vínculo apenas informativo: não reduz automaticamente a fatura nem aumenta o limite. Só registre baixa bancária quando o valor realmente entrar na conta.</p></div>':''}
  </section>
  <section id="gb-entry-step-three" class="gb-entry-stage" data-entry-stage="3" aria-label="Datas e baixa do lançamento" hidden>
   <div class="form-grid gb-entry-grid">
    <div class="gb-entry-date">${field('Emissão','issue',t?.issue||today(),'date','required')}</div>
    <div class="gb-entry-date gb-entry-date-due">${field('Vencimento','due',t?.due||today(),'date','required')}</div>
   </div>
   ${settlementHtml}
   <section id="gb-entry-installments" class="gb-entry-installments" ${isSeries?'':'hidden'}>
    <label class="gb-entry-business-switch">
     <input type="checkbox" name="businessDays" value="true" ${t?.businessDays?'checked':''}>
     <span class="gb-entry-switch-track" aria-hidden="true"></span>
     <span><strong>Considerar apenas dias úteis</strong><small>Sábados, domingos e feriados nacionais passam ao próximo dia útil.</small></span>
    </label>
    <button type="button" class="gb-entry-schedule-trigger" data-action="title-schedule-detail" aria-label="Detalhar vencimentos das parcelas">
     <span><strong>Detalhar vencimentos</strong><small id="gb-entry-schedule-count"></small></span><span class="gb-entry-schedule-chevron" aria-hidden="true">›</span>
    </button>
    <div id="gb-entry-schedule" class="gb-entry-schedule" hidden aria-live="polite"></div>
   </section>
  </section>
  <input type="hidden" name="accountId" value="${esc(t?.accountId||'')}">
  <div class="gb-entry-wizard-footer" data-entry-footer="1">
   <button type="button" class="button" data-action="close">Cancelar</button>
   <button type="button" class="button primary" data-action="title-next">Próximo ${icon('arrow')}</button>
  </div>
  <div class="gb-entry-wizard-footer" data-entry-footer="2" hidden>
   <button type="button" class="button" data-action="title-back">Voltar</button>
   <button type="button" class="button primary" data-action="title-next">Próximo ${icon('arrow')}</button>
  </div>
  <div class="gb-entry-wizard-footer" data-entry-footer="3" hidden>
   <button type="button" class="button" data-action="title-back">Voltar</button>
   <button type="submit" class="button primary">${t?'Salvar alterações':'Revisar lançamento'} ${icon('arrow')}</button>
  </div>
 </form>`;
}
function partnerErpDetails(p){
 const m=p?.sankhyaProfile;if(!m)return '';
 const standard=[['Código de origem',m.code],['Código anterior',m.legacyCode],
  ['Razão social original',m.legalName],['Tipo de pessoa',m.personType],
  ['Inscrição estadual / Identidade',m.identity],['CEP',m.zip],['Logradouro',m.street],
  ['Número',m.number],['Complemento',m.complement],['Bairro',m.neighborhood],
  ['Cidade/UF',m.city],['Celular/Fax',m.mobile],['Matriz',m.matrixCode]];
 const attributes=[...standard,...Object.entries(m.attributes||{})].filter(([,value])=>String(value??'').trim());
 return '<details class="full gb-partner-erp-details">'+
  '<summary>Dados adicionais de origem (Sankhya)</summary>'+
  '<p>Os campos adicionais são mantidos para consulta. O código de origem permanece vinculado ao cadastro.</p>'+
  '<dl>'+attributes.map(([key,value])=>'<div><dt>'+esc(key)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl></details>';
}
export function partnerForm(p){const erpExtra=partnerErpDetails(p);return `<form id="partner-form" data-id="${p?.id||''}"><div class="form-grid">${p?.sankhyaCode?'<div class="full gb-partner-erp-code">Código Sankhya: <strong>'+esc(p.sankhyaCode)+'</strong> · associado à importação financeira</div>':''}${field('Nome ou razão social','name',p?.name||'','text',required)}${field('Nome fantasia','tradeName',p?.tradeName||'','text','maxlength="200"')}${field('CPF ou CNPJ','document',p?.document||'','text','maxlength="18"')}${field('Telefone','phone',p?.phone||'','tel','maxlength="30"')}${field('E-mail','email',p?.email||'','email','maxlength="200"')}${select('Situação','active',[['true','Ativo'],['false','Inativo']],String(p?.active??true))}<fieldset class="full roles"><legend>Classificações · escolha uma ou mais</legend>${['Cliente','Fornecedor','Transportadora','Funcionário','Outros'].map(r=>`<label><input type="checkbox" name="roles" value="${r}" ${p?.roles.includes(r)?'checked':''}>${r}</label>`).join('')}</fieldset><div class="full">${field('Endereço','address',p?.address||'','text','maxlength="500"')}</div>${textarea('Observações','notes',p?.notes)}${erpExtra}</div>${p?button(icon('trash')+'Excluir parceiro','delete-partner','danger small',`data-id="${p.id}" type="button"`):''}${formFooter()}</form>`;}
/** The selector is shared by banks, custom cash accounts and goal cofrinhos. */
export function accountBankPreview(db,bankId='',manualBank='',kind='bank',ico=''){
 const bank=findBank(db,bankId);
 const legacy=!bank?String(manualBank||'').trim():'';
 const type=kind==='goal'?'goal':kind==='custom'||(!bank&&!legacy)?'custom':'bank';
 const label=type==='goal'?'Cofrinho':type==='custom'?'Conta personalizada':bank?.name||legacy;
 const sub=type==='goal'?'Guarde dinheiro para um objetivo':type==='custom'?'Sem banco · personalize como quiser':
  bank?'Banco ou instituição':'Instituição já cadastrada';
 const mark=type==='bank'&&bank?bankBadge(bank):
  '<span class="gb-account-cash-mark" aria-hidden="true">'+gbIcon(accountIcon({kind:type,icon:ico}))+'</span>';
 return '<span class="gb-account-bank-preview">'+mark+
  '<span class="gb-account-bank-copy"><strong>'+esc(label)+'</strong><small>'+esc(sub)+'</small></span></span>';
}
export function accountForm(db,a,options={}){
 const matched=findBank(db,a?.bankId)||findBank(db,a?.bank);
 const id=matched?.id||'';
 const legacy=a?.bank&&!matched?String(a.bank):'';
 const kind=a?accountKind(a):options.kind==='goal'?'goal':'custom';
 const currentIcon=accountIcon({kind,icon:a?.icon});
 const initial=a?String((a.initial||0)/100):'';
 const template=goalPreset(a?.goalCategory||'custom');
 return '<form id="account-form" class="gb-account-edit-form" data-id="'+esc(a?.id||'')+'">'+
  '<div class="form-grid gb-account-edit-grid">'+

   '<div class="full gb-account-bank-field"><span class="gb-account-bank-label" id="account-bank-label">Onde fica o dinheiro?</span>'+
    '<input type="hidden" name="kind" value="'+esc(kind)+'">'+
    '<input type="hidden" name="bankId" value="'+esc(id)+'">'+
    '<input type="hidden" name="bank" value="'+esc(legacy)+'">'+
    '<button type="button" class="gb-account-bank-trigger" data-action="account-bank-picker" aria-labelledby="account-bank-label" aria-haspopup="dialog" aria-controls="gb-picker-sheet" aria-expanded="false">'+
     '<span data-account-bank-preview>'+accountBankPreview(db,id,legacy,kind,currentIcon)+'</span>'+
     icon('chevron')+'</button></div>'+
   '<div class="full">'+field('Nome da conta','name',a?.name||'','text','required maxlength="120" placeholder="Ex.: Reserva de emergência, Carteira, Conta principal"')+'</div>'+
   '<div class="full gb-account-type-fields" data-account-type-fields '+(kind==='bank'?'hidden':'')+'>'+
    financePickerField(db,{kind:'icon',name:'icon',label:'Ícone da conta',value:currentIcon})+
    '<p class="gb-account-kind-hint">Seu ícone aparece nos saldos e nos cartões de contas.</p>'+
   '</div>'+
   '<div class="full gb-account-goal-fields" data-account-goal-fields '+(kind==='goal'?'':'hidden')+'>'+
    financePickerField(db,{kind:'goal',name:'goalCategory',label:'Objetivo',value:template[0]})+
    '<div class="gb-account-goal-grid">'+
     field('Valor da meta (R$)','goalTarget',a?.goalTarget?String(a.goalTarget/100):'','number','min="0.01" max="10000000000" step="0.01" inputmode="decimal" placeholder="Ex.: 10000,00"')+
     field('Quando quer alcançar?','goalDue',a?.goalDue||'','date','')+
    '</div>'+
    '<div class="gb-goal-duration" role="group" aria-label="Escolher prazo da meta">'+
     '<span>Prazo rápido</span>'+[3,6,12,24].map(m=>
      '<button type="button" class="button small" data-action="goal-duration" data-months="'+m+'">'+
       (m===12?'1 ano':m===24?'2 anos':m+' meses')+'</button>').join('')+'</div>'+ 
    '<p class="gb-account-kind-hint">Acompanhe quanto falta e a sugestão mensal para chegar à meta.</p>'+
   '</div>'+
   (kind==='goal'&&!a?'<details class="gb30-optional"><summary>Já tenho dinheiro guardado</summary>':'')+
   '<div class="full gb-account-opening"><label for="account-initial">Saldo inicial <small>(opcional)</small></label>'+
    '<div class="gb-account-opening-control"><span aria-hidden="true">R$</span>'+
     '<input id="account-initial" name="initial" type="number" value="'+esc(initial)+'" placeholder="0,00" min="-10000000000" max="10000000000" step="0.01" inputmode="decimal" aria-label="Saldo inicial em reais, opcional"></div>'+
    '<p class="gb-account-opening-hint">Se o dinheiro já está em outra conta do GB+, deixe zero e use Transferir para não contar duas vezes.</p>'+
   '</div>'+
   (kind==='goal'&&!a?'</details>':'')+
   (a?select('Situação','active',[['true','Ativa'],['false','Inativa']],String(a.active??true)):'<input type="hidden" name="active" value="true">')+
  '</div>'+
  (a?button(icon('trash')+'Excluir conta','delete-account','danger small','data-id="'+esc(a.id)+'" type="button"'):'')+
  formFooter()+'</form>';
}

export function categoryForm(c){
 const current=categoryIconFor(c);
 return '<form id="category-form" data-id="'+esc(c?.id||'')+'"><div class="form-grid">'+
  field('Nome da categoria','name',c?.name||'','text','required maxlength="100"')+
  select('Tipo','type',[['expense','Despesa'],['income','Receita']],c?.type||'expense')+
  financePickerField(null,{kind:'category-icon',name:'icon',label:'Ícone da categoria',value:current})+
  '</div>'+
  (c?button(icon('trash')+'Excluir categoria','delete-category','danger small','data-id="'+esc(c.id)+'" type="button"'):'')+
  formFooter()+'</form>';
}
export function paymentForm(db,t){const accounts=db.accounts.filter(a=>a.active);return accounts.length?`<div class="detail-summary"><span>${esc(t.description)}</span><strong>${money(pending(db,t))}</strong><small>Saldo pendente</small></div><form id="payment-form" data-id="${t.id}"><div class="form-grid">${field('Valor da baixa (R$)','amount',pending(db,t)/100,'number',`required min="0.01" max="${pending(db,t)/100}" step="0.01"`)}${field('Data do pagamento / recebimento','date',today(),'date',`required max="${today()}"`)}<div class="full">${financePickerField(db,{kind:'account',name:'accountId',label:'Conta utilizada',value:accounts.some(a=>a.id===t.accountId)?t.accountId:accounts[0]?.id||'',required:true})}</div></div>${formFooter('Confirmar baixa')}</form>`:empty('Adicione uma conta primeiro','Uma baixa precisa de uma conta financeira para movimentar o saldo.','new-account','Cadastrar conta');}
export function transferForm(db,{from='',to=''}={}){
 const active=db.accounts.filter(a=>a.active),options=active.map(a=>[a.id,a.name]);
 if(active.length<2)return empty('São necessárias duas contas ativas','Cadastre as contas de origem e destino para transferir.','new-account','Cadastrar conta');
 const source=options.some(([id])=>id===from)?from:options.find(([id])=>id!==to)?.[0]||options[0][0];
 const target=options.some(([id])=>id===to&&id!==source)?to:options.find(([id])=>id!==source)?.[0]||options[1][0];
 return '<form id="transfer-form"><div class="form-grid">'+
  financePickerField(db,{kind:'account',name:'from',label:'De onde sai',value:source,required:true})+
  financePickerField(db,{kind:'account',name:'to',label:'Para onde vai',value:target,required:true,exclude:source})+
  field('Valor (R$)','amount','','number','required min="0.01" max="10000000000" step="0.01"')+
  field('Data','date',today(),'date','required max="'+today()+'"')+
  '</div><p class="form-hint">A transferência movimenta as duas contas sem gerar receita ou despesa. Para guardar dinheiro no cofrinho, transfira de uma conta existente.</p>'+
  formFooter('Transferir')+'</form>';
}
export function titleDetail(db,t){const invoicePurchases=t.cardInvoice?(db.cardPurchases||[]).filter(p=>p.invoiceId===t.id):[];return `<div class="detail-summary"><span>${esc(serviceDisplayName(t.serviceId,t.serviceName,t.description))}${t.count>1?` · ${t.sequence}/${t.count}`:''}</span><strong>${money(t.amount)}</strong><small>${money(pending(db,t))} pendentes · Vencimento ${dateLabel(t.due)}</small></div><dl class="details"><dt>Parceiro</dt><dd>${esc(db.partners.find(p=>p.id===t.partnerId)?.name||'Sem parceiro')}</dd><dt>Categoria</dt><dd>${esc(db.categories.find(c=>c.id===t.categoryId)?.name)}</dd><dt>Origem</dt><dd>${t.importSource==='sankhya'||t.importKey?.startsWith('sankhya-fin-v1:')?'Via importação · Sankhya':'Lançamento no GB+'}</dd><dt>Serviço</dt><dd>${serviceIdentityMarkup(t.serviceId,t.serviceName)||'—'}</dd><dt>Documento</dt><dd>${esc(t.document||'—')}</dd><dt>Meio previsto</dt><dd>${t.paymentMethod==='debit'?'Cartão de débito':t.paymentMethod==='account'?'Conta / Pix / dinheiro':'—'}</dd><dt>Cartão relacionado</dt><dd>${esc(db.cards?.find(c=>c.id===t.relatedCardId)?.name||'—')}${t.relatedCardId?' · vínculo informativo, sem ajuste na fatura':''}</dd>${t.cardInvoice?`<dt>Cartão</dt><dd>${esc(db.cards?.find(c=>c.id===t.cardId)?.name||'Cartão não encontrado')}</dd><dt>Competência</dt><dd>${esc(t.cardCycle||'—')}</dd><dt>Tipo de fatura</dt><dd>${invoicePurchases.some(p=>p.source==='invoice-balance')?'Saldo consolidado informado':'Compras registradas no GB+'}</dd>`:''}<dt>Emissão</dt><dd>${dateLabel(t.issue)}</dd><dt>Observações</dt><dd>${esc(t.notes||'—')}</dd></dl>${t.cardInvoice?'<h3>Composição da fatura</h3>'+(invoicePurchases.length?'<div class="history-list">'+invoicePurchases.map(p=>'<div><span>'+esc(p.description)+'<small>'+(p.source==='invoice-balance'?'Saldo consolidado informado · sem itens individuais':dateLabel(p.date)+' · parcela '+p.sequence+'/'+p.count)+'</small></span><b>'+money(p.amount)+'</b>'+button(p.source==='invoice-balance'?'Editar saldo':'Editar compra','edit-card-purchase','small',`data-id="${p.id}"`)+(p.source==='invoice-balance'?button('Excluir saldo','delete-card-purchase','small',`data-id="${p.id}"`):'')+'</div>').join('')+'</div>':'<p class="muted">Nenhuma compra vinculada.</p>'):''}<h3>Histórico de baixas</h3>${db.payments.some(p=>p.titleId===t.id)?`<div class="history-list">${db.payments.filter(p=>p.titleId===t.id).map(p=>`<div><span>${dateLabel(p.date)}<small>${esc(db.accounts.find(a=>a.id===p.accountId)?.name)}</small></span><b>${money(p.amount)}</b><button class="icon-button" data-action="undo-payment" data-id="${p.id}" aria-label="Estornar baixa de ${money(p.amount)}">${icon('trash')}</button></div>`).join('')}</div>`:'<p class="muted">Nenhuma baixa registrada.</p>'}<div class="form-footer">${t.cardInvoice?'':button(icon('trash'),'delete-title','danger',`data-id="${t.id}" aria-label="Excluir título"`)+button('Editar','edit-title','',`data-id="${t.id}"`)}${pending(db,t)>0?button('Registrar baixa','payment','primary',`data-id="${t.id}"`):''}</div>`;}
export function customizeForm(db){return `<form id="customize-form"><p class="muted">Escolha o que importa para você em cada tela.</p><div class="customize-table"><div><b>Indicador</b><b>Desktop</b><b>Celular</b></div>${Object.entries(INDICATORS).map(([k,v])=>`<div><span>${v}</span>${['desktop','mobile'].map(d=>`<label><span class="sr-only">${v} ${d}</span><input type="checkbox" name="${d}:${k}" ${db.settings.panel[d][k]?'checked':''}></label>`).join('')}</div>`).join('')}</div>${button('Restaurar padrão','reset-panel','small','type="button"')}${formFooter('Salvar painel')}</form>`;}
export function accountDetail(db,a){
 if(!a)return '<p class="muted">Conta não encontrada.</p>';
 const ledger=dailyStatement(db,a.id,today());
 const groups=ledger.days;
 return '<div class="gb-statement" aria-label="Extrato da conta">'+
  '<div class="gb-statement-account"><span>'+esc(a.name)+'</span><strong>'+money(ledger.closing)+'</strong><small>Saldo atual · Saldo inicial cadastrado: '+money(a.initial)+'</small></div>'+
  (a.active!==false&&accountKind(a)!=='goal'?'<div class="gb-statement-import"><button class="button" data-action="bank-import-open" data-id="'+esc(a.id)+'">'+icon('upload')+' Importar extrato OFX/CSV</button><small>Arquivo local · só grava após confirmar</small></div>':'')+ 
   '<div class="gb-statement-totals"><div><small>Créditos acumulados</small><strong class="gb-statement-credit">+ '+money(ledger.credits)+'</strong></div>'+
  '<div><small>Débitos acumulados</small><strong class="gb-statement-debit">− '+money(ledger.debits)+'</strong></div></div>'+
  (accountKind(a)==='goal'?'<div class="gb-goal-actions">'+button('Guardar','goal-deposit','small','data-id="'+esc(a.id)+'"')+button('Retirar','goal-withdraw','small','data-id="'+esc(a.id)+'"')+'</div>':'<div class="gb-statement-links"><button type="button" class="button" data-action="bank-import-history" data-id="'+esc(a.id)+'">Histórico de conciliações</button></div>')+ 
   '<p class="gb-statement-note">Movimentações registradas no GB+. O saldo inicial cadastrado é a base dos cálculos. Os vínculos de conciliação não alteram estes valores.</p>'+
  '<div class="gb-statement-days">'+groups.map(day=>
   '<section class="gb-statement-day" aria-label="Movimentações de '+dateLabel(day.date)+'">'+
    '<div class="gb-statement-day-header"><time datetime="'+day.date+'">'+dateLabel(day.date)+'</time>'+
    '<span>Início do dia <strong>'+money(day.opening)+'</strong></span></div>'+
    (day.items.length?'<div class="gb-statement-movements">'+day.items.map(item=>
     '<div class="gb-statement-movement"><span class="gb-statement-direction '+(item.type==='income'?'is-credit':'is-debit')+'">'+icon(item.type==='income'?'up':'down')+'</span>'+
     '<span class="gb-statement-description"><strong>'+esc(item.description)+'</strong><small>'+(item.kind==='transfer'?'Transferência':'Baixa')+'</small></span>'+
     '<strong class="'+(item.type==='income'?'gb-statement-credit':'gb-statement-debit')+'">'+(item.type==='income'?'+ ':'− ')+money(item.amount)+'</strong></div>').join('')+'</div>':
     '<p class="gb-statement-empty">Sem movimentações registradas.</p>')+
    '<div class="gb-statement-day-footer"><span>Créditos <b>+ '+money(day.credits)+'</b></span><span>Débitos <b>− '+money(day.debits)+'</b></span>'+
    '<strong>Saldo do fim do dia '+money(day.closing)+'</strong></div></section>').join('')+'</div>'+
  '<p class="gb-statement-note">Transferências entre suas contas aparecem como saída em uma conta e entrada na outra; não são receitas nem despesas.</p></div>';
}
