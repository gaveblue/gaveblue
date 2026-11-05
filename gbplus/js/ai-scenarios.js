// Offline GB+ financial scenarios. No external API and no writes.
// All money is integer centavos; a future receivable is a possibility, not cash in bank.
const MONTH_NAMES=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const WORD_NUMBERS={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12};
const brl=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
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
 return MONTH_NAMES[m-1]+' de '+y;
};
const numberValue=word=>/^\d+$/.test(word)?Number(word):WORD_NUMBERS[word]||null;

export function readScenarioMonth(query,asOf){
 const s=normalizeAi(query),[year,month]=asOf.slice(0,7).split('-').map(Number);
 if(/(?:este|nesse|neste|atual)\s+mes/.test(s))return monthKey(year,month);
 if(/(?:mes\s+que\s+vem|proximo\s+mes|mes\s+seguinte)/.test(s))return monthKey(year,month,1);
 const relative=s.match(/(?:daqui\s+a|em|dentro\s+de|apos|para\s+daqui\s+a)\s+(\d{1,2}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+mes(?:es)?\b/);
 if(relative){
  const count=numberValue(relative[1]);
  return count>=0&&count<=60?monthKey(year,month,count):null;
 }
 const named=s.match(/\b(?:em|no|para|ate|durante)\s+(?:o\s+mes\s+de\s+)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+(\d{4}))?\b/);
 if(named){
  let targetYear=named[2]?Number(named[2]):year;
  const targetMonth=MONTH_NAMES.indexOf(named[1])+1;
  if(!named[2]&&targetMonth<month)targetYear++;
  return targetYear>=year&&targetYear<=year+5?monthKey(targetYear,targetMonth):null;
 }
 return null;
}
export function readScenarioAmount(query){
 const s=String(query||'');
 const match=s.match(/(?:r\$\s*)([\d.]+(?:,\d{1,2})?)|([\d.]+(?:,\d{1,2})?)\s*(?:reais|real)\b|(?:cust(?:a|ar|aria)|preco\s+(?:de|e)|valor\s+de)\s*(?:r\$\s*)?([\d.]+(?:,\d{1,2})?)/i);
 if(!match)return null;
 const raw=(match[1]||match[2]||match[3]).replace(/\./g,'').replace(',','.');
 const n=Number(raw);
 return Number.isFinite(n)&&n>0&&Number.isSafeInteger(Math.round(n*100))&&n*100<=1e12?Math.round(n*100):null;
}
function purchaseName(query){
 const s=normalizeAi(query);
 const match=s.match(/(?:comprar|compro|adquirir|adquiro|gastar\s+com|investir\s+em)\s+(?:(?:uma?|umas?|uns?|o|a|os|as)\s+)?(.+)/);
 if(!match)return null;
 const name=match[1].split(/\s+(?:(?:mes\s+que\s+vem|proximo\s+mes|daqui\s+a|dentro\s+de|em\s+(?:\d+|um|dois|tres)\s+mes|em\s+(?:janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)|por\s+r\$|por\s+\d+\s+reais|que\s+custa|custando|como\s+vai|qual\s+sera|quanto\s+vai|se\s+o\s+saldo|com\s+meu))\b/)[0];
 const trimmed=name.replace(/[!?.,;:]+$/g,'').trim().slice(0,65);
 return trimmed||null;
}
const wantsBuy=s=>/\b(comprar|compro|comprarei|adquirir|adquiro|gastar\s+com|investir\s+em)\b/.test(s);
const wantsForecast=s=>/(fluxo\s+de\s+caixa|saldo\s+(?:futuro|projetado|previsto)|projecao|previsao|como\s+(?:vai|estara|fica)\s+(?:o\s+)?(?:meu\s+)?(?:caixa|saldo)|quanto\s+(?:vai|vou)\s+(?:sobrar|ter)|posso\s+(?:comprar|gastar)|da\s+pra\s+comprar|vale\s+a\s+pena\s+comprar)/.test(s);

export function projectCash(db,asOf,targetMonth,bankCents){
 if(!/^\d{4}-\d{2}$/.test(targetMonth))throw Error('Mês inválido.');
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
export function answerScenario(db,question,{asOf,bankCents,context=null}={}){
 const today=asOf||new Date().toISOString().slice(0,10);
 const normalized=normalizeAi(question);
 const prev=context?.kind==='scenario'?context:null;
 const followup=!!prev&&(/^(?:e\s+|mas\s+|se\s+|quanto\s+|no\s+|em\s+|daqui\s+|r\$|custaria|custar|por\s+)/.test(normalized));
 const buying=wantsBuy(normalized),forecast=wantsForecast(normalized);
 if(!buying&&!forecast&&!followup)return null;
 // A question about creating a title is not permission to simulate or write one.
 if(/\b(cadastrar|registrar|lancar|criar\s+(?:um|uma)\s+(?:titulo|lancamento))\b/.test(normalized)&&!forecast)return null;
 const month=readScenarioMonth(question,today)||prev?.month||null;
 const amount=readScenarioAmount(question)??(prev?.amount??null);
 const item=purchaseName(question)||prev?.item||(buying?'compra':null);
 const scenario={kind:'scenario',month,item,amount};
 if(!month)return {answer:'Para qual mês você quer fazer a projeção? Pode dizer “mês que vem” ou “daqui a três meses”. Não vou estimar datas sem você informar.',context:scenario};
 if(month<today.slice(0,7))return {answer:'Essa data já passou. Informe um mês atual ou futuro para simular.',context:scenario};
 const p=projectCash(db,today,month,bankCents);
 const prefix='Projeção até o fim de '+monthLabel(month)+' (somente títulos cadastrados no GB+):\n'
  +'• Saldo bancário atual: '+brl(p.current)+'\n'
  +'• Despesas ainda pendentes até lá: '+brl(p.outgoing)+'\n'
  +'• Recebimentos previstos até lá: '+brl(p.incoming)+'\n'
  +'• Saldo projetado sem nova compra: '+brl(p.estimated)+'.';
 const caveat='\nOs recebimentos previstos podem não acontecer nas datas indicadas. Sem contar esses recebimentos, o saldo seria '+brl(p.conservative)+'.';
 if(!item)return {answer:prefix+caveat+'\nIsto é uma projeção, não uma garantia de saldo futuro.',context:scenario};
 if(amount===null)return {answer:prefix+caveat+'\nQuanto você estima gastar com '+item+'? Diga um valor, como “R$ 250”, para comparar os cenários.',context:scenario};
 const adjusted=p.estimated-amount,prudent=p.conservative-amount;
 return {answer:prefix+'\n• Compra simulada de '+item+': '+brl(amount)+' (à vista no mês informado).'
  +'\n• Saldo projetado com a compra: '+brl(adjusted)+'.'
  +'\n• Cenário conservador com a compra (sem recebimentos previstos): '+brl(prudent)+'.'
  +(prudent<0?'\nAtenção: no cenário conservador faltariam '+brl(-prudent)+' para cobrir os compromissos.':'')
  +'\nSimulação apenas; não criei lançamento nem alterei seus dados. Datas e recebimentos efetivos podem mudar.',context:scenario};
}
