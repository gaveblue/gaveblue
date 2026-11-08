import {uid,today,validDate,paid,pending} from './domain.js?v=20261105-72';

export function cardCycle(date,closingDay){
 if(!validDate(date)||!Number.isInteger(closingDay)||closingDay<1||closingDay>28)throw Error('Confira a data e o dia de fechamento do cartão.');
 const [year,month,day]=date.split('-').map(Number);
 return day<=closingDay?date.slice(0,7):shiftCardCycle(date.slice(0,7),1);
}
export function shiftCardCycle(cycle,offset){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(cycle)||!Number.isInteger(offset)||Math.abs(offset)>120)throw Error('Competência da fatura inválida.');
 const [year,month]=cycle.split('-').map(Number),dt=new Date(Date.UTC(year,month-1+offset,1));
 return dt.getUTCFullYear()+'-'+String(dt.getUTCMonth()+1).padStart(2,'0');
}
export function cardDue(cycle,closingDay,dueDay){
 if(!Number.isInteger(dueDay)||dueDay<1||dueDay>28)throw Error('Dia de vencimento inválido.');
 const target=dueDay>closingDay?cycle:shiftCardCycle(cycle,1);
 return target+'-'+String(dueDay).padStart(2,'0');
}
export const cardPurchases=db=>Array.isArray(db?.cardPurchases)?db.cardPurchases:[];
export const creditCards=db=>Array.isArray(db?.cards)?db.cards:[];
export function cardUsed(db,cardId){
 const purchases=cardPurchases(db).filter(p=>p.cardId===cardId).reduce((s,p)=>s+p.amount,0);
 const receipts=(db.payments||[]).filter(p=>(db.titles||[]).some(t=>t.id===p.titleId&&t.cardInvoice===true&&t.cardId===cardId)).reduce((s,p)=>s+p.amount,0);
 return Math.max(0,purchases-receipts);
}
export const cardAvailable=(db,card)=>card.limit-cardUsed(db,card.id);
function invoiceCategory(db){
 const existing=db.categories.find(c=>c.type==='expense'&&c.name==='Fatura de cartão');
 if(existing)return existing.id;
 const id=uid();
 db.categories.push({id,name:'Fatura de cartão',type:'expense'});
 return id;
}
export function addCardPurchase(db,input){
 const card=creditCards(db).find(c=>c.id===input.cardId&&c.active);
 if(!card)throw Error('Selecione um cartão de crédito ativo.');
 const value=input.amount;
 const count=Number(input.count||1);
 if(!Number.isSafeInteger(value)||value<=0||value>1e12||!Number.isInteger(count)||count<1||count>36||count>value)
  throw Error('Informe valor e parcelas válidos (até 36 parcelas).');
 if(!validDate(input.date)||input.date>today())throw Error('Informe a data real da compra, até hoje.');
 const description=String(input.description||'').trim();
 if(!description||description.length>300)throw Error('Informe uma descrição válida para a compra.');
 if(!db.categories.some(c=>c.id===input.categoryId&&c.type==='expense'))throw Error('Selecione uma categoria de despesa.');
 const source=input.source||'purchase';
 if(!['purchase','invoice-balance'].includes(source)||source==='invoice-balance'&&count!==1)
  throw Error('Tipo de lançamento de cartão inválido.');
 const baseCycle=cardCycle(input.date,card.closingDay);
 // A statement balance replaces itemized purchases for this cycle; never sum both.
 for(let index=0;index<count;index++){
  const cycle=shiftCardCycle(baseCycle,index);
  const invoice=db.titles.find(t=>t.cardInvoice===true&&t.cardId===card.id&&t.cardCycle===cycle&&!t.cancelled);
  if(invoice&&(source==='invoice-balance'||cardPurchases(db).some(p=>p.invoiceId===invoice.id&&p.source==='invoice-balance')))
   throw Error('Esta competência já tem fatura ou saldo informado. Exclua o saldo manual antes de lançar compras individuais para evitar duplicidade.');
 }
 if(cardAvailable(db,card)<value)throw Error('Esta compra ultrapassa o limite disponível do cartão. Confira o limite e as faturas.');
 if(!Array.isArray(db.cardPurchases))db.cardPurchases=[];
 const categoryId=invoiceCategory(db),groupId=count>1?uid():null;
 const generated=[];
 for(let index=0;index<count;index++){
  const cycle=shiftCardCycle(baseCycle,index);
  const part=Math.floor(value/count)+(index<value%count?1:0);
  let invoice=db.titles.find(t=>t.cardInvoice===true&&t.cardId===card.id&&t.cardCycle===cycle&&!t.cancelled);
  if(!invoice){
   invoice={
    id:uid(),type:'expense',description:'Fatura '+card.name+' • '+cycle.slice(5)+'/'+cycle.slice(0,4),
    categoryId,partnerId:'',document:'',issue:input.date,
    due:cardDue(cycle,card.closingDay,card.dueDay),amount:0,accountId:card.payAccountId||'',
    notes:'Fatura criada a partir das compras do cartão. As compras não são lançadas novamente no caixa.',
    groupId:null,mode:'single',sequence:1,count:1,cancelled:false,
    cardInvoice:true,cardId:card.id,cardCycle:cycle
   };
   db.titles.push(invoice);
  }
  if(!Number.isSafeInteger(invoice.amount+part)||invoice.amount+part>1e12)throw Error('Valor da fatura excedeu o limite permitido.');
  invoice.amount+=part;
  const row={
   id:uid(),cardId:card.id,invoiceId:invoice.id,date:input.date,amount:part,description,
   categoryId:input.categoryId,partnerId:input.partnerId||'',groupId,
   source,sequence:index+1,count
  };
  db.cardPurchases.push(row);generated.push(row);
 }
 return generated;
}
/**
 * Record a consolidated balance from an external statement, without creating
 * an additional expense title for an already itemized GB+ invoice.
 * It occupies exactly one card cycle. The financial title remains the same
 * cardInvoice title used by the ordinary payment and forecast flows.
 */
