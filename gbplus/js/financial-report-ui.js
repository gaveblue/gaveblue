// GB+ 3.0.7 — revisão em desktop; importação nunca grava sem confirmação explícita.
import {money,dateLabel} from './domain.js?v=20261105-72';
import {esc,icon} from './ui.js?v=20261105-72';
import {REPORT_KINDS,reportDuplicates,reportTotals,brlCents} from './financial-report-core.js?v=20261110-307';
const nfmt=n=>new Intl.NumberFormat('pt-BR').format(n);
export function reportImportMarkup(db,draft){
 const kind=draft.kind;
 const name=REPORT_KINDS[kind]||'Relatórios financeiros';
 const tags=Object.entries(REPORT_KINDS).map(([key,label])=>
  '<button class="gb-fin-tab '+(kind===key?'active':'')+'" type="button" data-action="financial-import-kind" data-kind="'+key+'" aria-pressed="'+(kind===key?'true':'false')+'">'+esc(label)+'</button>').join('');
 const header='<div id="gb-report-workspace" class="gb-fin-import"><div class="gb-fin-import-heading">'+
  '<div><span class="gb-fin-import-kicker">Importação assistida · Computador</span>'+
  '<h3>Importação de relatórios</h3><p>Leitura local de títulos. Confira tudo antes de incluir no financeiro.</p></div>'+
  '<span class="gb-fin-import-icon">'+icon('upload')+'</span></div>'+
  '<div class="gb-fin-tabs" role="group" aria-label="Tipo de relatório">'+tags+'</div>'+
  '<div class="gb-fin-source"><strong>'+esc(name)+'</strong><span>'+
  (kind==='receivable'?'Previsto a receber · não cria baixa':kind==='payable'?'Contas a pagar · respeita situação PAGO / A VENCER / VENCE HOJE':
    'Liquidações bancárias reais · baixa a pedido do cedente fica excluída')+
  '</span></div>';
 const error=draft.error?'<div class="gb-fin-message error" role="alert">'+esc(draft.error)+'</div>':'';
 const loading=draft.loading?'<div class="gb-fin-message working" role="status">'+icon('clock')+' '+esc(draft.loading)+'</div>':'';
 const hint='<p class="gb-fin-privacy">'+icon('shield')+' Os arquivos são analisados neste navegador. PDF requer conexão para carregar bibliotecas de leitura; a gravação de títulos só acontece após sua confirmação.</p>';
 if(!draft.parsed)return header+
  '<label class="gb-fin-upload" for="gb-fin-report-file">'+icon('upload')+
   '<strong>Selecionar relatório PDF, Excel ou CSV</strong>'+
   '<span>PDF digitalizado requer OCR e conferência manual. Até 12 MB.</span></label>'+
  '<input id="gb-fin-report-file" type="file" accept=".pdf,.xlsx,.csv,.txt,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" '+(draft.loading?'disabled':'')+'>'+
  '<div class="gb-fin-report-guidance">'+
   (kind==='received'?'<strong>Sicoob: atenção às ocorrências</strong><p>58, 68, 212 e 215 são recebimentos liquidados. A ocorrência 82 (baixa a pedido do cedente) não entra como recebimento.</p>':
    kind==='receivable'?'<strong>Relatório Controle Financeiro</strong><p>Quando o PDF é uma imagem, usamos OCR. Confira especialmente os nomes e os valores, ou exporte Excel/CSV para maior precisão.</p>':
    '<strong>Planilha do contas a pagar</strong><p>Reconhece Financeiro, Nota, Parceiro, Vencimento, Data Pagamento, Valor e Situação. Pagamentos já realizados precisam de conta bancária confirmada.</p>')+
  '</div>'+loading+error+hint+'</div>';
 const decorated=reportDuplicates(db,draft.parsed.records);
 const total=reportTotals(decorated),selected=new Set(draft.selected||[]);
 const picked=decorated.filter((r,i)=>selected.has(i)&&!r.duplicate);
 const hasPayments=picked.some(r=>r.status==='paid');
 const chosen=reportTotals(picked);
 const cats=(db.categories||[]).filter(c=>c.type===(kind==='payable'?'expense':'income'));
 const accounts=(db.accounts||[]).filter(a=>a.active!==false);
 const cat=catOptions(cats,draft.categoryId);
 const bank=accountOptions(accounts,draft.accountId);
 const excluded=draft.parsed.excluded||[];
 const skippedBank=excluded.filter(r=>String(r.reason).includes('82')).length;
 const duplicates=decorated.filter(r=>r.duplicate).length;
 const page=Math.max(0,Math.min(draft.page||0,Math.max(0,Math.ceil(decorated.length/80)-1)));
 const viewed=decorated.slice(page*80,(page+1)*80);
 const editable=!!draft.parsed.needsOcrReview;
 const body=viewed.map((r,j)=>{
  const i=page*80+j,chk=selected.has(i),readonly=r.duplicate;
  const label=r.duplicate?'<span class="gb-fin-flag warn">'+esc(r.duplicateReason)+'</span>':
   r.status==='paid'?'<span class="gb-fin-flag received">'+(kind==='payable'?'Pago':'Recebido')+'</span>':
   '<span class="gb-fin-flag open">Em aberto</span>';
  const field=(type,name,value)=>{
   const val=type==='date'?value:type==='money'?(value/100).toFixed(2):value;
   return '<input class="gb-fin-edit-input" data-fin-report-edit="'+name+'" data-index="'+i+'" type="'+(type==='money'?'number':type)+'" '+
    (type==='money'?'step="0.01" min="0.01"':'')+' value="'+esc(val||'')+'" aria-label="'+esc(name)+' título '+(i+1)+'" '+(readonly?'disabled':'')+'>';
  };
  return '<tr class="'+(chk?'selected':'')+'">'+
   '<td><input type="checkbox" data-fin-report-select="'+i+'" '+(chk?'checked ':'')+(readonly?'disabled ':'')+'aria-label="Selecionar linha '+(i+1)+'"></td>'+
   '<td><strong>'+esc(r.reference||r.invoice||String(i+1))+'</strong><small>'+esc(r.invoice?'NF '+r.invoice:'')+'</small></td>'+
   '<td>'+(editable?field('text','partner',r.partner):esc(r.partner))+'</td>'+
   '<td>'+(editable?field('date','due',r.due):dateLabel(r.due))+'</td>'+
   '<td>'+(editable?field('money','amount',r.amount):'<strong>'+money(r.amount)+'</strong>')+'</td>'+
   '<td>'+label+(r.status==='paid'?'<small>'+dateLabel(r.paymentDate)+'</small>':'')+'</td>'+
   '</tr>';
 }).join('');
 const paidLabel=kind==='payable'?'Pagos informados':'Liquidados informados';
 let additional='';
 if(excluded.length){
  additional='<details class="gb-fin-excluded"><summary>'+excluded.length+' registros separados (não importados)'+
   (skippedBank?' · '+skippedBank+' baixas bancárias não financeiras':'')+'</summary>'+
   '<p>Linhas excluídas do saldo. Leia o motivo antes de conferir o relatório.</p>'+
   '<div class="gb-fin-excluded-list">'+excluded.slice(0,60).map(e=>'<p><b>'+esc(e.partner||e.reference||'Linha')+'</b> · '+esc(e.amount||'')+
   ' <span>'+esc(e.reason||'Excluído')+'</span></p>').join('')+'</div></details>';
 }
 const warning=(draft.parsed.warnings||[]).map(t=>'<div class="gb-fin-message warn">'+icon('info')+' '+esc(t)+'</div>').join('');
 return header+
  '<div class="gb-fin-file-name">'+icon('check')+' '+esc(draft.fileName||'Relatório')+'<button type="button" class="button" data-action="financial-import-reset">Trocar arquivo</button></div>'+
  '<div class="gb-fin-summary-grid">'+
   summary('Títulos identificados',nfmt(total.count))+
   summary('Valor do relatório',money(total.total))+
   summary(paidLabel,nfmt(total.paid))+
   summary('Possíveis duplicados',nfmt(duplicates))+
   summary('Selecionados',nfmt(chosen.count))+
   summary('Valor a importar',money(chosen.total))+
  '</div>'+warning+error+loading+
  '<div class="gb-fin-list-header"><strong>Conferência dos títulos</strong><span>'+
  '<button class="button" type="button" data-action="financial-import-all">Selecionar novos</button>'+
  '<button class="button" type="button" data-action="financial-import-clear">Limpar</button></span></div>'+
  '<div class="gb-fin-table-scroll"><table><thead><tr><th></th><th>Financeiro / Nota</th><th>Parceiro</th><th>Vencimento</th><th>Valor</th><th>Situação</th></tr></thead>'+
  '<tbody>'+body+'</tbody></table></div>'+
  (decorated.length>80?'<div class="gb-fin-pagination"><button type="button" data-action="financial-import-prev" '+(page===0?'disabled':'')+'>Anterior</button>'+
   '<span>Página '+(page+1)+' de '+Math.ceil(decorated.length/80)+'</span>'+
   '<button type="button" data-action="financial-import-next" '+(page>=Math.ceil(decorated.length/80)-1?'disabled':'')+'>Próxima</button></div>':'')+
  additional+
  '<div class="gb-fin-confirm-grid">'+
   '<label>Categoria para os títulos<select id="gb-fin-category" data-gb-native="true"><option value="">Selecione</option>'+cat+'</select></label>'+
   '<label>Conta para baixas reais<select id="gb-fin-account" data-gb-native="true"><option value="">Não selecionada</option>'+bank+'</select>'+
   '<small>'+(hasPayments?'Obrigatória: há títulos pagos/recebidos selecionados.':'Necessária apenas para registros com baixa.')+'</small></label></div>'+
  '<label class="gb-fin-checkbox"><input type="checkbox" id="gb-fin-create-partners" '+(draft.createPartners?'checked':'')+'> Criar cadastro básico de parceiros ainda não existentes</label>'+
  (editable?'<label class="gb-fin-checkbox"><input type="checkbox" id="gb-fin-ocr-review" '+(draft.ocrReviewed?'checked':'')+'> Conferi individualmente todos os campos reconhecidos pelo OCR</label>':'')+
  '<label class="gb-fin-checkbox important"><input type="checkbox" id="gb-fin-confirm" '+(draft.confirmed?'checked':'')+
   '> Confirmo que revisei os documentos, duplicidades e situações. Sei que títulos liquidados/pagos alteram o saldo da conta selecionada.</label>'+
  '<div class="gb-fin-actions"><button type="button" class="button primary" data-action="financial-import-commit" '+
   (!picked.length||!draft.categoryId||(hasPayments&&!draft.accountId)||!draft.confirmed||(editable&&!draft.ocrReviewed)||draft.loading?'disabled':'')+'>'+
   icon('check')+' Importar '+picked.length+' título(s) no GB+</button></div>'+
  hint+'</div>';
}
const summary=(label,value)=>'<div class="gb-fin-summary"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>';
const catOptions=(categories,selected)=>categories.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===selected?'selected':'')+'>'+esc(c.name)+'</option>').join('');
const accountOptions=(accounts,selected)=>accounts.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===selected?'selected':'')+'>'+esc(c.name)+'</option>').join('');
