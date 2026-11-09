/* GB+ 2.9.0 — financial pockets and savings goals. No separate money ledger:
   every goal is an existing account, funded by internal transfers. */
import {gbIcon} from './gb-icons.js?v=20261109-2900';
import {bankBadge,bankForAccount} from './banks.js?v=20261105-87';
import {accountBalance,today,money} from './domain.js?v=20261105-72';
import {esc} from './ui.js?v=20261105-72';

export const ACCOUNT_ICON_OPTIONS=Object.freeze([
 ['wallet','Carteira'],['piggy-bank','Cofrinho'],['coins','Dinheiro'],
 ['shield-check','Segurança'],['heart','Casamento'],['graduation-cap','Educação'],
 ['plane','Viagem'],['house','Casa'],['car','Carro'],['gift','Presentes'],
 ['trophy','Conquista'],['baby','Família'],['briefcase-business','Trabalho'],
 ['book-open','Livros'],['laptop','Tecnologia'],['paw-print','Pet'],
 ['chart-no-axes-combined','Investimentos'],['bike','Bicicleta'],
 ['flower-2','Jardim'],['badge-dollar-sign','Reserva']
]);
export const GOAL_PRESETS=Object.freeze([
 ['emergency','Reserva de emergência','shield-check','Reserva de emergência'],
 ['wedding','Casamento','heart','Meu casamento'],
 ['education','Educação','graduation-cap','Minha educação'],
 ['travel','Viagem','plane','Minha viagem'],
 ['home','Casa própria','house','Minha casa'],
 ['custom','Outro objetivo','piggy-bank','Meu cofrinho']
]);
export function accountKind(a){
 if(['bank','custom','goal'].includes(a?.kind))return a.kind;
 return a?.bankId||a?.bank?'bank':'custom'; // Existing bank/cash records keep their meaning.
}
export function goalPreset(id){return GOAL_PRESETS.find(row=>row[0]===id)||GOAL_PRESETS[GOAL_PRESETS.length-1];}
export function accountIcon(a){
 const key=String(a?.icon||'');
 const valid=ACCOUNT_ICON_OPTIONS.some(([name])=>name===key);
 return valid?key:accountKind(a)==='goal'?'piggy-bank':'wallet';
}
export function accountMark(db,a){
 if(accountKind(a)==='bank')return bankBadge(bankForAccount(db,a));
 return '<span class="gb-account-custom-mark'+(accountKind(a)==='goal'?' is-goal':'')+
  '" aria-hidden="true">'+gbIcon(accountIcon(a))+'</span>';
}
export function accountTypeLabel(a){
 return accountKind(a)==='goal'?'Cofrinho de metas':accountKind(a)==='custom'?'Conta personalizada':'Conta bancária';
}
export function goalProgress(db,a,at=today()){
 if(accountKind(a)!=='goal')return null;
 const amount=accountBalance(db,a.id,at),target=a.goalTarget||0;
 if(!Number.isSafeInteger(target)||target<=0)return null;
 const remaining=Math.max(0,target-amount);
 const percent=Math.min(100,Math.max(0,Math.round(amount/target*1000)/10));
 const due=String(a.goalDue||'');
 const days= /^\d{4}-\d{2}-\d{2}$/.test(due)?
  Math.ceil((new Date(due+'T12:00:00').getTime()-new Date(at+'T12:00:00').getTime())/86400000):null;
 const months=days===null||days<0?null:Math.max(1,Math.ceil(days/30.4375));
 const monthly=months===null?null:Math.ceil(remaining/months);
 return {amount,target,remaining,percent,days,months,monthly,complete:remaining===0};
}
export function goalProgressMarkup(db,a){
 const g=goalProgress(db,a);
 if(!g)return '';
 const end=g.complete?'Meta alcançada':g.days<0?'Prazo encerrado':g.days===0?'Termina hoje':
  'Até '+esc(a.goalDue.split('-').reverse().join('/'));
 return '<div class="gb-goal-progress">'+
  '<div class="gb-goal-row"><span>Meta: '+money(g.target)+'</span><b>'+g.percent.toLocaleString('pt-BR')+'%</b></div>'+
  '<div class="gb-goal-track" role="progressbar" aria-label="Progresso da meta '+esc(a.name)+
  '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+g.percent+'">'+
  '<span style="width:'+g.percent+'%"></span></div>'+
  '<div class="gb-goal-row"><small>'+end+'</small><small>Faltam '+money(g.remaining)+'</small></div>'+
  (!g.complete&&g.monthly!==null?'<p class="gb-goal-suggestion">Para chegar lá: cerca de <strong>'+
    money(g.monthly)+'/mês</strong></p>':'')+
  '</div>';
}