export function registerCardInvoiceBalance(db,input){
 const card=creditCards(db).find(c=>c.id===input.cardId&&c.active);
 if(!card)throw Error('Selecione um cartão de crédito ativo.');
 const cycle=String(input.cycle||'');
 if(!/^\\d{4}-(0[1-9]|1[0-2])$/.test(cycle)||cycle>cardCycle(today(),card.closingDay))
  throw Error('Informe uma competência atual ou anterior para a fatura.');
 const closeDate=cycle+'-'+String(card.closingDay).padStart(2,'0');
 const date=closeDate<=today()?closeDate:today();
 if(cardCycle(date,card.closingDay)!==cycle)
  throw Error('A competência informada não corresponde ao ciclo do cartão.');
 const description=String(input.description||'Saldo informado da fatura').trim();
 if(!description||description.length>300)throw Error('Informe uma identificação válida para a fatura.');
 // Existing purchases/invoices, including a prior manually entered balance,
 // must be reconciled by the user rather than summed a second time.
 if(db.titles.some(t=>t.cardInvoice===true&&t.cardId===card.id&&t.cardCycle===cycle&&!t.cancelled))
  throw Error('Já existe uma fatura para esta competência. Abra-a para pagar ou editar as compras.');
 const categoryId=invoiceCategory(db);
 return addCardPurchase(db,{cardId:card.id,date,amount:input.amount,count:1,
  description,categoryId,partnerId:'',source:'invoice-balance'});
}
export function removeCardPurchase(db,id){
 const purchase=cardPurchases(db).find(p=>p.id===id);
 if(!purchase)throw Error('Compra não encontrada.');
 const group=purchase.groupId?cardPurchases(db).filter(p=>p.groupId===purchase.groupId):[purchase];
 const invoiceIds=[...new Set(group.map(p=>p.invoiceId))];
 if(invoiceIds.some(invoiceId=>db.payments.some(p=>p.titleId===invoiceId)))
  throw Error('Esta compra possui fatura com baixa. Estorne o pagamento antes de excluir a compra.');
 for(const item of group){
  const invoice=db.titles.find(t=>t.id===item.invoiceId);
  if(!invoice||!invoice.cardInvoice)throw Error('Fatura vinculada não encontrada. Nenhum dado foi alterado.');
  invoice.amount-=item.amount;
  if(invoice.amount<0)throw Error('Fatura inconsistente. Nenhum dado foi alterado.');
 }
 db.cardPurchases=db.cardPurchases.filter(p=>!group.some(x=>x.id===p.id));
 db.titles=db.titles.filter(t=>!t.cardInvoice||t.amount>0);
 return group.length;
}
/**
 * Edits a credit purchase without duplicating card invoices or bank transactions.
 * A single purchase row represents one installment; changing it changes the whole group.
 * Draft calculations are committed only after all constraints succeed.
 */
