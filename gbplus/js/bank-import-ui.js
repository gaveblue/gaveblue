// GB+ 2.5.0 — read-only import screen. Never saves files or financial records.
import {money,dateLabel} from './domain.js?v=20261105-72';
import {esc,icon} from './ui.js?v=20261105-72';

export const BANK_IMPORT_PAGE_SIZE=20;
const statusInfo={
 possible_match:['Possível vínculo','match'],
 ambiguous:['Verificar candidatos','ambiguous'],
 possible_duplicate_in_file:['Possível repetição','ambiguous'],
 not_found:['Não localizado','unmatched']
};
const summary=(label,value,modifier='')=>
 '<div class="gb-import-summary '+modifier+'"><span>'+label+'</span><strong>'+value+'</strong></div>';
const fmtCents=amount=>(amount>0?'+ ':'− ')+money(Math.abs(amount));
const filtered=(preview,filter)=>filter==='all'?preview.rows:
 preview.rows.filter(row=>filter==='ambiguous'
  ?row.status==='ambiguous'||row.status==='possible_duplicate_in_file'
  :row.status===filter);
export function bankImportMarkup(db,draft){
 const accounts=(db?.accounts||[]).filter(account=>account.active!==false);
 if(!accounts.length)return '<div class="gb-import-empty"><h3>Cadastre uma conta financeira antes de importar</h3><p>A leitura de um extrato sempre precisa de uma conta do GB+ selecionada. Nenhum dado será alterado.</p></div>';
 const accountId=accounts.some(account=>account.id===draft?.accountId)?draft.accountId:accounts[0].id;
 const accountSelect='<label class="gb-import-label" for="gb-import-account">Conta que será conferida</label>'+
  '<select id="gb-import-account" class="gb-import-select" data-gb-native="true" aria-label="Selecionar conta financeira">'+
  accounts.map(account=>'<option value="'+esc(account.id)+'" '+(account.id===accountId?'selected':'')+'>'+esc(account.name)+'</option>').join('')+'</select>';
 const head='<div id="gb-import-workspace" class="gb-import-workspace">'+
  '<div class="gb-import-intro"><div class="gb-import-symbol">'+icon('wallet')+'</div><div><strong>Conferência de extrato bancário</strong>'+
  '<p>Leia seu arquivo e compare os movimentos com os lançamentos do GB+.</p></div></div>'+
  '<div class="gb-import-step"><span class="gb-import-step-number">01</span><span>Conta bancária</span></div>'+accountSelect;
 const end='</div>';
 if(!draft?.preview){
  return head+
   '<div class="gb-import-step"><span class="gb-import-step-number">02</span><span>Arquivo do banco</span></div>'+
   '<label class="gb-import-drop" for="gb-import-file">'+icon('upload')+
    '<strong>Selecionar extrato OFX ou CSV</strong>'+
    '<small>Leitura local · até 8 MB · máximo de 20.000 movimentos</small></label>'+
   '<input class="gb-import-file-input" id="gb-import-file" type="file" accept=".ofx,.csv,.txt,text/csv" aria-label="Selecionar arquivo OFX ou CSV">'+
   (draft?.error?'<p class="gb-import-error" role="alert">'+esc(draft.error)+'</p>':'')+
   '<div class="gb-import-privacy">'+icon('shield')+
    '<p>Somente visualização. O arquivo não é enviado à IA nem ao servidor. Nenhuma receita, despesa, baixa ou saldo será alterado.</p></div>'+
   end;
 }
 const preview=draft.preview,rows=filtered(preview,draft.filter||'all');
 const page=Math.min(Math.max(Number(draft.page)||0,0),Math.max(0,Math.ceil(rows.length/BANK_IMPORT_PAGE_SIZE)-1));
 const visible=rows.slice(page*BANK_IMPORT_PAGE_SIZE,(page+1)*BANK_IMPORT_PAGE_SIZE);
 const filters=[['all','Todos',preview.rows.length],['possible_match','Prováveis',preview.totals.possibleMatches],
  ['ambiguous','Revisar',preview.totals.ambiguous],['not_found','Não localizados',preview.totals.unmatched]];
 const cards=visible.map(item=>{
  const record=item.record,info=statusInfo[item.status]||['Revisar','unmatched'];
  const candidate=item.candidates[0];
  const match=candidate?'<div class="gb-import-candidate">Possível correspondência: '+
   esc(candidate.description|| (candidate.type==='transfer'?'Transferência':'Baixa'))+
   ' · '+dateLabel(candidate.date)+' · '+fmtCents(candidate.amount)+
   (item.candidates.length>1?' · '+item.candidates.length+' candidatos':'')+'</div>':'';
  return '<article class="gb-import-row"><div class="gb-import-row-head">'+
   '<time datetime="'+record.date+'">'+dateLabel(record.date)+'</time>'+
   '<span class="gb-import-flag gb-import-'+info[1]+'">'+info[0]+'</span></div>'+
   '<div class="gb-import-row-body"><strong>'+esc(record.description)+'</strong>'+
   '<b class="'+(record.amount>0?'gb-import-positive':'gb-import-negative')+'">'+fmtCents(record.amount)+'</b></div>'+
   (record.externalId?'<small class="gb-import-identifier">Identificador: '+esc(record.externalId)+'</small>':'')+
   match+'</article>';
 }).join('');
 return head+
  '<div class="gb-import-step"><span class="gb-import-step-number">02</span><span>Prévia da leitura</span></div>'+
  '<div class="gb-import-file"><span>'+icon('titles')+' <strong>'+esc(draft.filename||'Extrato selecionado')+'</strong> · '+esc(preview.format.toUpperCase())+'</span>'+
   '<button type="button" class="gb-import-text-button" data-action="bank-import-reset">Trocar arquivo</button></div>'+
  (draft.accountHint?'<p class="gb-import-hint">Conta indicada pelo arquivo (oculta): '+esc(draft.accountHint)+'</p>':'')+
  '<div class="gb-import-summary-grid" aria-label="Resumo do extrato">'+
   summary('Créditos',money(preview.totals.credits),'income')+
   summary('Débitos',money(preview.totals.debits),'expense')+
   summary('Movimentos',String(preview.rows.length))+
   summary('Possíveis vínculos',String(preview.totals.possibleMatches))+'</div>'+
  '<div class="gb-import-step"><span class="gb-import-step-number">03</span><span>Movimentações encontradas</span></div>'+
  '<div class="gb-import-filters" role="group" aria-label="Filtrar movimentos importados">'+
   filters.map(([key,label,count])=>'<button type="button" data-action="bank-import-filter" data-value="'+key+
    '" aria-pressed="'+((draft.filter||'all')===key)+'" class="'+((draft.filter||'all')===key?'active':'')+'">'+label+' <span>'+count+'</span></button>').join('')+
  '</div>'+
  '<div class="gb-import-records" aria-live="polite">'+(cards||'<div class="gb-import-no-items">Nenhum movimento neste filtro.</div>')+'</div>'+
  (rows.length>BANK_IMPORT_PAGE_SIZE?'<div class="gb-import-pager"><button type="button" data-action="bank-import-prev" '+(page===0?'disabled':'')+'>Anterior</button>'+
   '<span>Página '+(page+1)+' de '+Math.ceil(rows.length/BANK_IMPORT_PAGE_SIZE)+'</span>'+
   '<button type="button" data-action="bank-import-next" '+(page===Math.ceil(rows.length/BANK_IMPORT_PAGE_SIZE)-1?'disabled':'')+'>Próxima</button></div>':'')+
  '<div class="gb-import-privacy">'+icon('shield')+
   '<p>Esta é uma prévia de leitura, não uma conciliação concluída. Correspondências são apenas sugestões. Na próxima etapa, você poderá revisar e aprovar cada vínculo ou lançamento.</p></div>'+
  '<div class="gb-import-footer"><span>Não foram feitas alterações financeiras.</span>'+
   '<button type="button" class="button" data-action="bank-import-close">Concluir prévia</button></div>'+
  end;
}
