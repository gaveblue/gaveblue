import {today,money,dateLabel,pending,paid,accountBalance} from './domain.js?v=20261105-72';
import {esc,field,select,textarea,formFooter,button,icon,titleTable,empty} from './ui.js?v=20261105-72';
import {INDICATORS} from './store.js?v=20261105-78';
import {entrySelect} from './entry-select.js?v=20261104-42';
import {gbIcon,CATEGORY_ICON_OPTIONS,categoryIconFor} from './gb-icons.js?v=20261104-42';
import {bankOptions,findBank,bankPicker} from './banks.js?v=20261105-87';
import {dailyStatement} from './daily-statement.js?v=20261105-90';
import {servicePickerMarkup,serviceIdentityMarkup,serviceDisplayName} from './service-ui.js?v=20261106-2620';
const required='required maxlength="200"';
export function titleForm(db,t,type='expense'){
 type=t?.type||type;
 const categoryOptions=db.categories.filter(c=>c.type===type).map(c=>[c.id,c.name,categoryIconFor(c)]);
 const typeField='<div class="gb-entry-flow-switch" role="group" aria-label="Tipo de lançamento">'+
  '<select id="entry-type" name="type" class="gb-entry-type-source" data-gb-native="true" aria-hidden="true" tabindex="-1">'+
   '<option value="expense"'+(type==='expense'?' selected':'')+'>Despesa</option>'+
   '<option value="income"'+(type==='income'?' selected':'')+'>Receita</option></select>'+
  '<button type="button" data-action="entry-type-pick" data-value="expense" class="gb-entry-flow-option'+(type==='expense'?' is-active':'')+'" aria-pressed="'+(type==='expense')+'">'+
   '<span class="gb-entry-flow-icon is-expense">'+icon('down')+'</span>Despesa</button>'+
  '<button type="button" data-action="entry-type-pick" data-value="income" class="gb-entry-flow-option'+(type==='income'?' is-active':'')+'" aria-pressed="'+(type==='income')+'">'+
   '<span class="gb-entry-flow-icon is-income">'+icon('up')+'</span>Receita</button></div>';
 const categoryField=entrySelect('Categoria','categoryId',categoryOptions,t?.categoryId,'entry-category',true);
 // PF does not expose partner editing. Preserve any pre-existing partner on edit
 // so that older records remain intact until a dedicated PJ profile is shipped.
 const partnerField='<div class="gb-entry-partner-disabled"><span class="gb-entry-label">Parceiro <small>Em breve para PJ</small></span>'+
  '<div class="gb-entry-disabled-input" aria-disabled="true">'+icon('lock')+'<span>Desativado para PF</span></div>'+
  '<input type="hidden" name="partnerId" value="'+esc(t?.partnerId||'')+'"></div>';
 const periodicity=t?
   entrySelect('Situação','cancelled',[['false','Ativo'],['true','Cancelado']],String(t.cancelled),'entry-cancelled'):
   entrySelect('Periodicidade','mode',[['single','Único'],['installment','Parcelado'],['recurring','Recorrente']],'single','entry-mode',true);
 const extra=t&&t.mode==='recurring'?
   entrySelect('Aplicar alterações','scope',[['one','Somente este lançamento'],['future','Este e os futuros da recorrência']],'one','entry-scope'):
   '';
 const isSeries=!t||t.mode==='recurring';
 return `<form id="title-form" class="gb-entry-form gb-entry-wizard" data-id="${esc(t?.id||'')}" data-mode="${esc(t?.mode||'single')}" data-count="${Number(t?Math.max(1,t.count-t.sequence+1):1)}" data-step="1" data-entry-type="${esc(type)}">
  <div class="gb-entry-progress" aria-label="Etapa 1 de 2"><span class="active">1 · Lançamento</span><span>2 · Detalhes</span></div>
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
    <div class="full">${categoryField}</div>
    <div class="full">${field('Descrição','description',t?.serviceId?serviceDisplayName(t.serviceId,t.serviceName,t.description):t?.description||'','text','required maxlength="300" placeholder="Ex.: Energia do escritório" '+(t?.serviceId?'readonly aria-describedby="gb-service-naming-hint"':''))}</div>
    <div class="full gb-service-area" ${type==='expense'?'':'hidden'}>${servicePickerMarkup(t)}</div>
    ${partnerField}
    ${field('Documento','document',t?.document||'','text','maxlength="100" placeholder="Nº do documento"')}
    <div class="gb-entry-date">${field('Emissão','issue',t?.issue||today(),'date','required')}</div>
    <div class="gb-entry-date">${field('Vencimento','due',t?.due||today(),'date','required')}</div>
   </div>
  </section>
  <section id="gb-entry-step-two" class="gb-entry-stage" data-entry-stage="2" aria-label="Periodicidade e observações" hidden>
   <div class="form-grid gb-entry-grid">
    <p class="full gb-entry-amount-recap">Valor informado: <strong>${money(t?.amount||0)}</strong></p>
    <div class="full">${periodicity}</div>
    ${!t?'<div id="count-field" class="full" hidden>'+field('Parcelas / meses','count',2,'number','min="2" max="120" step="1"')+'</div>':''}
    ${extra?'<div class="full">'+extra+'</div>':''}
    ${textarea('Observações','notes',t?.notes)}
   </div>
   <section id="gb-entry-installments" class="gb-entry-installments" ${isSeries?'':'hidden'}>
    <label class="gb-entry-business-switch">
     <input type="checkbox" name="businessDays" value="true" ${t?.businessDays?'checked':''}>
     <span class="gb-entry-switch-track" aria-hidden="true"></span>
     <span><strong>Considerar apenas dias úteis</strong><small>Adiantar não: sábados, domingos e feriados nacionais passam ao próximo dia útil.</small></span>
    </label>
    <div class="gb-entry-schedule-header"><strong>Prévia dos próximos vencimentos</strong><small id="gb-entry-schedule-count"></small></div>
    <div id="gb-entry-schedule" class="gb-entry-schedule" aria-live="polite"></div>
    <p class="gb-entry-schedule-note">Feriados estaduais e municipais não estão incluídos. Confira as datas antes de confirmar.</p>
   </section>
  </section>
  ${!t&&Array.isArray(db.cards)&&db.cards.some(c=>c.active)?'<div class="gb-credit-entry-link"><strong>Vai pagar no cartão de crédito?</strong><p>Registre a compra no cartão para gerar a fatura automaticamente, sem duplicar a despesa.</p><button type="button" class="button" data-action="new-card-purchase">Lançar compra no cartão</button></div>':''}
  <input type="hidden" name="accountId" value="${esc(t?.accountId||'')}">
  <div class="form-error" role="alert"></div>
  <div class="gb-entry-wizard-footer" data-entry-footer="1">
   <button type="button" class="button" data-action="close">Cancelar</button>
   <button type="button" class="button primary" data-action="title-next">Próximo ${icon('arrow')}</button>
  </div>
  <div class="gb-entry-wizard-footer" data-entry-footer="2" hidden>
   <button type="button" class="button" data-action="title-back">Voltar</button>
   <button type="submit" class="button primary">${t?'Salvar alterações':'Revisar lançamento'} ${icon('arrow')}</button>
  </div>
 </form>`;
}
export function partnerForm(p){return `<form id="partner-form" data-id="${p?.id||''}"><div class="form-grid">${field('Nome ou razão social','name',p?.name||'','text',required)}${field('Nome fantasia','tradeName',p?.tradeName||'','text','maxlength="200"')}${field('CPF ou CNPJ','document',p?.document||'','text','maxlength="18"')}${field('Telefone','phone',p?.phone||'','tel','maxlength="30"')}${field('E-mail','email',p?.email||'','email','maxlength="200"')}${select('Situação','active',[['true','Ativo'],['false','Inativo']],String(p?.active??true))}<fieldset class="full roles"><legend>Classificações · escolha uma ou mais</legend>${['Cliente','Fornecedor','Transportadora','Funcionário','Outros'].map(r=>`<label><input type="checkbox" name="roles" value="${r}" ${p?.roles.includes(r)?'checked':''}>${r}</label>`).join('')}</fieldset><div class="full">${field('Endereço','address',p?.address||'','text','maxlength="500"')}</div>${textarea('Observações','notes',p?.notes)}</div>${p?button(icon('trash')+'Excluir parceiro','delete-partner','danger small',`data-id="${p.id}" type="button"`):''}${formFooter()}</form>`;}
export function accountForm(db,a){
 const id=a?.bankId||findBank(db,a?.bank)?.id||'';
 return '<form id="account-form" data-id="'+esc(a?.id||'')+'"><div class="form-grid">'+
 field('Nome da conta','name',a?.name||'','text','required maxlength="120"')+
 bankPicker(db,id)+
 '<div class="full">'+field('Outra instituição (opcional)','bank',a?.bank&&!id?a.bank:'','text','maxlength="120" placeholder="Ex.: Cooperativa regional"')+'</div>'+
 field('Agência (opcional)','branch',a?.branch||'','text','maxlength="80"')+
 field('Número da conta (opcional)','number',a?.number||'','text','maxlength="80"')+
 field('Saldo inicial (R$)','initial',(a?.initial||0)/100,'number','required step="0.01" min="-10000000000" max="10000000000"')+
 select('Situação','active',[['true','Ativa'],['false','Inativa']],String(a?.active??true))+
 '<p class="form-hint full">Selecione um banco para exibir seu logo. Se não aparecer, você pode cadastrar uma instituição em Bancos. O saldo inicial é o ponto de partida da conta; alterá-lo recalcula o saldo atual.</p></div>'+
 (a?button(icon('trash')+'Excluir conta','delete-account','danger small','data-id="'+esc(a.id)+'" type="button"'):'')+
 formFooter()+'</form>';
}

