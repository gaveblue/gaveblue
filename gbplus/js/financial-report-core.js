// GB+ 3.0.7 — importação supervisionada de títulos, separada da conciliação bancária.
export const REPORT_KINDS={receivable:'Contas a receber',payable:'Contas a pagar',received:'Contas recebidas'};
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
export const fold=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ');
const keyHeader=s=>fold(s).replace(/ /g,'');
export function brlCents(value){
 if(typeof value==='number'){if(!Number.isFinite(value)||value<0)throw Error('Valor inválido.');return Math.round(value*100);}
 const s=clean(value).replace(/R\$\s*/gi,'').replace(/\s/g,'').replace(/[^\d.,-]/g,'');
 if(!s||s==='-')throw Error('Valor ausente.');
 let decimal=s;
 if(s.includes(',')&&s.includes('.')) decimal=s.replace(/\./g,'').replace(',','.');
 else if(s.includes(','))decimal=s.replace(',','.');
 else if((s.match(/\./g)||[]).length>1||/^\d{1,3}(?:\.\d{3})+$/.test(s))decimal=s.replace(/\./g,'');
 const n=Number(decimal);if(!Number.isFinite(n)||n<0||n>1e10)throw Error('Valor fora do limite.');
 return Math.round(n*100);
}
export function isoDate(v){
 if(v===null||v===undefined||v===''||v==='-')return '';
 if(typeof v==='number'&&Number.isFinite(v)&&v>=1&&v<100000){
  return new Date(Date.UTC(1899,11,30)+Math.floor(v)*86400000).toISOString().slice(0,10);
 }
 const s=clean(v);
 if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
 const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
 if(m)return m[3]+'-'+m[2]+'-'+m[1];
 return '';
}
const column=(header,names)=>{const keys=header.map(keyHeader);return names.map(keyHeader).map(n=>keys.indexOf(n)).find(i=>i>=0)??-1;};
const requireCol=(header,names)=>{const i=column(header,names);if(i<0)throw Error('Coluna obrigatória ausente: '+names[0]+'. Exporte o relatório com cabeçalhos.');return i;};
const value=(row,index)=>index>=0?row[index]:'';
const goodDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
function reportRecord(kind,raw){
 const r={kind,reference:clean(raw.reference).slice(0,100),invoice:clean(raw.invoice).slice(0,80),
 partner:clean(raw.partner).slice(0,200),issue:isoDate(raw.issue),due:isoDate(raw.due),
 paymentDate:isoDate(raw.paymentDate),status:raw.status==='paid'?'paid':'open',
 amount:brlCents(raw.amount),principal:raw.principal==null?null:brlCents(raw.principal),
 interest:raw.interest==null?0:brlCents(raw.interest),source:clean(raw.source).slice(0,120),
 method:clean(raw.method).slice(0,60),notes:clean(raw.notes).slice(0,450)};
 if(!r.partner||!goodDate(r.due)||!Number.isSafeInteger(r.amount)||r.amount<1)throw Error('Registro sem parceiro, vencimento ou valor válido.');
 if(r.issue&&!goodDate(r.issue))throw Error('Data de negociação inválida.');
 if(r.status==='paid'&&(!goodDate(r.paymentDate)))throw Error('Recebimento/pagamento sem data válida.');
 const basis=[kind,r.reference,r.invoice,r.partner.toLowerCase(),r.due,r.amount].join('|');
 r.sourceKey='gbr-'+hash(basis);
 return r;
}
export function normalizeTabularReport(kind,rows){
 if(!REPORT_KINDS[kind])throw Error('Tipo de relatório não reconhecido.');
 if(!rows?.length)throw Error('O arquivo não contém linhas.');
 let headerIndex=rows.findIndex(row=>Array.isArray(row)&&row.some(x=>['parceiro','razao social','sacado'].includes(fold(x))));
 if(headerIndex<0||headerIndex>15)throw Error('Cabeçalhos do relatório não encontrados. Confira o tipo escolhido.');
 const header=rows[headerIndex].map(clean),body=rows.slice(headerIndex+1);
 const partnerIndex=requireCol(header,kind==='receivable'?['Razão Social','Parceiro','Cliente']:kind==='payable'?['Parceiro','Fornecedor','Razão Social']:['Sacado','Cliente','Parceiro']);
 const amountIndex=requireCol(header,kind==='received'?['Vlr. Cobrado','Valor recebido','Valor liquidado','Valor']:['Valor','Valor (R$)','Valor original']);
 const dueIndex=requireCol(header,['Vencimento','Data vencimento','Vcto']);
 const refIndex=column(header,kind==='receivable'?['Número Financeiro','Financeiro','Título']:kind==='payable'?['Financeiro','Numero financeiro','Título']:['Nosso Número','Nosso numero']);
 const invoiceIndex=column(header,kind==='received'?['Seu Número','Seu numero','Número']:['Nota','Número da NF','NF','Documento']);
 const issueIndex=column(header,['Negociação','Emissão','Emissao']);
 const datePaidIndex=column(header,['Data Pagamento','Data baixa','Dt. Liquid.','Liquidação','Data liquidação']);
 const statusIndex=column(header,['Situação','Situacao','Status','Ocorrência','Ocorrencia']);
 const principalIndex=column(header,['Valor (R$)','Valor original','Principal']);
 const interestIndex=column(header,['Vlr. Mora','Juros','Mora']);
 const methodIndex=column(header,['Tipo','Forma de pagamento','Modalidade']);
 const sellerIndex=column(header,['Vendedor']);
 const reconciliationIndex=column(header,['Conciliação','Conciliacao']);
 const settlementAccountIndex=column(header,['Conta da Baixa','Conta pagamento']);
 const provisionIndex=column(header,['Provisão','Provisao']);
 const results=[],excluded=[],warnings=[];
 for(const row of body){
  if(!Array.isArray(row)||row.every(v=>v===null||v===undefined||clean(v)===''))continue;
  const name=clean(value(row,partnerIndex));
  if(!name||/^total\b/i.test(name))continue;
  const status=fold(value(row,statusIndex));
  if(kind==='received'&&(/baixa/.test(status)&&!/liquid/.test(status))){excluded.push({partner:name,amount:clean(value(row,amountIndex)),reason:'Baixa bancária, sem liquidação comprovada'});continue;}
  if(kind==='received'&&status&& !/(liquid|recebid|pago)/.test(status)){excluded.push({partner:name,amount:clean(value(row,amountIndex)),reason:'Sem liquidação confirmada no relatório'});continue;}
  try{
   const paid=kind==='received'||/^(pago|recebido|liquidado)$/.test(status);
   const issued=isoDate(value(row,issueIndex));
   const date=isoDate(value(row,datePaidIndex));
   const amount=value(row,amountIndex);
   const principal=kind==='received'&&principalIndex>=0&&principalIndex!==amountIndex?value(row,principalIndex):null;
   results.push(reportRecord(kind,{partner:name,reference:value(row,refIndex),invoice:value(row,invoiceIndex),due:value(row,dueIndex),
    issue:issued,paymentDate:paid?date:'',status:paid?'paid':'open',amount,principal,
    interest:kind==='received'&&interestIndex>=0?value(row,interestIndex):0,
    method:value(row,methodIndex),source:'Planilha',notes:[
     clean(value(row,sellerIndex))?'Vendedor: '+clean(value(row,sellerIndex)):'',
     clean(value(row,reconciliationIndex))?'Conciliação: '+clean(value(row,reconciliationIndex)):'',
     clean(value(row,settlementAccountIndex))?'Conta da baixa: '+clean(value(row,settlementAccountIndex)):'',
     clean(value(row,provisionIndex))?'Provisão: '+clean(value(row,provisionIndex)):'',
     clean(value(row,statusIndex))?'Situação: '+clean(value(row,statusIndex)):''
    ].filter(Boolean).join(' · ')}));
  }catch(e){excluded.push({partner:name,amount:clean(value(row,amountIndex)),reason:e.message});}
 }
 if(!results.length)throw Error('Nenhum título válido foi identificado. Confira o formato e as colunas.');
 if(excluded.length)warnings.push('Algumas linhas foram separadas para conferência; nenhuma será importada automaticamente.');
 return {kind,records:results,excluded,warnings,sourceFormat:'Planilha'};
}
export function normalizeSicoobPositionedPages(pages){
 const records=[],excluded=[],warnings=[];
 let liquidatedSum=0,downSum=0;
 for(const page of pages){
  const items=(page.items||[]).filter(t=>clean(t.str)).map(t=>({str:clean(t.str),x:Number(t.x)||0,y:Number(t.y)||0})).sort((a,b)=>b.y-a.y||a.x-b.x);
  const headers=items.filter(i=>i.x<180&&/^(58|68|82|212|215)\s*-\s*/.test(i.str));
  const refs=items.filter(i=>i.x>=180&&i.x<261&&/^\d{5,7}-\d$/.test(i.str));
  for(const ref of refs){
   const h=headers.filter(k=>k.y>ref.y-1).sort((a,b)=>a.y-b.y)[0];
   const group=Number(h?.str.match(/^\d+/)?.[0]||0);
   if(![58,68,82,212,215].includes(group))continue;
   const near=(a,b,dy=9)=>items.filter(i=>i.x>=a&&i.x<b&&Math.abs(i.y-ref.y)<=dy);
   const at=(a,b)=>near(a,b).sort((a,b)=>Math.abs(a.y-ref.y)-Math.abs(b.y-ref.y))[0]?.str||'';
   const name=near(26,177,13).filter(i=>!/^(Sacado|Total|Grupo|Pgto)/i.test(i.str)).sort((a,b)=>b.y-a.y||a.x-b.x).map(i=>i.str).join(' ');
   const raw={partner:name,reference:ref.str,invoice:at(262,325),due:at(417,510),
    issue:'',paymentDate:at(705,757),status:'paid',
    amount:at(755,841),principal:at(530,581),interest:at(581,623),source:'Sicoob · ocorrência '+group,
    method:group===212?'Pix':group===68?'Débito em conta':group===215?'Intercredis':group===58?'Compensação':'Pedido cedente'};
   if(group===82){
    try{downSum+=brlCents(raw.amount);}catch{}
    excluded.push({partner:name||'Não identificado',amount:raw.amount,reason:'82 — baixa a pedido do cedente: não é recebimento',reference:ref.str});continue;
   }
   try{
    const out=reportRecord('received',raw);records.push(out);liquidatedSum+=out.amount;
   }catch(e){excluded.push({partner:name||'Não identificado',amount:raw.amount,reason:'Linha de liquidação incompleta: '+e.message,reference:ref.str});}
  }
 }
 if(!records.length)throw Error('Não foram encontradas liquidações válidas. Confira se o PDF é do relatório de títulos do Sicoob.');
 if(excluded.some(e=>e.reason.startsWith('Linha')))warnings.push('Há liquidações com campos ilegíveis. Confira o PDF antes de importar.');
 return {kind:'received',records,excluded,warnings,sourceFormat:'PDF Sicoob',bankTotals:{liquidated:liquidatedSum,administrative:downSum}};
}
export function normalizeReceivableOcr(text){
 const records=[],excluded=[];
 for(const raw of String(text||'').split(/\r?\n/)){
  const line=clean(raw);const m=line.match(/^(\d{4,9})\s+(\d{1,10})\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(?:R\$\s*)?([\d.,]+)$/);
  if(!m)continue;
  try{records.push(reportRecord('receivable',{reference:m[1],invoice:m[2],partner:m[3],issue:m[4],due:m[5],amount:m[6],source:'PDF digitalizado · OCR',notes:'OCR pode incluir vendedor no nome. Conferência obrigatória.'}));}
  catch(e){excluded.push({partner:line,reason:e.message,amount:''});}
 }
 if(!records.length)throw Error('Não consegui identificar as colunas do PDF digitalizado. Exporte este relatório em Excel/CSV para importar sem risco.');
 return {kind:'receivable',records,excluded,warnings:['Este PDF foi lido por OCR. Confira nomes, notas, datas e valores antes de importar. O nome pode conter o vendedor.'],sourceFormat:'PDF · OCR',needsOcrReview:true};
}
export function editReportRecord(record,patch){
 const copy={...record,...patch,
  amount:patch.amount===undefined?record.amount/100:patch.amount,
  principal:record.principal==null?null:record.principal/100,
  interest:record.interest/100};
 return reportRecord(record.kind,copy);
}
export function reportDuplicates(db,rows){
 const seen=new Set();
 return rows.map(r=>{
  const sameFile=seen.has(r.sourceKey);seen.add(r.sourceKey);
  const imported=(db.titles||[]).some(t=>t.importKey===r.sourceKey);
  const exact=(db.titles||[]).some(t=>{
   if(t.type!==(r.kind==='payable'?'expense':'income')||t.due!==r.due)return false;
   const digits=s=>String(s||'').replace(/\D/g,'');
   const doc=digits(t.document),refs=[digits(r.reference),digits(r.invoice)].filter(Boolean);
   const documentMatch=doc&&refs.includes(doc);
   const partnerName=(db.partners||[]).find(p=>p.id===t.partnerId)?.name||t.description||'';
   const partnerMatch=fold(partnerName).includes(fold(r.partner))||fold(r.partner).includes(fold(partnerName));
   return (documentMatch&&(t.amount===r.amount||t.amount===r.principal||r.kind==='received'))||
    (partnerMatch&&(t.amount===r.amount||r.principal!=null&&t.amount===r.principal));
  });
  return {...r,duplicate:sameFile||imported||exact,duplicateReason:sameFile?'Repetido no arquivo':imported?'Já importado':'Possível título já existente'};
 });
}
export function reportTotals(rows){
 return {count:rows.length,total:rows.reduce((s,r)=>s+r.amount,0),paid:rows.filter(r=>r.status==='paid').length,pending:rows.filter(r=>r.status!=='paid').length};
}
export function applyFinancialReport(db,rows,options,generateId,today){
 if(!Array.isArray(rows)||!rows.length||rows.length>1000)throw Error('Selecione de 1 a 1.000 títulos.');
 const kind=options.kind;if(!REPORT_KINDS[kind]||rows.some(r=>r.kind!==kind))throw Error('O tipo de relatório mudou.');
 const type=kind==='payable'?'expense':'income';
 if(!db.categories.some(c=>c.id===options.categoryId&&c.type===type))throw Error('Selecione uma categoria de '+(type==='income'?'receita':'despesa')+'.');
 const requiresPayment=rows.some(r=>r.status==='paid');
 if(requiresPayment&&!db.accounts.some(a=>a.id===options.accountId&&a.active!==false))throw Error('Selecione uma conta ativa para os títulos já pagos/recebidos.');
 if(!options.explicitConfirmed)throw Error('Confira e confirme a importação antes de gravar.');
 const existing=reportDuplicates(db,rows);
 if(existing.some(r=>r.duplicate))throw Error('Um ou mais títulos já foram lançados ou importados. Atualize a prévia.');
 let count=0,settlements=0;
 for(const r of rows){
  if(!r.reference&&!r.invoice)throw Error('Registro sem identificador de documento.');
  if(!goodDate(r.due)||r.amount<1||!Number.isSafeInteger(r.amount))throw Error('Título inválido.');
  if(r.status==='paid'&&(!goodDate(r.paymentDate)||r.paymentDate>today))throw Error('Data de baixa inválida ou futura.');
  let partner=db.partners.find(p=>fold(p.name)===fold(r.partner));
  if(!partner&&options.createPartners){
   partner={id:generateId(),name:r.partner.slice(0,200),tradeName:'',document:'',phone:'',email:'',address:'',notes:'',active:true,roles:[type==='income'?'Cliente':'Fornecedor']};
   db.partners.push(partner);
  }
  const document=(kind==='received'?r.reference:(r.invoice||r.reference)).slice(0,100);
  const memo=[r.source,r.reference?'Financeiro/Nosso nº '+r.reference:'',r.invoice?'NF/Seu nº '+r.invoice:'',
   r.method?'Forma: '+r.method:'',r.principal!=null?'Principal: '+(r.principal/100).toFixed(2):'',
   r.interest?'Mora: '+(r.interest/100).toFixed(2):'',r.notes].filter(Boolean).join(' · ').slice(0,2000);
  const id=generateId();
  db.titles.push({id,type,description:(r.partner+' · '+(kind==='received'?'Recebimento':kind==='payable'?'Conta a pagar':'Conta a receber')+(document?' '+document:'')).slice(0,300),
   document,notes:memo,amount:r.amount,issue:goodDate(r.issue)?r.issue:today,due:r.due,
   accountId:r.status==='paid'?options.accountId:'',partnerId:partner?.id||'',categoryId:options.categoryId,
   cancelled:false,mode:'single',sequence:1,count:1,groupId:null,importKey:r.sourceKey});
  if(r.status==='paid'){
   db.payments.push({id:generateId(),titleId:id,accountId:options.accountId,date:r.paymentDate,amount:r.amount});
   settlements++;
  }
  count++;
 }
 return {count,settlements};
}
