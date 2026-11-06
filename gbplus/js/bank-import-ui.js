// GB+ 2.5.0 — import, individual review, explicit confirmation and audit UI.
import {money,dateLabel,accountBalance} from './domain.js?v=20261105-72';
import {esc,icon} from './ui.js?v=20261105-72';
import {reconciliationRecordKey,knownReconciliationKeys,pendingReconciliationKeys,bankImportHistory} from './bank-reconciliation.js?v=20261106-2505';

export const BANK_IMPORT_PAGE_SIZE=20;
// Assited reconciliation: account and any new payments require two explicit confirmations.
export const BANK_IMPORT_WRITES_ENABLED=true;
const statusInfo={
 possible_match:['Possível vínculo','match'],
 ambiguous:['Verificar candidatos','ambiguous'],
 possible_duplicate_in_file:['Possível repetição','ambiguous'],
 not_found:['Não localizado','unmatched']
};
const summary=(label,value,modifier='')=>'<div class="gb-import-summary '+modifier+'"><span>'+label+'</span><strong>'+value+'</strong></div>';
const fmtCents=amount=>(amount>0?'+ ':'− ')+money(Math.abs(amount));
const filtered=(preview,filter)=>filter==='all'?preview.rows:
 preview.rows.filter(row=>filter==='ambiguous'
  ?row.status==='ambiguous'||row.status==='possible_duplicate_in_file'
  :row.status===filter);
