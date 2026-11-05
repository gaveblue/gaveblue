import {today,money,dateLabel,pending,paid,accountBalance} from './domain.js';
import {esc,field,select,textarea,formFooter,button,icon,titleTable,empty} from './ui.js?v=20261104-41';
import {INDICATORS} from './store.js';
import {entrySelect} from './entry-select.js?v=20261104-41';
import {gbIcon,CATEGORY_ICON_OPTIONS,categoryIconFor} from './gb-icons.js?v=20261104-42';
const required='required maxlength="200"';
export function titleForm(db,t,type='expense'){
 type=t?.type||type;
 const categoryOptions=db.categories.filter(c=>c.type===type).map(c=>[c.id,c.name,categoryIconFor(c)]);
 const partnerOptions=[['','Sem parceiro'],...db.partners.filter(p=>p.active||p.id===t?.partnerId).map(p=>[p.id,p.name])];
 const typeField=entrySelect('Tipo','type',[['expense','Despesa'],['income','Receita']],type,'entry-type',true);
 const categoryField=entrySelect('Categoria','categoryId',categoryOptions,t?.categoryId,'entry-category',true);
 const partnerField=entrySelect('Parceiro','partnerId',partnerOptions,t?.partnerId,'entry-partner');
 const periodicity=t?
   entrySelect('Situação','cancelled',[['false','Ativo'],['true','Cancelado']],String(t.cancelled),'entry-cancelled'):
   entrySelect('Periodicidade','mode',[['single','Único'],['installment','Parcelado'],['recurring','Recorrente']],'single','entry-mode',true);
 const extra=t&&t.mode==='recurring'?
   entrySelect('Aplicar alterações','scope',[['one','Somente este lançamento'],['future','Este e os futuros da recorrência']],'one','entry-scope'):
   '';
 const isSeries=!t||t.mode!=='single';
 return `<form id="title-form" class="gb-entry-form gb-entry-wizard" data-id="${esc(t?.id||'')}" data-mode="${esc(t?.mode||'single')}" data-count="${Number(t?.count||1)}" data-step="1">
  <div class="gb-entry-progress" aria-label="Etapa 1 de 2"><span class="active">1 · Dados</span><span>2 · Valores</span></div>
  <section id="gb-entry-step-one" class="gb-entry-stage" data-entry-stage="1" aria-label="Dados do lançamento">
   <div class="form-grid gb-entry-grid">
    ${typeField}
    ${categoryField}
    <div class="full">${field('Descrição','description',t?.description||'','text','required maxlength="300" placeholder="Ex.: Energia do escritório"')}</div>
    ${partnerField}
    ${field('Documento','document',t?.document||'','text','maxlength="100" placeholder="Nº do documento"')}
    <div class="gb-entry-date">${field('Emissão','issue',t?.issue||today(),'date','required')}</div>
    <div class="gb-entry-date">${field('Vencimento','due',t?.due||today(),'date','required')}</div>
   </div>
  </section>
  <section id="gb-entry-step-two" class="gb-entry-stage" data-entry-stage="2" aria-label="Valores e periodicidade" hidden>
   <div class="form-grid gb-entry-grid">
    <div class="full">${field('Valor (R$)','amount',t?t.amount/100:'','number','required min="0.01" max="10000000000" step="0.01" placeholder="0,00"')}</div>
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
export function accountForm(a){return `<form id="account-form" data-id="${a?.id||''}"><div class="form-grid">${field('Nome da conta','name',a?.name||'','text','required maxlength="120"')}${field('Banco / instituição','bank',a?.bank||'','text','maxlength="120"')}${field('Agência (opcional)','branch',a?.branch||'','text','maxlength="80"')}${field('Número da conta (opcional)','number',a?.number||'','text','maxlength="80"')}${field('Saldo inicial (R$)','initial',(a?.initial||0)/100,'number','required step="0.01" min="-10000000000" max="10000000000"')}${select('Situação','active',[['true','Ativa'],['false','Inativa']],String(a?.active??true))}<p class="form-hint full">O saldo inicial é a base da conta, antes de todas as baixas e transferências cadastradas. Alterá-lo recalcula o saldo atual.</p></div>${a?button(icon('trash')+'Excluir conta','delete-account','danger small',`data-id="${a.id}" type="button"`):''}${formFooter()}</form>`;}
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
export function titleDetail(db,t){return `<div class="detail-summary"><span>${esc(t.description)}${t.count>1?` · ${t.sequence}/${t.count}`:''}</span><strong>${money(t.amount)}</strong><small>${money(pending(db,t))} pendentes · Vencimento ${dateLabel(t.due)}</small></div><dl class="details"><dt>Parceiro</dt><dd>${esc(db.partners.find(p=>p.id===t.partnerId)?.name||'Sem parceiro')}</dd><dt>Categoria</dt><dd>${esc(db.categories.find(c=>c.id===t.categoryId)?.name)}</dd><dt>Documento</dt><dd>${esc(t.document||'—')}</dd><dt>Emissão</dt><dd>${dateLabel(t.issue)}</dd><dt>Observações</dt><dd>${esc(t.notes||'—')}</dd></dl><h3>Histórico de baixas</h3>${db.payments.some(p=>p.titleId===t.id)?`<div class="history-list">${db.payments.filter(p=>p.titleId===t.id).map(p=>`<div><span>${dateLabel(p.date)}<small>${esc(db.accounts.find(a=>a.id===p.accountId)?.name)}</small></span><b>${money(p.amount)}</b><button class="icon-button" data-action="undo-payment" data-id="${p.id}" aria-label="Estornar baixa de ${money(p.amount)}">${icon('trash')}</button></div>`).join('')}</div>`:'<p class="muted">Nenhuma baixa registrada.</p>'}<div class="form-footer">${button(icon('trash'),'delete-title','danger',`data-id="${t.id}" aria-label="Excluir título"`)}${button('Editar','edit-title','',`data-id="${t.id}"`)}${pending(db,t)>0?button('Registrar baixa','payment','primary',`data-id="${t.id}"`):''}</div>`;}
export function customizeForm(db){return `<form id="customize-form"><p class="muted">Escolha o que importa para você em cada tela.</p><div class="customize-table"><div><b>Indicador</b><b>Desktop</b><b>Celular</b></div>${Object.entries(INDICATORS).map(([k,v])=>`<div><span>${v}</span>${['desktop','mobile'].map(d=>`<label><span class="sr-only">${v} ${d}</span><input type="checkbox" name="${d}:${k}" ${db.settings.panel[d][k]?'checked':''}></label>`).join('')}</div>`).join('')}</div>${button('Restaurar padrão','reset-panel','small','type="button"')}${formFooter('Salvar painel')}</form>`;}
export function accountDetail(db,a){const rows=[...db.payments.filter(p=>p.accountId===a.id).map(p=>{const t=db.titles.find(t=>t.id===p.titleId);return {date:p.date,text:t.description,amount:t.type==='income'?p.amount:-p.amount};}),...db.transfers.filter(t=>t.from===a.id||t.to===a.id).map(t=>({date:t.date,text:`Transferência ${t.from===a.id?'para':'de'} ${db.accounts.find(x=>x.id===(t.from===a.id?t.to:t.from))?.name}`,amount:t.from===a.id?-t.amount:t.amount,id:t.id}))].sort((a,b)=>b.date.localeCompare(a.date));return `<div class="detail-summary"><span>${esc(a.name)}</span><strong>${money(accountBalance(db,a.id,today()))}</strong><small>Saldo inicial: ${money(a.initial)}</small></div><div class="history-list">${rows.length?rows.map(r=>`<div><span>${esc(r.text)}<small>${dateLabel(r.date)}</small></span><b>${money(r.amount)}</b>${r.id?`<button class="icon-button" data-action="undo-transfer" data-id="${r.id}" aria-label="Estornar transferência">${icon('trash')}</button>`:''}</div>`).join(''):'<p class="muted">Nenhuma movimentação.</p>'}</div>`;}