export function categoryForm(c){
 const current=categoryIconFor(c);
 const palette=CATEGORY_ICON_OPTIONS.map(([key,label])=>`<button type="button" class="gb-category-icon-choice ${current===key?'is-selected':''}" data-action="category-icon" data-icon="${esc(key)}" aria-label="Ícone: ${esc(label)}" aria-pressed="${current===key}" title="${esc(label)}">${gbIcon(key)}<small>${esc(label)}</small></button>`).join('');
 return `<form id="category-form" data-id="${esc(c?.id||'')}"><div class="form-grid">
  ${field('Nome da categoria','name',c?.name||'','text','required maxlength="100"')}
  ${select('Tipo','type',[['expense','Despesa'],['income','Receita']],c?.type||'expense')}
  <fieldset class="full gb-category-icon-picker"><legend>Ícone da categoria</legend>
   <input type="hidden" name="icon" value="${esc(current)}">
   <div class="gb-category-icon-grid">${palette}</div>
   <small>O ícone aparece nos menus e junto à categoria selecionada.</small>
  </fieldset>
  </div>${c?button(icon('trash')+'Excluir categoria','delete-category','danger small',`data-id="${c.id}" type="button"`):''}${formFooter()}</form>`;
}
export function paymentForm(db,t){const accounts=db.accounts.filter(a=>a.active);return accounts.length?`<div class="detail-summary"><span>${esc(t.description)}</span><strong>${money(pending(db,t))}</strong><small>Saldo pendente</small></div><form id="payment-form" data-id="${t.id}"><div class="form-grid">${field('Valor da baixa (R$)','amount',pending(db,t)/100,'number',`required min="0.01" max="${pending(db,t)/100}" step="0.01"`)}${field('Data do pagamento / recebimento','date',today(),'date',`required max="${today()}"`)}<div class="full">${select('Conta utilizada','accountId',accounts.map(a=>[a.id,a.name]),t.accountId,'required')}</div></div>${formFooter('Confirmar baixa')}</form>`:empty('Adicione uma conta primeiro','Uma baixa precisa de uma conta financeira para movimentar o saldo.','new-account','Cadastrar conta');}
export function transferForm(db){const accounts=db.accounts.filter(a=>a.active).map(a=>[a.id,a.name]);return accounts.length>1?`<form id="transfer-form"><div class="form-grid">${select('Conta de origem','from',accounts,accounts[0][0],'required')}${select('Conta de destino','to',accounts,accounts[1][0],'required')}${field('Valor (R$)','amount','','number','required min="0.01" max="10000000000" step="0.01"')}${field('Data','date',today(),'date',`required max="${today()}"`)}</div><p class="form-hint">A transferência movimenta as duas contas sem gerar receita ou despesa.</p>${formFooter('Transferir')}</form>`:empty('São necessárias duas contas ativas','Cadastre as contas de origem e destino para transferir.','new-account','Cadastrar conta');}
export function titleDetail(db,t){const invoicePurchases=t.cardInvoice?(db.cardPurchases||[]).filter(p=>p.invoiceId===t.id):[];return `<div class="detail-summary"><span>${esc(serviceDisplayName(t.serviceId,t.serviceName,t.description))}${t.count>1?` · ${t.sequence}/${t.count}`:''}</span><strong>${money(t.amount)}</strong><small>${money(pending(db,t))} pendentes · Vencimento ${dateLabel(t.due)}</small></div><dl class="details"><dt>Parceiro</dt><dd>${esc(db.partners.find(p=>p.id===t.partnerId)?.name||'Sem parceiro')}</dd><dt>Categoria</dt><dd>${esc(db.categories.find(c=>c.id===t.categoryId)?.name)}</dd><dt>Serviço</dt><dd>${serviceIdentityMarkup(t.serviceId,t.serviceName)||'—'}</dd><dt>Documento</dt><dd>${esc(t.document||'—')}</dd><dt>Emissão</dt><dd>${dateLabel(t.issue)}</dd><dt>Observações</dt><dd>${esc(t.notes||'—')}</dd></dl>${t.cardInvoice?'<h3>Compras incluídas nesta fatura</h3>'+(invoicePurchases.length?'<div class="history-list">'+invoicePurchases.map(p=>'<div><span>'+esc(p.description)+'<small>'+dateLabel(p.date)+' · parcela '+p.sequence+'/'+p.count+'</small></span><b>'+money(p.amount)+'</b></div>').join('')+'</div>':'<p class="muted">Nenhuma compra vinculada.</p>'):''}<h3>Histórico de baixas</h3>${db.payments.some(p=>p.titleId===t.id)?`<div class="history-list">${db.payments.filter(p=>p.titleId===t.id).map(p=>`<div><span>${dateLabel(p.date)}<small>${esc(db.accounts.find(a=>a.id===p.accountId)?.name)}</small></span><b>${money(p.amount)}</b><button class="icon-button" data-action="undo-payment" data-id="${p.id}" aria-label="Estornar baixa de ${money(p.amount)}">${icon('trash')}</button></div>`).join('')}</div>`:'<p class="muted">Nenhuma baixa registrada.</p>'}<div class="form-footer">${t.cardInvoice?'':button(icon('trash'),'delete-title','danger',`data-id="${t.id}" aria-label="Excluir título"`)+button('Editar','edit-title','',`data-id="${t.id}"`)}${pending(db,t)>0?button('Registrar baixa','payment','primary',`data-id="${t.id}"`):''}</div>`;}
export function customizeForm(db){return `<form id="customize-form"><p class="muted">Escolha o que importa para você em cada tela.</p><div class="customize-table"><div><b>Indicador</b><b>Desktop</b><b>Celular</b></div>${Object.entries(INDICATORS).map(([k,v])=>`<div><span>${v}</span>${['desktop','mobile'].map(d=>`<label><span class="sr-only">${v} ${d}</span><input type="checkbox" name="${d}:${k}" ${db.settings.panel[d][k]?'checked':''}></label>`).join('')}</div>`).join('')}</div>${button('Restaurar padrão','reset-panel','small','type="button"')}${formFooter('Salvar painel')}</form>`;}
export function accountDetail(db,a){
 if(!a)return '<p class="muted">Conta não encontrada.</p>';
 const ledger=dailyStatement(db,a.id,today());
 const groups=ledger.days;
 return '<div class="gb-statement" aria-label="Extrato da conta">'+
  '<div class="gb-statement-account"><span>'+esc(a.name)+'</span><strong>'+money(ledger.closing)+'</strong><small>Saldo atual · Saldo inicial cadastrado: '+money(a.initial)+'</small></div>'+
  (a.active!==false?'<div class="gb-statement-import"><button class="button" data-action="bank-import-open" data-id="'+esc(a.id)+'">'+icon('upload')+' Importar extrato OFX/CSV</button><small>Arquivo local · só grava após confirmar</small></div>':'')+ 
   '<div class="gb-statement-totals"><div><small>Créditos acumulados</small><strong class="gb-statement-credit">+ '+money(ledger.credits)+'</strong></div>'+
  '<div><small>Débitos acumulados</small><strong class="gb-statement-debit">− '+money(ledger.debits)+'</strong></div></div>'+
  '<div class="gb-statement-links"><button type="button" class="button" data-action="bank-import-history" data-id="'+esc(a.id)+'">Histórico de conciliações</button></div>'+ 
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
