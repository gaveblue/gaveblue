// GB+ 2.5.0 — conciliação com criação explícita e reversão atômica.
// Toda gravação passa por repository.save, com controle de revisão por usuário.
// Arquivos OFX/CSV nunca são persistidos; somente decisões aprovadas e seus metadados.
export const RECONCILIATION_BATCH_MAX = 200;
export const RECONCILIATION_TOTAL_MAX = 10000;
export const RECONCILIATION_BATCHES_MAX = 100;
export const RECONCILIATION_CREATE_MAX = 50;
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
const deltaDays=(a,b)=>Math.abs(Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000;
export function potentialExistingTitle(db,accountId,record){
 const sign=record.amount>0?'income':'expense';
 const expected=Math.abs(record.amount),name=normalized(record.description);
 return (db.titles||[]).some(t=>!t.cancelled&&t.type===sign&&t.amount===expected&&
  (!t.accountId||t.accountId===accountId)&&validDate(t.due)&&deltaDays(t.due,record.date)<=3&&
  (normalized(t.description)===name||
   Boolean(record.externalId&&t.document===record.externalId))&&
  (db.payments||[]).filter(p=>p.titleId===t.id).reduce((sum,p)=>sum+p.amount,0)<t.amount);
}
export function reviewSelection(preview,decisions,db,options={}){
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
  if(!['link','ignore','pending','create'].includes(choice.action))throw Error('Decisão de conciliação inválida.');
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
  if(choice.action==='create'){
   if(row.status!=='not_found')throw Error('Só é possível criar um lançamento para movimentos não localizados e sem correspondências.');
   if(row.record.date>(options.today||new Date().toLocaleDateString('en-CA')))throw Error('Movimento futuro não pode ser baixado. Aguarde a data da movimentação.');
   const type=row.record.amount>0?'income':'expense',categoryId=String(choice.categoryId||'');
   if(!db.categories?.some(c=>c.id===categoryId&&c.type===type))throw Error('Selecione uma categoria de '+(type==='income'?'receita':'despesa')+' válida.');
   const description=String(choice.description||'').trim();
   if(!description||description.length>300)throw Error('Informe uma descrição de até 300 caracteres.');
   if(potentialExistingTitle(db,preview.accountId,row.record))throw Error('Existe um título semelhante em aberto. Confira-o antes de criar um novo lançamento.');
   if(!Number.isSafeInteger(Math.abs(row.record.amount))||Math.abs(row.record.amount)>1e12)throw Error('Valor fora do limite permitido.');
   item.categoryId=categoryId;item.description=description;item.entryType=type;
  }
  entries.push(item);
 }
 if(entries.filter(e=>e.action==='create').length>RECONCILIATION_CREATE_MAX)throw Error('Crie no máximo '+RECONCILIATION_CREATE_MAX+' lançamentos por lote.');
 if(entries.length>RECONCILIATION_BATCH_MAX)throw Error('Confirme no máximo '+RECONCILIATION_BATCH_MAX+' movimentos por lote.');
 if(!entries.length)throw Error('Selecione ao menos um movimento antes de confirmar.');
 if(history(db).length>=RECONCILIATION_BATCHES_MAX||
   history(db).reduce((sum,b)=>sum+(b.entries||[]).length,0)+entries.length>RECONCILIATION_TOTAL_MAX)
  throw Error('Histórico de conciliações atingiu o limite. Exporte um backup e revise os lotes antigos.');
 return {accountId:preview.accountId,entries,totals:{
  linked:entries.filter(e=>e.action==='link').length,
  ignored:entries.filter(e=>e.action==='ignore').length,
  pending:entries.filter(e=>e.action==='pending').length,
  created:entries.filter(e=>e.action==='create').length,
  amountCreatedIn:entries.filter(e=>e.action==='create'&&e.amount>0).reduce((s,e)=>s+e.amount,0),
  amountCreatedOut:entries.filter(e=>e.action==='create'&&e.amount<0).reduce((s,e)=>s-e.amount,0),
  amountLinked:entries.filter(e=>e.action==='link').reduce((sum,e)=>sum+e.amount,0)
 }};
}
export function applyReconciliationBatch(db,parsed,accountId,decisions,meta){
 // Recompute candidates against the CURRENT database; never trust stale UI data.
 if(!parsed||!Array.isArray(parsed.records)||!meta?.propose||!isId(meta.batchId))throw Error('Dados de conciliação inválidos.');
 const preview=meta.propose(parsed,db,accountId);
 const plan=reviewSelection(preview,decisions,db,{today:meta.today});
 const batch={id:meta.batchId,accountId,format:parsed.format,createdAt:meta.now||new Date().toISOString(),status:'active',entries:plan.entries};
 if(!['ofx','csv'].includes(batch.format)||!/^\d{4}-\d{2}-\d{2}T/.test(batch.createdAt))throw Error('Lote inválido.');
 if(history(db).some(b=>b.id===batch.id))throw Error('Lote já registrado.');
 // A chamada é feita dentro da cópia transacional de commit(); qualquer erro
 // antes da persistência descarta tanto lançamentos quanto histórico.
 const usedIds=new Set([
  ...(db.titles||[]).map(t=>t.id),...(db.payments||[]).map(p=>p.id),
  ...history(db).map(b=>b.id)
 ]);
 for(const item of batch.entries.filter(e=>e.action==='create')){
  if(typeof meta.makeId!=='function')throw Error('Gerador de identificadores indisponível.');
  const titleId=meta.makeId(),paymentId=meta.makeId();
  if(!isId(titleId)||!isId(paymentId)||titleId===paymentId||usedIds.has(titleId)||usedIds.has(paymentId))
   throw Error('Identificadores de lançamento inválidos ou repetidos.');
  usedIds.add(titleId);usedIds.add(paymentId);
  const amount=Math.abs(item.amount);
  const description=item.description;
  const title={id:titleId,type:item.entryType,description,categoryId:item.categoryId,partnerId:'',
   document:item.externalId.slice(0,100),issue:item.date,due:item.date,amount,
   accountId,notes:'Criado após confirmação de extrato bancário.',mode:'single',sequence:1,count:1,
   groupId:null,cancelled:false};
  const payment={id:paymentId,titleId,accountId,date:item.date,amount};
  db.titles.push(title);db.payments.push(payment);
  item.createdTitleId=titleId;item.createdPaymentId=paymentId;
 }
 db.bankImportBatches=[...history(db),batch];
 return {batch,totals:plan.totals};
}
export function undoReconciliationBatch(db,batchId,now=new Date().toISOString()){
 const batch=history(db).find(b=>b.id===batchId);
 if(!batch||batch.status!=='active')throw Error('Lote não encontrado ou já revertido.');
 const created=batch.entries.filter(e=>e.action==='create');
 // Fail closed: no partial reversal. Edited/deleted records require manual review.
 for(const item of created){
  const t=db.titles.find(t=>t.id===item.createdTitleId);
  const p=db.payments.find(p=>p.id===item.createdPaymentId);
  if(!t||!p||t.cancelled||t.cardInvoice||t.id!==p.titleId||p.accountId!==batch.accountId||
    t.accountId!==batch.accountId||t.amount!==Math.abs(item.amount)||p.amount!==Math.abs(item.amount)||
    t.type!==item.entryType||t.description!==item.description||t.categoryId!==item.categoryId||
    t.due!==item.date||t.issue!==item.date||p.date!==item.date||
    (db.payments||[]).filter(x=>x.titleId===t.id).length!==1)
    throw Error('Um lançamento do lote foi alterado ou estornado. Revise-o antes de reverter o lote.');
 }
 const titleIds=new Set(created.map(e=>e.createdTitleId)),paymentIds=new Set(created.map(e=>e.createdPaymentId));
 db.payments=db.payments.filter(p=>!paymentIds.has(p.id));
 db.titles=db.titles.filter(t=>!titleIds.has(t.id));
 batch.status='reverted';
 batch.revertedAt=now;
 return batch;
}
