// GB+ 2.8.2 — avisos internos baseados nos títulos e nas preferências do usuário.
// Não solicita permissão do navegador nem envia push com aplicativo fechado.
export const DEFAULT_NOTIFICATION_PREFS=Object.freeze({
 enabled:true,daysBefore:7,expenses:true,incomes:true,includeOverdue:true
});
const allowedDays=[0,1,2,3,5,7,10,15,30];
export const NOTIFICATION_DAYS=Object.freeze(allowedDays);
export function validNotificationPrefs(value){
 return !!value && typeof value==='object' &&
  typeof value.enabled==='boolean' &&
  allowedDays.includes(value.daysBefore) &&
  typeof value.expenses==='boolean' &&
  typeof value.incomes==='boolean' &&
  typeof value.includeOverdue==='boolean';
}
export function notificationPrefs(settings){
 const value=settings?.notifications;
 return validNotificationPrefs(value)?value:{...DEFAULT_NOTIFICATION_PREFS};
}
function utcDay(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(day||'')))return NaN;
 const [year,month,date]=day.split('-').map(Number);
 return Date.UTC(year,month-1,date)/86400000;
}
export function calculateDueAlerts(db,asOf){
 const prefs=notificationPrefs(db?.settings);
 const now=utcDay(asOf),messages=[],summary={overdue:0,today:0,upcoming:0};
 if(!prefs.enabled||!Number.isFinite(now))return {prefs,items:messages,summary,total:0};
 for(const title of db?.titles||[]){
  if(title.cancelled||!((title.type==='expense'&&prefs.expenses)||(title.type==='income'&&prefs.incomes)))continue;
  // A aplicação tem baixas reais; apenas saldo pendente merece lembrete.
  const paidAmount=(db.payments||[]).filter(row=>row.titleId===title.id).reduce((sum,row)=>sum+row.amount,0);
  const outstanding=Math.max(0,title.amount-paidAmount);
  if(outstanding===0)continue;
  const difference=utcDay(title.due)-now;
  if(!Number.isFinite(difference))continue;
  if(difference<0&&!prefs.includeOverdue)continue;
  if(difference>prefs.daysBefore)continue;
  const group=difference<0?'overdue':difference===0?'today':'upcoming';
  summary[group]++;
  messages.push({id:title.id,title,group,daysUntil:difference,pending:outstanding});
 }
 messages.sort((a,b)=>a.daysUntil-b.daysUntil||String(a.title.description).localeCompare(String(b.title.description),'pt-BR'));
 return {prefs,items:messages,summary,total:messages.length};
}