const choiceCount=draft=>Object.values(draft?.decisions||{}).filter(d=>['link','ignore','pending','create'].includes(d?.action)).length;
const choiceValue=(choice,key)=>choice?.[key]??'';
export function bankImportMarkup(db,draft){
 const accounts=(db?.accounts||[]).filter(account=>account.active!==false);
 if(!accounts.length)return '<div class="gb-import-empty"><h3>Cadastre uma conta financeira antes de importar</h3><p>A leitura de um extrato precisa de uma conta ativa do GB+.</p></div>';
 const accountId=accounts.some(account=>account.id===draft?.accountId)?draft.accountId:accounts[0].id;
 const accountSelect='<label class="gb-import-label" for="gb-import-account">Conta que será conferida</label>'+
  '<select id="gb-import-account" class="gb-import-select" data-gb-native="true" aria-label="Selecionar conta financeira" '+(draft?.step==='confirm'?'disabled':'')+'>'+
  accounts.map(account=>'<option value="'+esc(account.id)+'" '+(account.id===accountId?'selected':'')+'>'+esc(account.name)+'</option>').join('')+'</select>';
 const head='<div id="gb-import-workspace" class="gb-import-workspace">'+
  '<div class="gb-import-intro"><div class="gb-import-symbol">'+icon('wallet')+'</div><div><strong>Conferência de extrato bancário</strong>'+
  '<p>Confira os movimentos do extrato, sem alterar o financeiro.</p></div></div>'+
  '<div class="gb-import-step"><span class="gb-import-step-number">01</span><span>Conta bancária</span></div>'+accountSelect;

 if(draft?.step==='mapping'&&draft.csvMapping){
  const mapping=draft.csvMapping;
  const mode=mapping.mode==='split'?'split':'amount';
  const fields=[['date','Data',true],['description','Histórico/descrição',true],
   ...(mode==='amount'?[['amount','Valor com sinal',true],['kind','Tipo (crédito/débito)',false]]:
       [['credit','Coluna de créditos',true],['debit','Coluna de débitos',true]]),
   ['id','Identificador da transação',false],['balance','Saldo bancário',false]];
  const selectors=fields.map(([key,label,required])=>{
   const selected=mapping.columns?.[key]??-1;
   return '<label class="gb-import-map-field"><span>'+esc(label)+(required?' *':'')+'</span><select data-gb-native="true" class="gb-import-select" data-bank-map-field="'+key+'" aria-label="Coluna: '+esc(label)+'">'+
    '<option value="">Não usar</option>'+
    mapping.headers.map((header,index)=>'<option value="'+index+'" '+(selected===index?'selected':'')+'>'+esc(header)+' (coluna '+(index+1)+')</option>').join('')+
    '</select></label>';
  }).join('');
  const maxColumns=Math.min(mapping.headers.length,8);
  const rows=mapping.sample||[];
  return head+
   '<div class="gb-import-step"><span class="gb-import-step-number">02</span><span>Mapear colunas do CSV</span></div>'+
   '<p class="gb-import-map-hint">Este banco usa nomes diferentes para as colunas. Selecione os campos correspondentes antes de conferir os lançamentos. O arquivo continua somente neste dispositivo.</p>'+
   '<p class="gb-import-hint">'+esc(draft.filename||'CSV')+' · '+mapping.rowCount+' movimentos · '+mapping.headers.length+' colunas</p>'+
   '<label class="gb-import-map-field"><span>Como o banco apresenta os valores?</span><select class="gb-import-select" data-gb-native="true" data-bank-map-mode aria-label="Formato dos valores">'+
    '<option value="amount" '+(mode==='amount'?'selected':'')+'>Uma coluna de valor (com sinal ou coluna Tipo)</option>'+
    '<option value="split" '+(mode==='split'?'selected':'')+'>Duas colunas: crédito e débito</option></select></label>'+
   '<div class="gb-import-map-fields">'+selectors+'</div>'+
   '<div class="gb-import-map-preview" role="region" aria-label="Amostra do CSV" tabindex="0">'+
    '<table><thead><tr>'+mapping.headers.slice(0,maxColumns).map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+
     rows.map(row=>'<tr>'+row.slice(0,maxColumns).map(cell=>'<td>'+esc(cell)+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>'+
   (mapping.headers.length>maxColumns?'<p class="gb-import-hint">Mostrando '+maxColumns+' colunas na amostra; todas estão disponíveis nos seletores.</p>':'')+
   '<p class="gb-import-map-hint">Confira os sinais: sem Tipo ou valores negativos, todo Valor positivo será entendido como entrada. A prévia não altera saldos.</p>'+
   (draft.error?'<p class="gb-import-error" role="alert">'+esc(draft.error)+'</p>':'')+
   '<div class="gb-import-footer"><button type="button" class="button" data-action="bank-import-reset">Trocar arquivo</button>'+
    '<button type="button" class="button primary" data-action="bank-import-apply-map">Gerar prévia</button></div></div>';
 }
 if(!draft?.preview){
  return head+
   '<div class="gb-import-step"><span class="gb-import-step-number">02</span><span>Arquivo do banco</span></div>'+
   '<label class="gb-import-drop" for="gb-import-file">'+icon('upload')+
    '<strong>Selecionar extrato OFX ou CSV</strong>'+
    '<small>Leitura local · até 8 MB · máximo de 20.000 movimentos</small></label>'+
   '<input class="gb-import-file-input" id="gb-import-file" type="file" accept=".ofx,.csv,.txt,text/csv" aria-label="Selecionar arquivo OFX ou CSV">'+
   (draft?.error?'<p class="gb-import-error" role="alert">'+esc(draft.error)+'</p>':'')+
   '<div class="gb-import-privacy">'+icon('shield')+
    '<p>O arquivo permanece no dispositivo. Nenhum lançamento, baixa ou saldo será alterado pela leitura.</p></div></div>';
 }
 const preview=draft.preview,rows=filtered(preview,draft.filter||'all');
 const reported=preview.bankBalance;
 const comparison=reported?(()=>{
  const internal=accountBalance(db,preview.accountId,reported.date);
  const difference=reported.amount-internal;
  return '<div class="gb-import-step"><span class="gb-import-step-number">03</span><span>Saldo informado no extrato</span></div>'+
   '<div class="gb-import-balance-comparison" aria-label="Comparação indicativa de saldos">'+
    summary('Banco · '+dateLabel(reported.date),money(reported.amount))+
    summary('GB+ · mesma data',money(internal))+
    summary('Diferença indicativa',money(difference))+
   '</div>'+
   '<p class="gb-import-balance-note">Comparação indicativa, não uma conciliação confirmada: o saldo inicial do GB+ não tem data-base cadastrada. Confira se o extrato é da conta selecionada e se os períodos são equivalentes. Nenhum ajuste de saldo será feito.</p>';
 })():'<p class="gb-import-balance-note">'+esc(preview.warnings?.[0]||'Este arquivo não informa um saldo bancário final identificável. É possível conferir os movimentos, mas não calcular a diferença de saldos sem esse dado.')+'</p>';
 const saved=knownReconciliationKeys(db,preview.accountId);
 const outstanding=pendingReconciliationKeys(db,preview.accountId);
 const plan=draft.review;
 if(BANK_IMPORT_WRITES_ENABLED&&draft.step==='confirm'&&plan){
  return head+
   '<div class="gb-import-step"><span class="gb-import-step-number">02</span><span>Confirmar decisões</span></div>'+
   '<div class="gb-import-review-heading"><h3>Revisão final</h3><p>Você selecionou '+plan.entries.length+' movimento(s). Confira antes de salvar os vínculos e decisões.</p></div>'+
   '<div class="gb-import-summary-grid">'+
    summary('Conciliar',String(plan.totals.linked))+
    summary('Ignorar',String(plan.totals.ignored))+
    summary('Pendentes',String(plan.totals.pending))+
    summary('Lançamentos novos',String(plan.totals.created||0))+
    summary('Entradas a registrar',money(plan.totals.amountCreatedIn||0),'income')+
    summary('Saídas a registrar',money(plan.totals.amountCreatedOut||0),'expense')+
    summary('Alteração de saldo',money((plan.totals.amountCreatedIn||0)-(plan.totals.amountCreatedOut||0)))+'</div>'+
   '<div class="gb-import-confirm-rows">'+plan.entries.slice(0,50).map(row=>
     '<div class="gb-import-confirm-row"><span>'+dateLabel(row.date)+' · '+esc(row.description)+
     '</span><b>'+fmtCents(row.amount)+'</b><small>'+({'link':'Conciliar','ignore':'Ignorar','pending':'Manter pendente','create':'Criar '+(row.amount>0?'receita recebida':'despesa paga')}[row.action])+
     (row.action==='create'?' · '+esc(db.categories.find(c=>c.id===row.categoryId)?.name||'Categoria não localizada'):'')+'</small></div>'
    ).join('')+
    (plan.entries.length>50?'<p class="gb-import-hint">Mostrando 50 dos '+plan.entries.length+' movimentos selecionados.</p>':'')+
   '</div>'+
   '<div class="gb-import-privacy">'+icon('shield')+'<p>As conciliações usam vínculos existentes. Os movimentos escolhidos como <strong>Criar lançamento</strong> gerarão um título e uma baixa na conta, alterando o saldo. O arquivo original não será armazenado.</p></div>'+
   (plan.totals.created?'<p class="gb-import-finance-warning">Antes de confirmar: verifique se essas movimentações já fazem parte do saldo inicial informado. Transferências entre suas próprias contas não devem ser classificadas como receitas ou despesas.</p><label class="gb-import-explicit-confirm"><input type="checkbox" id="gb-import-create-confirm" '+(draft.confirmCreation?'checked':'')+'><span>Confirmo a criação de '+plan.totals.created+' lançamento(s) já baixado(s), com efeito no saldo bancário do GB+.</span></label>':'')+
   '<label class="gb-import-explicit-confirm"><input type="checkbox" id="gb-import-account-confirm" '+(draft.confirmAccount?'checked':'')+'><span>Confirmo que o extrato pertence à conta <strong>'+esc(db.accounts.find(a=>a.id===plan.accountId)?.name||'selecionada')+'</strong> e que revisei as decisões.</span></label>'+
   '<div class="gb-import-footer"><button type="button" class="button" data-action="bank-import-back">Voltar à revisão</button>'+
   '<button type="button" class="button primary" data-action="bank-import-commit" '+(!draft.confirmAccount||(plan.totals.created&&!draft.confirmCreation)?'disabled':'')+'>Confirmar '+plan.entries.length+' decisão(ões)</button></div></div>';
 }
 const page=Math.min(Math.max(Number(draft.page)||0,0),Math.max(0,Math.ceil(rows.length/BANK_IMPORT_PAGE_SIZE)-1));
 const visible=rows.slice(page*BANK_IMPORT_PAGE_SIZE,(page+1)*BANK_IMPORT_PAGE_SIZE);
 const filters=[['all','Todos',preview.rows.length],['possible_match','Prováveis',preview.totals.possibleMatches],
  ['ambiguous','Revisar',preview.totals.ambiguous],['not_found','Não localizados',preview.totals.unmatched]];
 const cards=visible.map(item=>{
  const record=item.record,info=statusInfo[item.status]||['Revisar','unmatched'];
  const decision=draft.decisions?.[item.index]||{action:'skip',target:''};
  const key=reconciliationRecordKey(record);
  const already=saved.has(key),wasPending=outstanding.has(key);
  const candidate=item.candidates[0];
  const match=candidate?'<div class="gb-import-candidate">Sugestão: '+
   esc(candidate.description|| (candidate.type==='transfer'?'Transferência':'Baixa'))+
   ' · '+dateLabel(candidate.date)+' · '+fmtCents(candidate.amount)+
   (item.candidates.length>1?' · '+item.candidates.length+' candidatos':'')+'</div>':'';
  const actionOptions=[['skip','Sem decisão'],['link','Conciliar com registro'],['create','Criar lançamento baixado'],['ignore','Ignorar'],['pending','Manter pendente']]
    .filter(([action])=>action==='link'?item.candidates.length>0&&item.status!=='possible_duplicate_in_file':
     action==='create'?item.status==='not_found':action!=='pending'||!wasPending)
    .map(([key,label])=>'<option value="'+key+'" '+(decision.action===key?'selected':'')+'>'+label+'</option>').join('');
  const picker=decision.action==='link'&&!already?
   '<label class="gb-import-decision-label">Baixa ou transferência existente<select data-gb-native="true" class="gb-import-select gb-import-target" data-bank-review-target="'+item.index+'" aria-label="Selecionar movimento para conciliação">'+
    '<option value="">Selecione a correspondência</option>'+
    item.candidates.map(c=>'<option value="'+esc(c.type+':'+c.id)+'" '+(choiceValue(decision,'target')===c.type+':'+c.id?'selected':'')+'>'+
     esc((c.type==='transfer'?'Transferência':'Baixa')+' · '+(c.description||'Movimento')+' · '+dateLabel(c.date)+' · '+fmtCents(c.amount))+'</option>').join('')+
   '</select></label>':'';
  const creation=decision.action==='create'&&!already?
   '<div class="gb-import-create-fields">'+
    '<label class="gb-import-decision-label">Categoria obrigatória<select data-gb-native="true" class="gb-import-select" data-bank-create-category="'+item.index+'" aria-label="Categoria do lançamento '+(item.index+1)+'">'+
      '<option value="">Escolha uma categoria</option>'+
      (db.categories||[]).filter(c=>c.type===(record.amount>0?'income':'expense')).map(c=>
       '<option value="'+esc(c.id)+'" '+(decision.categoryId===c.id?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'+
    '<label class="gb-import-decision-label">Descrição do lançamento<input type="text" maxlength="300" class="gb-import-create-description" data-bank-create-description="'+item.index+'" value="'+esc(decision.description??record.description.slice(0,300))+'" aria-label="Descrição do lançamento '+(item.index+1)+'" required></label>'+
    '<p class="gb-import-hint">Será registrado como '+(record.amount>0?'receita recebida':'despesa paga')+' na data do extrato, com baixa na conta selecionada.</p>'+
   '</div>':'';
  return '<article class="gb-import-row"><div class="gb-import-row-head">'+
   '<time datetime="'+record.date+'">'+dateLabel(record.date)+'</time>'+
   '<span class="gb-import-flag gb-import-'+(already?'match':wasPending?'ambiguous':info[1])+'">'+(already?'Já registrado':wasPending?'Pendente · retomar':info[0])+'</span></div>'+
   '<div class="gb-import-row-body"><strong>'+esc(record.description)+'</strong>'+
   '<b class="'+(record.amount>0?'gb-import-positive':'gb-import-negative')+'">'+fmtCents(record.amount)+'</b></div>'+
   (record.externalId?'<small class="gb-import-identifier">Identificador: '+esc(record.externalId)+'</small>':'')+
   match+
   (already?'<p class="gb-import-locked">Movimento presente no histórico desta conta. Não será registrado novamente.</p>':!BANK_IMPORT_WRITES_ENABLED?'':
    '<div class="gb-import-review-controls"><label class="gb-import-decision-label">Decisão do movimento'+
    '<select data-gb-native="true" class="gb-import-select" data-bank-review-index="'+item.index+'" aria-label="Decisão para movimento '+(item.index+1)+'">'+
    actionOptions+'</select></label>'+picker+creation+'</div>')+
   '</article>';
 }).join('');
 return head+
  '<div class="gb-import-step"><span class="gb-import-step-number">02</span><span>Prévia da leitura</span></div>'+
  '<div class="gb-import-file"><span>'+icon('titles')+' <strong>'+esc(draft.filename||'Extrato selecionado')+'</strong> · '+esc(preview.format.toUpperCase())+'</span>'+
   (draft.csvMapping?'<button type="button" class="gb-import-text-button" data-action="bank-import-map">Ajustar colunas</button>':'')+
   '<button type="button" class="gb-import-text-button" data-action="bank-import-reset">Trocar arquivo</button></div>'+
  (draft.accountHint?'<p class="gb-import-hint">Conta indicada pelo arquivo (oculta): '+esc(draft.accountHint)+'</p>':'')+
  '<div class="gb-import-summary-grid" aria-label="Resumo do extrato">'+
   summary('Créditos',money(preview.totals.credits),'income')+
   summary('Débitos',money(preview.totals.debits),'expense')+
   summary('Movimentos',String(preview.rows.length))+
   summary('Possíveis vínculos',String(preview.totals.possibleMatches))+'</div>'+
  comparison+
  '<div class="gb-import-step"><span class="gb-import-step-number">04</span><span>Revisar movimentações</span></div>'+
  '<div class="gb-import-filters" role="group" aria-label="Filtrar movimentos importados">'+
   filters.map(([key,label,count])=>'<button type="button" data-action="bank-import-filter" data-value="'+key+
    '" aria-pressed="'+((draft.filter||'all')===key)+'" class="'+((draft.filter||'all')===key?'active':'')+'">'+label+' <span>'+count+'</span></button>').join('')+
  '</div>'+
  '<div class="gb-import-records" aria-live="polite">'+(cards||'<div class="gb-import-no-items">Nenhum movimento neste filtro.</div>')+'</div>'+
  (rows.length>BANK_IMPORT_PAGE_SIZE?'<div class="gb-import-pager"><button type="button" data-action="bank-import-prev" '+(page===0?'disabled':'')+'>Anterior</button>'+
   '<span>Página '+(page+1)+' de '+Math.ceil(rows.length/BANK_IMPORT_PAGE_SIZE)+'</span>'+
   '<button type="button" data-action="bank-import-next" '+(page===Math.ceil(rows.length/BANK_IMPORT_PAGE_SIZE)-1?'disabled':'')+'>Próxima</button></div>':'')+
  (draft.error?'<p class="gb-import-error" role="alert">'+esc(draft.error)+'</p>':'')+
  '<div class="gb-import-privacy">'+icon('shield')+
   '<p>'+(BANK_IMPORT_WRITES_ENABLED?'As sugestões não são aprovadas automaticamente. Criar um lançamento exige revisão e confirmação explícita.':'As correspondências são apenas sugestões. Esta prévia não cria receitas, despesas ou baixas.')+'</p></div>'+
  (BANK_IMPORT_WRITES_ENABLED?
   '<div class="gb-import-footer"><span><strong>'+choiceCount(draft)+'</strong> decisão(ões) selecionada(s)</span>'+
   '<button type="button" class="button primary" data-action="bank-import-review" '+(choiceCount(draft)?'':'disabled')+'>Revisar decisões</button></div>':
   '<div class="gb-import-privacy" role="status">'+icon('shield')+'<p><strong>Liberação segura:</strong> esta versão permite apenas visualizar e comparar o extrato. Conciliar, criar títulos, baixar e reverter por importação permanecem desativados até a homologação.</p></div>'+
   '<div class="gb-import-footer"><span>Nenhum dado financeiro foi alterado.</span><button type="button" class="button" data-action="bank-import-close">Fechar prévia</button></div>')+'</div>';
}
export function bankImportHistoryMarkup(db,accountId){
 const account=db?.accounts?.find(a=>a.id===accountId);
 if(!account)return '<p class="muted">Conta não localizada.</p>';
 const batches=bankImportHistory(db,accountId);
 return '<div class="gb-import-history"><p class="gb-import-hint">Histórico de '+esc(account.name)+'. Para retomar pendências, importe novamente o extrato e escolha outra decisão. Reverter vínculos não altera saldos; lotes com lançamentos criados podem estornar seus títulos e baixas apenas se permanecerem intactos.</p>'+
 (batches.length?batches.map(b=>{
  const linked=b.entries.filter(e=>e.action==='link').length;
  const ignored=b.entries.filter(e=>e.action==='ignore').length;
  const pending=b.entries.filter(e=>e.action==='pending'&&!e.resolvedByBatchId).length;
  const resolved=b.entries.filter(e=>e.action==='pending'&&e.resolvedByBatchId).length;
  const created=b.entries.filter(e=>e.action==='create').length;
  const reverted=b.status==='reverted';
  return '<section class="gb-import-history-row"><div class="gb-import-row-head"><strong>'+
   esc(new Date(b.createdAt).toLocaleDateString('pt-BR'))+' · '+esc(b.format.toUpperCase())+'</strong>'+
   '<span class="gb-import-flag">'+(reverted?'Revertido':'Confirmado')+'</span></div>'+
   '<p>'+b.entries.length+' movimentos · '+linked+' vinculados · '+created+' criados · '+ignored+' ignorados · '+pending+' pendentes · '+resolved+' retomados</p>'+
   (reverted?'<small>Revertido em '+esc(new Date(b.revertedAt).toLocaleDateString('pt-BR'))+'</small>':
    (BANK_IMPORT_WRITES_ENABLED?'<button type="button" class="button" data-action="bank-import-undo" data-id="'+esc(b.id)+'">'+(created?'Reverter lote e lançamentos criados':'Reverter vínculos deste lote')+'</button>':'<small>Reversão pelo importador indisponível nesta liberação.</small>'))+
   '</section>';
 }).join(''):'<p class="gb-import-no-items">Nenhuma conciliação registrada para esta conta.</p>')+
 '</div>';
}
