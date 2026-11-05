import {addPayment,pending,paid} from './domain.js?v=20261105-72';

// Resolve an explicit visible selection. No implicit "all in filter" updates.
export function launchSelection(db,ids){
 const requested=[...new Set(ids||[])];
 if(!requested.length)throw Error('Selecione pelo menos um lançamento.');
 const selected=requested.map(id=>db.titles.find(t=>t.id===id));
 if(selected.some(t=>!t))throw Error('A seleção mudou. Atualize a lista e selecione novamente.');
 return selected;
}
export function paymentSelection(db,ids){
 const selected=launchSelection(db,ids);
 if(selected.some(t=>t.cancelled||pending(db,t)<=0))throw Error('Há lançamentos pagos ou cancelados na seleção. Desmarque-os para baixar os pendentes.');
 return selected;
}
export function paymentSummary(db,ids){
 const selected=paymentSelection(db,ids);
 return {
  count:selected.length,
  income:selected.filter(t=>t.type==='income').reduce((sum,t)=>sum+pending(db,t),0),
  expense:selected.filter(t=>t.type==='expense').reduce((sum,t)=>sum+pending(db,t),0)
 };
}
export function applyLaunchPayments(db,ids,accountId,date){
 const selected=paymentSelection(db,ids);
 if(!db.accounts.some(a=>a.id===accountId&&a.active))throw Error('Selecione uma conta financeira ativa.');
 // Validate all entries before changing the draft; repository.save writes one revision.
 selected.forEach(t=>addPayment(db,{titleId:t.id,accountId,date,amount:pending(db,t)}));
 return selected.length;
}
export function reversedSelection(db,ids){
 const selected=launchSelection(db,ids);
 const selectedIds=new Set(selected.map(t=>t.id));
 const payments=db.payments.filter(p=>selectedIds.has(p.titleId));
 if(!payments.length)throw Error('Nenhum dos lançamentos selecionados possui baixas para estornar.');
 return {titles:selected,payments,total:payments.reduce((s,p)=>s+p.amount,0)};
}
export function applyLaunchReversals(db,ids){
 const {payments}=reversedSelection(db,ids);
 const paymentIds=new Set(payments.map(p=>p.id));
 db.payments=db.payments.filter(p=>!paymentIds.has(p.id));
 return payments.length;
}
export function deletionSelection(db,ids){
 const selected=launchSelection(db,ids);
 if(selected.some(t=>t.cardInvoice))throw Error('Faturas de cartão não podem ser excluídas como títulos comuns. Ajuste as compras vinculadas.');
 if(selected.some(t=>paid(db,t.id)>0))throw Error('Há lançamentos com baixas na seleção. Estorne as baixas antes de excluir.');
 return selected;
}
export function applyLaunchDeletions(db,ids){
 const selected=deletionSelection(db,ids);
 const set=new Set(selected.map(t=>t.id));
 db.titles=db.titles.filter(t=>!set.has(t.id));
 return selected.length;
}
