import {parseMoneyCentavos} from './gb-finance-input.js?v=20261104-42';
import {expectedDates,nextBusinessDay,recurrenceAnchor} from './gb-calendar-rules.js?v=20261105-47';
export const uid = () => crypto.randomUUID();
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const money = n => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(n / 100);
export const dateLabel = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
export function validDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0,10) === s; }
export function cents(value) { const n=parseMoneyCentavos(value); if(!Number.isSafeInteger(n)||Math.abs(n)>1e12)throw Error('Informe um valor válido.'); return n; }
export function addMonths(date, count) { const [y,m,d] = date.split('-').map(Number); const target = new Date(y,m-1+count,1,12); target.setDate(Math.min(d,new Date(target.getFullYear(),target.getMonth()+1,0).getDate())); return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`; }
export const paid = (db, id) => db.payments.filter(p=>p.titleId===id).reduce((n,p)=>n+p.amount,0);
export const pending = (db,t) => t.cancelled ? 0 : t.amount-paid(db,t.id);
export function status(db,t) { if(t.cancelled) return 'Cancelado'; const p=paid(db,t.id); if(p===t.amount) return t.type==='income'?'Recebido':'Pago'; if(t.due<today()) return p?'Vencido · parcial':'Vencido'; if(p) return 'Parcial'; return 'Em aberto'; }
export function accountBalance(db,id,until='9999-12-31') { const a=db.accounts.find(a=>a.id===id); if(!a) return 0; return a.initial + db.payments.filter(p=>p.accountId===id&&p.date<=until).reduce((sum,p)=>sum+(db.titles.find(t=>t.id===p.titleId).type==='income'?p.amount:-p.amount),0) + db.transfers.filter(t=>t.date<=until).reduce((sum,t)=>sum+(t.to===id?t.amount:0)-(t.from===id?t.amount:0),0); }
export const balance = db => db.accounts.reduce((sum,a)=>sum+accountBalance(db,a.id,today()),0);
export const within = (date,range) => (!range.from || date>=range.from)&&(!range.to||date<=range.to);
export function metrics(db,range) { const titles=db.titles.filter(t=>within(t.due,range)); const ps=db.payments.filter(p=>within(p.date,range)); const received=ps.filter(p=>db.titles.find(t=>t.id===p.titleId).type==='income').reduce((s,p)=>s+p.amount,0); const spent=ps.filter(p=>db.titles.find(t=>t.id===p.titleId).type==='expense').reduce((s,p)=>s+p.amount,0); const receivable=titles.filter(t=>t.type==='income').reduce((s,t)=>s+pending(db,t),0); const payable=titles.filter(t=>t.type==='expense').reduce((s,t)=>s+pending(db,t),0); return {balance:balance(db),receivable,payable,provisions:receivable-payable,received,spent,result:received-spent,overdue:titles.filter(t=>t.due<today()).reduce((s,t)=>s+pending(db,t),0)}; }
export function generateTitles(input,mode='single',count=1,options={}) {
 if(!['single','installment','recurring'].includes(mode)||!Number.isInteger(count)||count<1||count>120)throw Error('Escolha de 1 a 120 títulos.');
 if(!Number.isSafeInteger(input.amount)||input.amount<1||!validDate(input.due))throw Error('Informe valor e vencimento válidos.');
 if(mode==='single')count=1;
 if(mode==='installment'&&input.amount<count)throw Error('Cada parcela precisa ter ao menos R$ 0,01.');
 const businessDays=Boolean(options.businessDays),groupId=count>1?uid():null;
 const schedule=expectedDates(input.due,mode,count,businessDays,addMonths);
 return schedule.map(({index,date,nominal,shifted})=>({
  ...input,id:uid(),groupId,mode,sequence:index,count,cancelled:false,businessDays,
  originalDue:nominal,shiftedToBusinessDay:shifted,
  amount:mode==='installment'?Math.floor(input.amount/count)+(index-1<input.amount%count?1:0):input.amount,
  due:date
 }));
}
export function addPayment(db,p) { const t=db.titles.find(t=>t.id===p.titleId); const account=db.accounts.find(a=>a.id===p.accountId&&a.active); if(!t||t.cancelled||!account||!validDate(p.date)||p.date>today()||!Number.isSafeInteger(p.amount)||p.amount<=0||p.amount>pending(db,t)) throw Error('Confira o valor pendente, a conta ativa e a data da baixa (até hoje).'); db.payments.push({...p,id:uid()}); }
export function transfer(db,t) { if(t.from===t.to||![t.from,t.to].every(id=>db.accounts.some(a=>a.id===id&&a.active))||!validDate(t.date)||t.date>today()||!Number.isSafeInteger(t.amount)||t.amount<=0) throw Error('Informe duas contas ativas diferentes, valor positivo e data até hoje.'); db.transfers.push({...t,id:uid()}); }
export function updateTitle(db,id,values,future=false) { const original=db.titles.find(t=>t.id===id); if(!original) throw Error('Título não encontrado.'); if(original.cardInvoice)throw Error('Faturas de cartão são atualizadas exclusivamente pelas compras vinculadas.'); const targets=future&&original.mode==='recurring'&&original.groupId?db.titles.filter(t=>t.groupId===original.groupId&&t.sequence>=original.sequence):[original]; if(targets.some(t=>paid(db,t.id)>0&&(values.cancelled||values.type!==t.type||values.amount<paid(db,t.id)))) throw Error('Não é possível cancelar, trocar o tipo ou reduzir o valor abaixo das baixas existentes.'); for(const t of targets) { const baseDue=recurrenceAnchor(values.due,original); const nominal=addMonths(baseDue,t.sequence-original.sequence); const workdays=values.businessDays??t.businessDays??false; const due=workdays?nextBusinessDay(nominal):nominal; Object.assign(t,values,{due,businessDays:workdays,originalDue:nominal,shiftedToBusinessDay:due!==nominal}); } }
// Read-only cash flow, linear in titles + payments (no per-title payment scans).
// Malformed orphan payments cannot prevent dashboards from opening.
export function flow(db,range,granularity='month') {
 const buckets=new Map();
 const key=d=>{
  if(granularity==='month')return d.slice(0,7)+'-01';
  if(granularity==='day')return d;
  const dt=new Date(d+'T12:00:00');
  dt.setDate(dt.getDate()-((dt.getDay()+6)%7));
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
 };
 const get=date=>{
  const k=key(date);
  if(!buckets.has(k))buckets.set(k,{date:k,expectedIn:0,expectedOut:0,actualIn:0,actualOut:0});
  return buckets.get(k);
 };
 const titles=new Map((db.titles||[]).map(t=>[t.id,t]));
 const paidByTitle=new Map();
 for(const payment of db.payments||[]){
  if(!titles.has(payment.titleId)||!Number.isSafeInteger(payment.amount)||payment.amount<=0||!validDate(payment.date))continue;
  paidByTitle.set(payment.titleId,(paidByTitle.get(payment.titleId)||0)+payment.amount);
  if(within(payment.date,range)){
   const t=titles.get(payment.titleId);
   if(t.type==='income'||t.type==='expense')get(payment.date)[t.type==='income'?'actualIn':'actualOut']+=payment.amount;
  }
 }
 for(const title of db.titles||[]){
  if(title.cancelled||!within(title.due,range)||(title.type!=='income'&&title.type!=='expense'))continue;
  const rest=title.amount-(paidByTitle.get(title.id)||0);
  get(title.due)[title.type==='income'?'expectedIn':'expectedOut']+=rest;
 }
 return [...buckets.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
