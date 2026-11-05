// GB+ AI: deterministic, private, read-only simulations. Money is in cents.
// A conversation context may describe a hypothetical plan, never an actual financial entry.
const MONTH_NAMES=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MONTH_DISPLAY=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const WORD_NUMBERS={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12};
const brl=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
export const normalizeAi=s=>String(s||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const monthKey=(year,month,offset=0)=>{
 const d=new Date(Date.UTC(year,month-1+offset,1));
 return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
};
const monthEnd=key=>{
 const [y,m]=key.split('-').map(Number);
 return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);
};
const monthLabel=key=>{
 const [y,m]=key.split('-').map(Number);
 return MONTH_DISPLAY[m-1]+' de '+y;
};
const numberValue=w=>/^\d+$/.test(w)?Number(w):(WORD_NUMBERS[w]??null);
const safeCents=(text)=>{
 const s=String(text||'').trim().replace(/[.,;!?]+$/,'');
 if(!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(s))return null;
 const n=Number(s.replace(/\./g,'').replace(',','.'));
 const cents=Math.round(n*100);
 return Number.isSafeInteger(cents)&&cents>0&&cents<=1e12?cents:null;
};
export function readScenarioMonth(query,asOf){
 const s=normalizeAi(query),[year,month]=asOf.slice(0,7).split('-').map(Number);
 if(/(?:este|nesse|neste|atual)\s+mes/.test(s))return monthKey(year,month);
 if(/(?:mes\s+que\s+vem|proximo\s+mes|mes\s+seguinte)/.test(s))return monthKey(year,month,1);
 const relative=s.match(/(?:daqui(?:\s+a)?|em|dentro\s+de|apos|para\s+daqui(?:\s+a)?)\s+(\d{1,2}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+mes(?:es)?\b/);
 if(relative){
  const count=numberValue(relative[1]);
  return count!==null&&count>=0&&count<=60?monthKey(year,month,count):null;
 }
 const named=s.match(/\b(?:em|no|para|ate|durante|de|do)\s+(?:o\s+mes\s+de\s+)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+(\d{4}))?\b/);
 if(named){
  let targetYear=named[2]?Number(named[2]):year;
  const targetMonth=MONTH_NAMES.indexOf(named[1])+1;
  if(!named[2]&&targetMonth<month)targetYear++;
  return targetYear>=year&&targetYear<=year+5?monthKey(targetYear,targetMonth):null;
 }
 return null;
}
export function readScenarioConditionalIncome(query){
 const s=normalizeAi(query);
 const match=s.match(/\b(?:se\s+(?:eu\s+)?receber|caso\s+(?:eu\s+)?receba|se\s+(?:eu\s+)?ganhar|se\s+entrar|se\s+(?:me\s+)?pagarem|se\s+(?:eu\s+)?recebesse)\s+(?:r\$\s*)?(\d[\d.,]*)/);
 return match?safeCents(match[1]):null;
}
export function readScenarioAmount(query){
 const s=normalizeAi(query);
 // Explicit price, not an unrelated prospective income.
 const price=s.match(/\b(?:custar|custasse|custa|custando|custaria|preco\s+(?:de|e)|valor\s+de|vale|por)\s*(?:r\$\s*)?(\d[\d.,]*)/);
 if(price){const v=safeCents(price[1]);if(v!==null)return v;}
 const buy=s.match(/\b(?:comprar|compro|adquirir|adquiro)\b/);
 if(buy){
  const tail=s.slice(buy.index+buy[0].length);
  // "comprar um iPhone de 18.000,00": the number is the PRICE, not the
  // hypothetical income that appeared earlier in the same question.
  const namedPrice=tail.match(/\b(?:de|por)\s*(?:r\$\s*)?(\d[\d.,]*)/);
  if(namedPrice&&!/^\s*(?:mes|dias|semanas)\b/.test(tail.slice(namedPrice.index+namedPrice[0].length))){
   const v=safeCents(namedPrice[1]);if(v!==null)return v;
  }
  const withSymbol=tail.match(/r\$\s*(\d[\d.,]*)/);
  if(withSymbol){const v=safeCents(withSymbol[1]);if(v!==null)return v;}
 }
 // A conditional receivable is NOT the purchase price.
 if(readScenarioConditionalIncome(s)!==null)return null;
 const monetary=s.match(/r\$\s*(\d[\d.,]*)|\b(\d[\d.,]*)\s*reais?\b/);
 if(monetary)return safeCents(monetary[1]||monetary[2]);
 return null;
}
export function readScenarioInstallments(query){
 const s=normalizeAi(query);
 const match=s.match(/\b(?:parcelad[ao]s?\s+em|em)\s+(\d{1,2}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+vezes\b|\b(\d{1,2})\s*x\b|\b(\d{1,2})\s+parcelas?\b/);
 if(!match)return null;
 const n=numberValue(match[1]||match[2]||match[3]);
 return Number.isInteger(n)&&n>=2&&n<=60?n:null;
}
function purchaseName(query){
 const raw=String(query||'').trim();
 const match=raw.match(/\b(?:comprar|compro|adquirir|adquiro|gastar\s+com|investir\s+em)\s+(?:(?:um|uma|uns|umas|o|a|os|as)\s+)?(.+)/i);
 if(!match)return null;
 const name=match[1].split(/\s+(?:m[eê]s\s+que\s+vem|pr[oó]ximo\s+m[eê]s|daqui\s+a|dentro\s+de|em\s+(?:\d+|um|dois|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+m[eê]s|em\s+(?:janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)|(?:de|por)\s+(?:r\$\s*)?\d|parcelad[ao]s?\s+em|em\s+\d+\s+vezes|por\s+r\$|que\s+custa|custando|como\s+vai|qual\s+ser[aá]|quanto\s+vai|se\s+o\s+saldo|com\s+meu|e\s+gastar\s+r\$)/i)[0];
 return name.replace(/[!?.,;:]+$/g,'').trim().slice(0,65)||null;
}
const wantsBuy=s=>/\b(?:comprar|compro|comprarei|adquirir|adquiro|gastar\s+com|investir\s+em)\b/.test(s);
const wantsForecast=s=>/(fluxo\s+de\s+caixa|saldo\s+(?:futuro|projetado|previsto)|projecao|previsao|como\s+(?:vai|estara|fica)\s+(?:o\s+)?(?:meu\s+)?(?:caixa|saldo)|quanto\s+(?:dinheiro\s+)?(?:vai|vou)\s+(?:me\s+)?(?:sobrar|ter)|posso\s+(?:comprar|gastar)|consigo\s+comprar|da\s+pra\s+comprar|vale\s+a\s+pena\s+comprar)/.test(s);
export function projectCash(db,asOf,targetMonth,bankCents){
 if(!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(targetMonth))throw Error('Mês inválido.');
 if(!Number.isSafeInteger(bankCents))throw Error('Saldo indisponível.');
 const paidByTitle=new Map();
 for(const p of db.payments||[])paidByTitle.set(p.titleId,(paidByTitle.get(p.titleId)||0)+p.amount);
 const end=monthEnd(targetMonth);
 let incoming=0,outgoing=0,overdue=0;
 for(const t of db.titles||[]){
  if(t.cancelled||t.due>end)continue;
  const remaining=Math.max(0,t.amount-(paidByTitle.get(t.id)||0));
  if(!remaining)continue;
  if(t.type==='income')incoming+=remaining;
  if(t.type==='expense'){outgoing+=remaining;if(t.due<asOf)overdue+=remaining;}
 }
 return {current:bankCents,incoming,outgoing,overdue,conservative:bankCents-outgoing,estimated:bankCents-outgoing+incoming};
}
const responseContext=(month,item,amount,extraIncome,installments,noOtherReceipts=false)=>({kind:'scenario',month,item,amount,extraIncome,installments,noOtherReceipts});
const validPrev=context=>context?.kind==='scenario'&&
 (context.month===null||/^\d{4}-(?:0[1-9]|1[0-2])$/.test(context.month))&&
 (context.amount===null||(Number.isSafeInteger(context.amount)&&context.amount>0))?context:null;
function installmentAmounts(total,count){
 const base=Math.floor(total/count),extra=total%count;
 return Array.from({length:count},(_,i)=>base+(i<extra?1:0));
}
export function answerScenario(db,question,{asOf,bankCents,context=null}={}){
 const today=asOf||new Date().toISOString().slice(0,10);
 const s=normalizeAi(question);
 const prev=validPrev(context),explicitMonth=readScenarioMonth(question,today);
 const itemExplicit=purchaseName(question);
 const isBuying=wantsBuy(s),isForecast=wantsForecast(s);
 const shortDateAnswer=!!explicitMonth&&s.length<=35;
 const shortPriceAnswer=!!prev&&/^(?:r\$\s*)?\d[\d.,]*(?:\s*reais?)?[.!?]?$/.test(s);
 const followup=!!prev&&(
  /^(?:e\s+|mas\s+|se\s+|no\s+|em\s+|daqui\s+|r\$\s*|custaria|custar|por\s+|dentro\s+de)/.test(s)||
  shortDateAnswer||shortPriceAnswer
 );
 if(!isBuying&&!isForecast&&!followup)return null;
 if(/\b(?:cadastrar|registrar|lancar|criar\s+(?:um|uma)\s+(?:titulo|lancamento))\b/.test(s)&&!isForecast)return null;
 const month=explicitMonth||(followup?prev.month:null);
 const conditionalIncome=readScenarioConditionalIncome(question);
 const incomingExtra=conditionalIncome??((followup&&!itemExplicit)?(prev.extraIncome||0):0);
 const explicitPrice=readScenarioAmount(question);
 // A NEW purchase never inherits an unrelated purchase price (calça -> iPhone).
 const amount=explicitPrice??((followup&&!itemExplicit)?prev.amount:null);
 const item=itemExplicit||((followup&&prev)?prev.item:null)||(isBuying?'compra':null);
 const installmentCount=readScenarioInstallments(question)??((followup&&!itemExplicit)?prev.installments:null);
 const noReceipts=/(?:se\s+(?:eu\s+)?nao\s+receber|sem\s+receber\s+nada|nenhum\s+recebimento|clientes\s+nao\s+pagarem)/.test(s);
 const noOtherReceipts=noReceipts?true:(conditionalIncome!==null?false:((followup&&!itemExplicit)?!!prev.noOtherReceipts:false));
 const scenario=responseContext(month,item,amount,noReceipts?0:incomingExtra,installmentCount,noOtherReceipts);
 if(!month)return {answer:'Para qual mês você quer fazer a simulação? Responda “mês que vem”, “daqui a três meses” ou informe um mês específico.',context:scenario};
 if(month<today.slice(0,7))return {answer:'Esse período já passou. Informe um mês atual ou futuro.',context:scenario};
 const p=projectCash(db,today,month,bankCents);
 const prefix='Projeção até o fim de '+monthLabel(month)+' (títulos cadastrados no GB+):\n'
  +'• Saldo bancário atual: '+brl(p.current)+'\n'
  +'• Despesas em aberto até lá: '+brl(p.outgoing)+'\n'
  +'• Recebimentos previstos cadastrados até lá: '+brl(p.incoming)+'\n'
  +'• Saldo projetado sem nova compra: '+brl(p.estimated)+'.';
 const caveat='\nSem contar os recebimentos previstos, o saldo seria '+brl(p.conservative)+'.';
 if(!item)return {answer:prefix+caveat+'\nRecebimentos futuros não são garantidos. A simulação não altera seu financeiro.',context:scenario};
 if(amount===null)return {answer:prefix+caveat+'\nQuanto estima gastar com '+item+'? Informe, por exemplo, “R$ 250”. Não vou reutilizar o preço de outra compra.',context:scenario};
 if(installmentCount){
  const values=installmentAmounts(amount,installmentCount);
  const [year,monthNum]=month.split('-').map(Number);
  const lastMonth=monthKey(year,monthNum,installmentCount-1);
  const firstExpected=(noOtherReceipts?p.conservative:p.estimated)-values[0]+scenario.extraIncome;
  const firstConservative=p.conservative-values[0]+scenario.extraIncome;
  const lastProjection=projectCash(db,today,lastMonth,bankCents);
  const lines=values.map((v,i)=>'• '+monthLabel(monthKey(year,monthNum,i))+': '+brl(v));
  const schedule=lines.length<=12?lines.join('\n'):[...lines.slice(0,5),'• … '+(lines.length-6)+' meses intermediários',lines.at(-1)].join('\n');
  return {answer:'Simulação de '+item+' em '+installmentCount+' parcelas, sem juros, com primeira parcela em '+monthLabel(month)+':\n'
   +schedule+'\nTotal da compra: '+brl(amount)+'.'
   +'\nSaldo projetado no primeiro mês, após a parcela: '+brl(firstExpected)+'.'
   +'\nSaldo conservador no primeiro mês, sem recebimentos cadastrados: '+brl(firstConservative)+'.'
   +'\nSaldo projetado ao fim das parcelas ('+monthLabel(lastMonth)+'): '+brl((noOtherReceipts?lastProjection.conservative:lastProjection.estimated)-amount+scenario.extraIncome)+'.'
   +(scenario.extraIncome?'\nRecebimento hipotético adicional considerado: '+brl(scenario.extraIncome)+'.':'')
   +'\nPressupostos: sem juros ou taxas, parcelas mensais e nenhuma outra compra não cadastrada. É uma simulação, não criei lançamento.',context:scenario};
 }
 const adjusted=(noOtherReceipts?p.conservative:p.estimated)+scenario.extraIncome-amount,prudent=p.conservative+scenario.extraIncome-amount;
 const extra=scenario.extraIncome?'\n• Recebimento hipotético ADICIONAL informado: '+brl(scenario.extraIncome)+'.'
   +'\n• Atenção: só some esse valor se ele ainda NÃO estiver entre os recebimentos cadastrados.':'';
 return {answer:prefix+extra
  +'\n• Compra simulada de '+item+': '+brl(amount)+' (à vista em '+monthLabel(month)+').'
  +'\n• Saldo projetado com a compra'+(scenario.extraIncome?' e o recebimento hipotético':'')+(noOtherReceipts?', sem outros recebimentos futuros':'')+': '+brl(adjusted)+'.'
  +'\n• Cenário conservador, sem outros recebimentos futuros: '+brl(prudent)+'.'
  +(prudent<0?'\nAtenção: no cenário conservador faltariam '+brl(-prudent)+'.':'')
  +'\nSimulação apenas; não criei lançamento nem alterei seus dados. Recebimentos futuros não são garantidos.',context:scenario};
}
