import {answerFAQ} from './faq.js?v=50-20261103';
// GB+ AI Lab: deterministic offline test adapter. No production data or writes.
export const fixture=Object.freeze({balance:500000,payable:280000,receivable:120000});
export const formatBRL=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const lower=s=>s.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const n=s=>{if(!s)return null;const v=Number(s.replace(/\./g,'').replace(',','.'));return Number.isFinite(v)?Math.round(v*100):null;};
const dateFromDay=d=>{const now=new Date(),y=now.getFullYear(),m=now.getMonth();let target=new Date(y,m,Number(d),12);if(target.getMonth()!==m)return null;if(target<new Date(y,m,now.getDate(),0))target=new Date(y,m+1,Number(d),12);if(target.getDate()!==Number(d))return null;return [target.getFullYear(),String(target.getMonth()+1).padStart(2,'0'),String(target.getDate()).padStart(2,'0')].join('-');};
export function interpret(message,context=null,data=fixture){
 const greeting=lower(message.trim()).replace(/[!?.…]+$/g,'').trim();
 if(/^(?:oi+|ola+|opa|e ai|bom dia|boa tarde|boa noite|ol[aá],? tudo bem|oi,? tudo bem|tudo bem|tudo bom)$/.test(greeting)){
  const response=greeting.includes('bom dia')?'Bom dia!':greeting.includes('boa tarde')?'Boa tarde!':greeting.includes('boa noite')?'Boa noite!':'Olá!';
  return {intent:'saudacao',status:'answered',answer:response+' Como posso ajudar com suas finanças no GB+? Posso consultar saldos, contas a pagar e a receber ou preparar lançamentos para você.'};
 }
 const s=lower(message.trim()),amountMatch=s.match(/(?:r\$\s*)?([\d.]+(?:,\d{1,2})?)\s*(?:reais|real)?/),value=amountMatch?n(amountMatch[1]):null;
 const day=s.match(/(?:dia|vencimento(?:\s+(?:para|no|em))?)\s*(\d{1,2})(?!\d)/);
 const count=s.match(/(?:por|durante|em|repete|repetir|divide|dividir|parcela(?:do)?\s+em)\s*(\d{1,3})\s*(meses|vezes|parcelas)?/);
 const words={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,doze:12};
 const wordCount=s.match(/(?:por|durante|em|repete|divide|dividir)\s+(um|uma|dois|duas|tres|quatro|cinco|seis|doze)\s*(?:meses|vezes|parcelas)?/);
 const qty=count?Number(count[1]):wordCount?words[wordCount[1]]:1;
 const isRecurring=/repete|recorrent|todo mes|todos os meses|mensal|durante\s+\w+\s+meses/.test(s);
 const isInstallment=/parcel|divide|dividir/.test(s);
 if(context?.proposal && /corrig|muda|altera|nao falei|na verdade|troca/.test(s)){
  const p={...context.proposal};if(value!==null)p.amountCents=value;if(day)p.due=dateFromDay(day[1]);return {intent:'corrigir_previa',status:'ready',proposal:p,answer:'Atualizei a prévia. Confira os dados e confirme apenas se estiverem corretos.'};
 }
 if(/quanto.*(?:disponivel|posso gastar|sobrando)|saldo.*disponivel/.test(s)){const available=data.balance-data.payable;return {intent:'consultar_disponibilidade',status:'answered',answer:'Neste cenário fictício, o saldo atual é '+formatBRL(data.balance)+'. Reservando '+formatBRL(data.payable)+' para contas a pagar, a disponibilidade conservadora é '+formatBRL(available)+'. Se todos os recebíveis previstos entrarem, o saldo projetado seria '+formatBRL(available+data.receivable)+'. Não é uma recomendação automática de compra.'};}
 if(/saldo|quanto (?:eu )?tenho (?:na conta|no banco|em caixa)|qual (?:e )?meu saldo/.test(s))return {intent:'consultar_saldo',status:'answered',answer:'No modo demonstrativo, seu saldo fictício é '+formatBRL(data.balance)+'. Para consultar o saldo real, preciso acessar os registros da sua conta GB+.'};
 if(/quanto.*receber|contas? a receber/.test(s))return {intent:'consultar_recebiveis',status:'answered',answer:'No cenário fictício, há '+formatBRL(data.receivable)+' a receber. Não são valores já disponíveis no banco.'};
 if(/quanto.*pagar|contas? a pagar/.test(s))return {intent:'consultar_pagaveis',status:'answered',answer:'No cenário fictício, há '+formatBRL(data.payable)+' em contas a pagar.'};
 if(/venc|proximas contas/.test(s)&&!/lan[cç]|cria|cadastra|registra/.test(s))return {intent:'consultar_vencimentos',status:'unsupported',reason:'Os dados fictícios incluem apenas totais, sem títulos e datas individuais.',answer:'Ainda não tenho uma lista de vencimentos neste laboratório. Não vou inventar datas.'};
 if(/lan[cç]|cria|cadastra|registra|despesa|receita|parcela|divide/.test(s)){
  const type=/receita|receber|entrada/.test(s)?'income':'expense';
  const description=/energia|luz/.test(s)?'Energia elétrica':/manuten[cç]/.test(s)?'Manutenção':/internet/.test(s)?'Internet':/aluguel/.test(s)?'Aluguel':'Lançamento informado por mensagem';
  const mode=isRecurring?'recurring':isInstallment?'installment':'single';
  const missing=[];if(value===null||value<=0)missing.push('valor');if(!day)missing.push('dia do vencimento');if(qty<1||qty>120)missing.push('quantidade válida (1 a 120)');
  const partner=s.match(/(?:fornecedor|cliente|parceiro)\s+([\p{L}\d .-]+)/u)?.[1]?.trim()||null;
  const proposal={type,description,amountCents:value,due:day?dateFromDay(day[1]):null,mode,count:qty,partner};
  if(proposal.due===null&&!missing.includes('dia do vencimento'))missing.push('data de vencimento válida');
  if(missing.length)return {intent:'preparar_lancamento',status:'needs_clarification',missing,context:{proposal},reason:'Não há gravação; o protótipo não completa dados ausentes por suposição.',answer:'Entendi que você quer preparar um lançamento, mas faltam: '+missing.join(', ')+'. Pode informar esses dados?'};
  return {intent:'preparar_lancamento',status:'ready',proposal,answer:'Preparei uma prévia fictícia. Confira os campos antes de confirmar a simulação. Nenhum dado será gravado.'};
 }
 const faq=answerFAQ(message,data);if(faq)return faq;
 return {intent:'nao_identificada',status:'unsupported',reason:'Interpretador local experimental, sem modelo de linguagem conectado.',answer:'Ainda não consigo interpretar essa solicitação. Este é o teste local; a versão com modelo de IA deverá entender variações mais livres, respeitando as funções do GB+.'};
}
