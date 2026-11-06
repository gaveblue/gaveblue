// GB+ 2.4.9 — read-only ledger of settled movements by bank account.
// Balances are based on the existing initial amount, payments and transfers;
// pending titles and credit-card purchases are never counted as cash movement.
export function dailyStatement(db,accountId,until){
 const account=(db.accounts||[]).find(a=>a.id===accountId);
 if(!account)throw Error('Conta não encontrada.');
 const titleById=new Map((db.titles||[]).map(t=>[t.id,t]));
 const accountById=new Map((db.accounts||[]).map(a=>[a.id,a]));
 const events=[];
 for(const p of db.payments||[]){
  if(p.accountId!==accountId||p.date>until)continue;
  const title=titleById.get(p.titleId);
  if(!title||!['income','expense'].includes(title.type))continue;
  events.push({id:p.id,date:p.date,description:title.description||'Baixa',type:title.type,amount:p.amount,kind:'payment'});
 }
 for(const t of db.transfers||[]){
  if(t.date>until||(t.from!==accountId&&t.to!==accountId))continue;
  const outgoing=t.from===accountId,other=accountById.get(outgoing?t.to:t.from);
  events.push({id:t.id,date:t.date,description:'Transferência '+(outgoing?'para ':'de ')+(other?.name||'outra conta'),
   type:outgoing?'expense':'income',amount:t.amount,kind:'transfer'});
 }
 // Build in ascending date order, keeping the account opening balance independent
 // from the date of its first recorded movement (legacy schema has no opening date).
 events.sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
 const days=[];
 let balance=account.initial,credits=0,debits=0,day=null;
 for(const event of events){
  if(!day||day.date!==event.date){
   day={date:event.date,opening:balance,credits:0,debits:0,closing:balance,items:[]};
   days.push(day);
  }
  if(event.type==='income'){balance+=event.amount;day.credits+=event.amount;credits+=event.amount;}
  else{balance-=event.amount;day.debits+=event.amount;debits+=event.amount;}
  day.closing=balance;
  day.items.push(event);
 }
 return {accountId,opening:account.initial,closing:balance,credits,debits,days:days.reverse()};
}
