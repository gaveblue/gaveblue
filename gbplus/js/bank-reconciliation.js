// GB+ 2.5.0 — revisão e registro de conciliações (sem criar baixas).
// Toda gravação passa por repository.save, com controle de revisão por usuário.
// Arquivos OFX/CSV nunca são persistidos; somente decisões aprovadas e seus metadados.
export const RECONCILIATION_BATCH_MAX = 200;
export const RECONCILIATION_TOTAL_MAX = 10000;
export const RECONCILIATION_BATCHES_MAX = 100;
const isId = value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value);
const normalized = value=>String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
const validDate = value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'));
const history = db=>Array.isArray(db?.bankImportBatches)?db.bankImportBatches:[];
const isActive = row=>row?.status!=='reverted';
export function reconciliationRecordKey(record){
 if(!record||!validDate(record.date)||!Number.isSafeInteger(record.amount)||record.amount===0||typeof record.description!=='string')throw Error('Movimento de extrato inválido.');
 const externalId=String(record.externalId||'').trim();
 if(externalId) return 'id:'+externalId;
 return 'mov:'+record.date+'|'+record.amount+'|'+normalized(record.description).slice(0,500);
}
export const reconciliationCandidates = row=>
 Array.isArray(row?.candidates)?row.candidates.filter(c=>['payment','transfer'].includes(c.type)&&isId(c.id)):[];
export function knownReconciliationKeys(db,accountId){
 const keys=new Set();
 for(const batch of history(db)){
  if(batch.accountId!==accountId||!isActive(batch))continue;
  for(const row of batch.entries||[])keys.add(row.key);
 }
 return keys;
}
export const bankImportHistory = (db,accountId)=>history(db).filter(b=>b.accountId===accountId).slice().reverse();
export function reviewSelection(preview,decisions,db){
 if(!preview||!Array.isArray(preview.rows))throw Error('Não há extrato para conciliar.');
 if(!db?.accounts?.some(a=>a.id===preview.accountId&&a.active!==false))throw Error('A conta bancária não está ativa.');
 const selection=decisions&&typeof decisions==='object'?decisions:{};
 const savedKeys=knownReconciliationKeys(db,preview.accountId);
 const chosenKeys=new Set(),chosenTargets=new Set(),entries=[];
 const usedTargets=new Set(history(db).filter(isActive).filter(b=>b.accountId===preview.accountId)
  .flatMap(b=>(b.entries||[]).filter(r=>r.action==='link').map(r=>r.targetType+':'+r.targetId)));
 for(const [indexString,choice] of Object.entries(selection)){
  if(!/^\d+$/.test(indexString))throw Error('Índice de decisão inválido.');
  const index=Number(indexString),row=preview.rows[index];
  if(!row||row.index!==index)throw Error('Movimento não encontrado.');
  if(!choice||choice.action==='skip')continue;
  if(!['link','ignore','pending'].includes(choice.action))throw Error('Decisão de conciliação inválida.');
  const key=reconciliationRecordKey(row.record);
  if(savedKeys.has(key))throw Error('Movimento já registrado em uma importação anterior.');
  if(chosenKeys.has(key))throw Error('Movimentos iguais no arquivo precisam ser revisados individualmente em outro processo.');
  chosenKeys.add(key);
  const item={key,date:row.record.date,amount:row.record.amount,
   description:row.record.description.slice(0,300),
   externalId:String(row.record.externalId||'').slice(0,180),action:choice.action};
  if(choice.action==='link'){
   if(row.status==='possible_duplicate_in_file')throw Error('Movimento repetido no arquivo não pode ser conciliado sem investigação.');
   const match=reconciliationCandidates(row).find(c=>c.type+':'+c.id===choice.target);
   if(!match)throw Error('Selecione uma baixa ou transferência válida para '+row.record.description.slice(0,60)+'.');
   if(match.amount!==row.record.amount||!Number.isInteger(match.daysApart)||match.daysApart>3)throw Error('Correspondência incompatível.');
   const target=match.type+':'+match.id;
   if(chosenTargets.has(target)||usedTargets.has(target))throw Error('A mesma baixa ou transferência não pode ser conciliada duas vezes.');
   chosenTargets.add(target);
   item.targetType=match.type;
   item.targetId=match.id;
  }
  entries.push(item);
 }
 if(entries.length>RECONCILIATION_BATCH_MAX)throw Error('Confirme no máximo '+RECONCILIATION_BATCH_MAX+' movimentos por lote.');
 if(!entries.length)throw Error('Selecione ao menos um movimento antes de confirmar.');
 if(history(db).length>=RECONCILIATION_BATCHES_MAX||
   history(db).reduce((sum,b)=>sum+(b.entries||[]).length,0)+entries.length>RECONCILIATION_TOTAL_MAX)
  throw Error('Histórico de conciliações atingiu o limite. Exporte um backup e revise os lotes antigos.');
 return {accountId:preview.accountId,entries,totals:{
  linked:entries.filter(e=>e.action==='link').length,
  ignored:entries.filter(e=>e.action==='ignore').length,
  pending:entries.filter(e=>e.action==='pending').length,
  amountLinked:entries.filter(e=>e.action==='link').reduce((sum,e)=>sum+e.amount,0)
 }};
}
export function applyReconciliationBatch(db,parsed,accountId,decisions,meta){
 // Recompute candidates against the CURRENT database; never trust stale UI data.
 if(!parsed||!Array.isArray(parsed.records)||!meta?.propose||!isId(meta.batchId))throw Error('Dados de conciliação inválidos.');
 const preview=meta.propose(parsed,db,accountId);
 const plan=reviewSelection(preview,decisions,db);
 const batch={id:meta.batchId,accountId,format:parsed.format,createdAt:meta.now||new Date().toISOString(),status:'active',entries:plan.entries};
 if(!['ofx','csv'].includes(batch.format)||!/^\d{4}-\d{2}-\d{2}T/.test(batch.createdAt))throw Error('Lote inválido.');
 if(history(db).some(b=>b.id===batch.id))throw Error('Lote já registrado.');
 db.bankImportBatches=[...history(db),batch];
 return {batch,totals:plan.totals};
}
export function undoReconciliationBatch(db,batchId,now=new Date().toISOString()){
 const batch=history(db).find(b=>b.id===batchId);
 if(!batch||batch.status!=='active')throw Error('Lote não encontrado ou já revertido.');
 batch.status='reverted';
 batch.revertedAt=now;
 return batch;
}