export function updateCardPurchase(db,id,input){
 const purchase=cardPurchases(db).find(p=>p.id===id);
 if(!purchase)throw Error('Compra no cartão não encontrada.');
 const group=purchase.groupId?cardPurchases(db).filter(p=>p.groupId===purchase.groupId):[purchase];
 const ordered=[...group].sort((a,b)=>a.sequence-b.sequence);
 const total=ordered.reduce((sum,row)=>sum+row.amount,0);
 const amount=input.amount,count=Number(input.count||1);
 const cardId=String(input.cardId||'');
 const date=String(input.date||'');
 const description=String(input.description||'').trim();
 const categoryId=String(input.categoryId||'');
 const partnerId=String(input.partnerId||'');
 if(!Number.isSafeInteger(amount)||amount<=0||amount>1e12||!Number.isInteger(count)||count<1||count>36||count>amount)
  throw Error('Informe valor e parcelas válidos (até 36 parcelas).');
 if(!validDate(date)||date>today())throw Error('Informe uma data real da compra, até hoje.');
 if(!description||description.length>300)throw Error('Informe uma descrição válida para a compra.');
 if(!db.categories.some(c=>c.id===categoryId&&c.type==='expense'))
  throw Error('Selecione uma categoria de despesa válida.');
 const changedFinancial=cardId!==purchase.cardId||date!==purchase.date||amount!==total||count!==ordered.length;
 const paidInvoice=ordered.some(row=>(db.payments||[]).some(payment=>payment.titleId===row.invoiceId));
 if(paidInvoice&&changedFinancial)
  throw Error('Esta compra possui fatura paga. Estorne a baixa antes de alterar cartão, data, valor ou parcelas.');
 if(!changedFinancial){
  // Description/category/partner are not part of invoice accounting.
  for(const row of ordered)Object.assign(row,{description,categoryId,partnerId});
  return ordered;
 }
 // Rebuild on a detached copy. Failed limit/validation never touches live records.
 const draft=structuredClone(db);
 removeCardPurchase(draft,id);
 const created=addCardPurchase(draft,{cardId,date,amount,count,description,categoryId,partnerId,source:purchase.source||'purchase'});
 // Keep stable installment ids when the number of installments remains unchanged.
 if(created.length===ordered.length){
  for(let i=0;i<created.length;i++)created[i].id=ordered[i].id;
  if(ordered.length>1){
   for(const row of created)row.groupId=purchase.groupId;
  }
 }
 db.titles=draft.titles;
 db.cardPurchases=draft.cardPurchases;
 db.categories=draft.categories;
 return created;
}
export function ensureCardMayChange(db,id,next){
 const old=creditCards(db).find(c=>c.id===id);
 if(!old)return;
 if(cardPurchases(db).some(p=>p.cardId===id)){
  if(old.closingDay!==next.closingDay||old.dueDay!==next.dueDay)throw Error('O fechamento e o vencimento não podem ser alterados depois de registrar compras. Cadastre outro cartão para um novo ciclo.');
  if(cardUsed(db,id)>next.limit)throw Error('O novo limite é menor que as compras ainda não pagas.');
 }
}
