// GB+ 3.0.8 — telas de importação Sankhya (desktop). Nenhuma gravação na prévia.
import {money,dateLabel} from './domain.js?v=20261105-72';
import {esc,icon} from './ui.js?v=20261105-72';
import {partnerDecisions,movementDecisions,erpIsPending,erpIsSettled} from './sankhya-import-core.js?v=20261110-309';
const fmt=n=>new Intl.NumberFormat('pt-BR').format(n||0);
const box=(text,value)=>'<div class="gb-erp-summary"><span>'+esc(text)+'</span><strong>'+esc(value)+'</strong></div>';
const label=(text,status)=>'<span class="gb-erp-status '+esc(status)+'">'+esc(text)+'</span>';
const option=(id,name,selected)=>'<option value="'+esc(id)+'" '+(id===selected?'selected':'')+'>'+esc(name)+'</option>';
export function erpImportMarkup(db,draft,now){
 const isPartners=draft.kind==='partners',records=draft.parsed?.rows||[];
 const assessed=draft.parsed?(isPartners?partnerDecisions(db,records):movementDecisions(db,records,now)):[];
 const selected=new Set(draft.selected||[]);
 const picked=assessed.filter((r,i)=>selected.has(i)&&!['blocked','conflict','unchanged'].includes(r.decision));
 const types=[['partners','Cadastro de parceiros','Cód. Parceiro e dados cadastrais'],['movements','Movimentação financeira','Receita, despesa e parcelas por Nro Único']];
 let html='<div id="gb-erp-import-workspace" class="gb-erp-import">'+
  '<div class="gb-erp-heading"><div><small>IMPORTAÇÃO SANKHYA · PC</small><h3>Importar dados financeiros</h3>'+
  '<p>Importe os parceiros primeiro; depois, os títulos de movimentação. Não há gravação sem confirmação.</p></div>'+icon('database')+'</div>'+
  '<div class="gb-erp-switch" role="group" aria-label="Tipo de arquivo">'+types.map(([k,name,desc])=>
   '<button type="button" data-action="erp-import-kind" data-kind="'+k+'" class="'+(isPartners=== (k==='partners')?'active':'')+'"><strong>'+name+'</strong><small>'+desc+'</small></button>').join('')+'</div>'+
  '<div class="gb-erp-note">'+icon('shield')+' Os arquivos são lidos no navegador. Códigos originais e Nro Único evitam repetições em novas importações.</div>';
 if(!draft.parsed){
  html+='<label class="gb-erp-drop" for="gb-erp-file">'+icon('upload')+
   '<strong>Selecionar '+(isPartners?'Parceiros.xlsx':'Movimentacao_Financeira.xlsx')+'</strong>'+
   '<span>Planilha XLSX ou CSV com cabeçalhos do Sankhya. Limite: 12 MB.</span></label>'+
   '<input id="gb-erp-file" type="file" accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" '+(draft.loading?'disabled':'')+'>'+
   '<p class="gb-erp-hint">'+(isPartners?'Importa código, razão social, nome fantasia, documento, contato, endereço, situação e atributos da origem.':
   'Reconhece Receita/Despesa, código do parceiro, Nro Único, nota, parcelas, vencimento, data/valor de baixa e conta usada.')+'</p>'+
   (draft.loading?'<p class="gb-erp-progress" role="status">'+esc(draft.loading)+'</p>':'')+
   (draft.error?'<p class="gb-erp-error" role="alert">'+esc(draft.error)+'</p>':'');
  return html+'</div>';
 }
 const counted=name=>assessed.filter(r=>r.decision===name).length;
 const value=isPartners?fmt(records.length):money(records.reduce((s,r)=>s+r.principal,0));
 const open=assessed.filter(r=>r.kind==='income').length,expenses=assessed.filter(r=>r.kind==='expense').length;
 html+='<div class="gb-erp-filename">'+icon('check')+' <b>'+esc(draft.fileName)+'</b><button class="button" data-action="erp-import-reset">Trocar arquivo</button></div>'+
  '<div class="gb-erp-summary-grid">'+box('Linhas válidas',fmt(records.length))+
  box(isPartners?'Novos parceiros':'Receitas',isPartners?fmt(counted('create')):fmt(open))+
  box(isPartners?'Cadastros existentes':'Despesas',isPartners?fmt(counted('update')+counted('match')):fmt(expenses))+
  box('Conflitos',fmt(counted(isPartners?'conflict':'blocked')))+
  box('Selecionados',fmt(picked.length))+
  box(isPartners?'Códigos no cadastro':'Valor nominal',value)+'</div>';
 if(!isPartners){
  html+='<div class="gb-erp-summary-grid small">'+
   box('Novos lançamentos',fmt(counted('create')))+
   box('Baixas posteriores',fmt(counted('settle')))+
   box('Já importados',fmt(counted('unchanged')))+'</div>'+
   '<div class="gb-erp-summary-grid small">'+box('Pendentes de baixa',fmt(assessed.filter(r=>erpIsPending(r,now)).length))+
   box('Baixados no arquivo',fmt(assessed.filter(r=>erpIsSettled(r,now)).length))+
   box('Novos pendentes',fmt(assessed.filter(r=>r.decision==='create'&&erpIsPending(r,now)).length))+'</div>';
 }
 const ignored=draft.parsed.ignored||[];
 if(ignored.length){
  html+='<details class="gb-erp-ignored"><summary>'+ignored.length+' linha(s) inválida(s) ou incompleta(s) — não serão importadas</summary>'+
   '<div>'+ignored.slice(0,40).map(e=>'<p>'+esc(e.unique||e.code||'?')+' · '+esc(e.reason)+'</p>').join('')+'</div></details>';
 }
 if(draft.error)html+='<p class="gb-erp-error" role="alert">'+esc(draft.error)+'</p>';
 const btn=(action,text)=>'<button type="button" class="button" data-action="'+action+'">'+esc(text)+'</button>';
 html+='<div class="gb-erp-row-actions"><strong>Prévia para revisão</strong><div>'+
  btn('erp-import-select-new','Selecionar novos')+
  (isPartners?btn('erp-import-select-updates','Selecionar atualizações'):
   btn('erp-import-select-pending','Selecionar somente pendentes')+
   btn('erp-import-select-settlements','Selecionar baixas'))+
  btn('erp-import-clear','Limpar')+'</div></div>';
 const viewFilter=isPartners?'all':draft.viewFilter||'all';
 if(!isPartners)html+='<label class="gb-erp-list-filter"><span>Mostrar</span>'+
  '<select id="gb-erp-view-filter" data-gb-native="true">'+
  [['all','Todos os títulos'],['pending','Pendentes de baixa'],['settled','Baixados'],['new','Somente novos'],['blocked','Conflitos'],['unchanged','Já importados']]
   .map(([value,name])=>'<option value="'+value+'" '+(viewFilter===value?'selected':'')+'>'+name+'</option>').join('')+
  '</select></label>';
 const indexed=assessed.map((r,i)=>({...r,erpOriginalIndex:i})).filter(r=>{
  if(viewFilter==='pending')return erpIsPending(r,now);
  if(viewFilter==='settled')return erpIsSettled(r,now);
  if(viewFilter==='new')return r.decision==='create';
  if(viewFilter==='blocked')return r.decision==='blocked';
  if(viewFilter==='unchanged')return r.decision==='unchanged';
  return true;
 });
 const page=Math.min(Math.max(0,Number(draft.page)||0),Math.max(0,Math.ceil(indexed.length/70)-1));
 const part=indexed.slice(page*70,(page+1)*70);
 html+='<div class="gb-erp-table-wrap"><table><thead><tr><th></th>'+
  (isPartners?'<th>Código</th><th>Razão social / Nome</th><th>CPF/CNPJ</th><th>Situação</th><th>Ação</th>':
   '<th>Nro Único</th><th>Nota / Parcela</th><th>Parceiro (código)</th><th>Vencimento</th><th>Valor</th><th>Tipo</th><th>Resultado</th>')+
  '</tr></thead><tbody>';
 for(let j=0;j<part.length;j++){
  const r=part[j],i=r.erpOriginalIndex,blocked=['blocked','conflict','unchanged'].includes(r.decision);
  const statusText={create:'Novo',update:'Atualizar',match:'Associar cadastro',settle:'Baixar existente',unchanged:'Sem mudança',blocked:'Conflito',conflict:'Conflito'}[r.decision]||'Conferir';
  const chk='<td><input type="checkbox" data-erp-pick="'+i+'" '+(selected.has(i)?'checked ':'')+
   (blocked?'disabled ':'')+'aria-label="Selecionar linha '+(i+1)+'"></td>';
  if(isPartners){
   html+='<tr>'+chk+'<td><strong>'+esc(r.code)+'</strong></td>'+
    '<td>'+esc(r.legalName||r.name)+(r.name!==r.legalName?'<small>'+esc(r.name)+'</small>':'')+'</td>'+
    '<td>'+esc(r.document)+'</td><td>'+label(r.active?'Ativo':'Inativo',r.active?'open':'warn')+'</td>'+
    '<td>'+label(statusText,r.decision)+(r.reason?'<small>'+esc(r.reason)+'</small>':'')+'</td></tr>';
  }else{
   html+='<tr>'+chk+'<td><strong>'+esc(r.unique)+'</strong></td>'+
    '<td>'+esc(r.invoice||'—')+(r.count>1?'<small>Parcela '+r.sequence+' de '+r.count+'</small>':'')+'</td>'+
    '<td>'+esc(r.partnerName||db.partners.find(p=>p.sankhyaCode===r.partnerCode)?.name||'Não vinculado')+
    '<small>Cód. '+esc(r.partnerCode)+'</small></td>'+
    '<td>'+dateLabel(r.due)+(r.paidDate?'<small>Baixa: '+dateLabel(r.paidDate)+(r.future?' · futura':'')+'</small>':'')+'</td>'+
    '<td><strong>'+money(r.principal)+'</strong>'+(r.paidAmount&&r.paidAmount!==r.principal?'<small>Baixa '+money(r.paidAmount)+'</small>':'')+'</td>'+
    '<td>'+label(r.kind==='income'?'Receita':'Despesa',r.kind)+
    '<small>'+(erpIsPending(r,now)?r.paidDate?'Baixa futura · pendente':'Sem baixa · pendente':'Baixado')+'</small></td>'+
    '<td>'+label(statusText,r.decision)+(r.reason?'<small>'+esc(r.reason)+'</small>':'')+'</td></tr>';
  }
 }
 html+='</tbody></table></div>';
 if(indexed.length>70)html+='<div class="gb-erp-pages">'+btn('erp-import-prev','Anterior')+
  '<span>Página '+(page+1)+' / '+Math.ceil(indexed.length/70)+'</span>'+btn('erp-import-next','Próxima')+'</div>';
 if(!isPartners){
  const categories=db.categories||[],active=db.accounts.filter(a=>a.active);
  const selectedRows=picked;
  const requires=new Set(selectedRows.filter(r=>['create','settle'].includes(r.decision)&&r.paidDate&&!r.future).map(r=>r.bankCode));
  const hasNew=selectedRows.some(r=>r.decision==='create');
  html+='<div class="gb-erp-config"><h4>Classificação e origem</h4>'+
   '<p>As receitas entram por padrão em <b>Outras receitas</b> e as despesas em <b>Outras despesas</b>. Todos os títulos ficam identificados como <b>Via importação</b> independentemente da categoria; você pode alterá-la depois.</p><div class="gb-erp-fields">'+
   ['income','expense'].map(k=>'<label>Categoria para '+(k==='income'?'receitas':'despesas')+
    '<select data-erp-category="'+k+'" data-gb-native="true" '+(!hasNew?'disabled':'')+'>'+
    '<option value="">Selecione</option>'+
    categories.filter(c=>c.type===k).map(c=>option(c.id,c.name,draft.categories?.[k])).join('')+'</select></label>').join('')+'</div>';
  const missing=db.partners.filter(p=>p.sankhyaCode).length===0;
  if(missing)html+='<p class="gb-erp-error">Nenhum parceiro Sankhya está cadastrado. Importe Parceiros.xlsx primeiro.</p>';
  const accounts=draft.parsed.accounts.filter(a=>requires.has(a.code));
  if(accounts.length){
   html+='<h4>Associar contas das baixas ao GB+</h4>'+
    '<p>Associe cada código de conta do Sankhya a uma conta financeira ativa. Contas sem informação exigem escolha manual.</p>'+
    '<div class="gb-erp-fields">'+accounts.map(a=>'<label>'+esc(a.label)+' · '+a.count+' movimentação(ões)'+
     '<select data-erp-account="'+esc(a.code)+'" data-gb-native="true"><option value="">Selecionar conta financeira</option>'+
     active.map(x=>option(x.id,x.name,draft.accounts?.[a.code])).join('')+'</select></label>').join('')+'</div>';
  }
  html+='</div>';
 }
 const selectedMov=isPartners?false:picked.some(r=>['create','settle'].includes(r.decision)&&r.paidDate&&!r.future);
 html+='<label class="gb-erp-confirm"><input type="checkbox" id="gb-erp-confirm" '+(draft.confirmed?'checked':'')+'>'+
  ' Conferi os códigos, parcelas, valores, vínculos e eventuais baixas. Autorizo atualizar somente os '+picked.length+' registros selecionados.'+
  (selectedMov?' Compreendo que baixas podem alterar saldos.':'')+'</label>';
 const missingCategory=!isPartners&&picked.some(r=>r.decision==='create'&&!draft.categories?.[r.kind]);
 const missingAccount=!isPartners&&picked.some(r=>['create','settle'].includes(r.decision)&&r.paidDate&&!r.future&&!draft.accounts?.[r.bankCode]);
 html+='<div class="gb-erp-end"><button type="button" class="button primary" data-action="erp-import-commit" '+
  (!picked.length||!draft.confirmed||missingCategory||missingAccount||draft.loading?'disabled':'')+'>'+
  icon('check')+' Confirmar '+picked.length+' registro(s)</button></div>'+
  '<p class="gb-erp-hint">Via importação será mostrado nos lançamentos importados. Nro Único identifica cada título. Nota repetida com parcelas não é duplicidade. Reimportar o mesmo título permite conferir uma baixa nova sem recriar o lançamento.</p>';
 return html+'</div>';
}
