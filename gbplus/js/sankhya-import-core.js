// GB+ 3.0.8 — normalização de cadastros e movimentações financeiras Sankhya.
// Não altera o banco sem confirmação explícita; Nro Único é a chave do título.
import {fold,brlCents,isoDate} from './financial-report-core.js?v=20261110-307';
export const ERP_SOURCE='sankhya-fin-v1';
const trim=s=>String(s??'').trim();
const id=v=>{const s=trim(v);return /^\d+(?:\.0+)?$/.test(s)?s.replace(/\.0+$/,''):s;};
const positive=v=>{if(v===null||v===undefined||trim(v)==='')return 0;return Math.round(Number(v)*100);};
const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
const heading=s=>fold(s).replace(/ /g,'');
const findHeader=(rows,required)=>rows.findIndex((row,i)=>i<=15&&required.every(s=>row.some(v=>heading(v)===heading(s))));
const cell=(row,index)=>index<0?'':row[index];
const columns=(header,names)=>{
 const m=new Map(header.map((v,i)=>[heading(v),i]));
 return names.map(n=>m.get(heading(n))).find(i=>i!==undefined)??-1;
};
const required=(header,names)=>{const i=columns(header,names);if(i<0)throw Error('Coluna Sankhya ausente: '+names[0]);return i;};
function headerInfo(rows,mandatory){
 const start=findHeader(rows,mandatory);
 if(start<0)throw Error('Este arquivo não corresponde ao modelo Sankhya esperado. Verifique a linha de cabeçalho.');
 return {header:rows[start].map(trim),data:rows.slice(start+1)};
}
const fp=s=>{let v=2166136261;for(const c of s){v=Math.imul(v^c.charCodeAt(0),16777619);}return (v>>>0).toString(36);};
const doc=s=>trim(s).replace(/[^\d]/g,'');
export const partnerKey=code=>id(code);
export const movementKey=(company,unique)=>ERP_SOURCE+':e'+id(company)+':f'+id(unique);
export function parseErpPartners(rows){
 const {header,data}=headerInfo(rows,['Cód. Parceiro','Nome Parceiro','Razão social']);
 const cCode=required(header,['Cód. Parceiro']),cName=required(header,['Nome Parceiro']);
 const cLegal=columns(header,['Razão social']),cTax=columns(header,['CNPJ / CPF']),cActive=columns(header,['Ativo']);
 const cPerson=columns(header,['Tipo de pessoa']),cPrior=columns(header,['Cód. Sistema Anterior']);
 const cEmail=columns(header,['Email']),cPhone=columns(header,['Telefone']),cCell=columns(header,['Celular/Fax']);
 const cStreet=columns(header,['Nome (Endereço)']),cAddress=columns(header,['Endereço']);
 const cNumber=columns(header,['Número']),cComplement=columns(header,['Complemento']);
 const cNeighborhood=columns(header,['Nome (Bairro)']),cCity=columns(header,['Nome + UF (Cidade)']);
 const cZip=columns(header,['CEP']),cIdentity=columns(header,['Insc. Estadual / Identidade']);
 const cMatrix=columns(header,['Matriz']),cCreated=columns(header,['Data cadastramento']);
 const ignored=[],result=[],seen=new Set();
 for(const row of data){
  const code=id(cell(row,cCode)),name=trim(cell(row,cName));
  if(!code&&!name)continue;
  if(!/^\d{1,12}$/.test(code)||!name){ignored.push({code,name,reason:'Código ou nome ausente/inválido'});continue;}
  if(seen.has(code)){ignored.push({code,name,reason:'Código repetido dentro da planilha'});continue;}
  seen.add(code);
  const attrs={};
  // Preserve all Sankhya columns including fiscal ones, without introducing
  // 53 editable fields into the daily finance form.
  header.forEach((key,i)=>{const raw=cell(row,i);if(!key||raw===null||raw===undefined||trim(raw)==='')return;
   const val=trim(raw);attrs[key.slice(0,100)]=val.slice(0,300);});
  const street=trim(cell(row,cStreet))||trim(cell(row,cAddress));
  const address=[street,trim(cell(row,cNumber)),trim(cell(row,cComplement)),trim(cell(row,cNeighborhood)),trim(cell(row,cCity))].filter(Boolean).join(', ');
  const active=heading(cell(row,cActive))!=='nao';
  result.push({code,name:name.slice(0,200),legalName:trim(cell(row,cLegal)).slice(0,200),
   document:trim(cell(row,cTax)).slice(0,100),personType:trim(cell(row,cPerson)).slice(0,50),
   legacyCode:id(cell(row,cPrior)).slice(0,40),matrixCode:id(cell(row,cMatrix)).slice(0,40),
   phone:trim(cell(row,cPhone)).slice(0,100),mobile:trim(cell(row,cCell)).slice(0,100),
   email:trim(cell(row,cEmail)).slice(0,200),identity:trim(cell(row,cIdentity)).slice(0,100),
   zip:trim(cell(row,cZip)).slice(0,20),street:street.slice(0,200),number:trim(cell(row,cNumber)).slice(0,50),
   complement:trim(cell(row,cComplement)).slice(0,120),neighborhood:trim(cell(row,cNeighborhood)).slice(0,120),
   city:trim(cell(row,cCity)).slice(0,150),address:address.slice(0,2000),active,
   created:isoDate(cell(row,cCreated)),attributes:attrs});
 }
 if(!result.length)throw Error('Nenhum parceiro válido identificado.');
 return {kind:'partners',rows:result,ignored,headers:header,columns:header.length};
}
export function partnerDecisions(db,items){
 const byCode=new Map(),byDoc=new Map(),byName=new Map();
 for(const p of db.partners||[]){
  if(p.sankhyaCode)byCode.set(partnerKey(p.sankhyaCode),p);
  const tax=doc(p.document);
  if(tax&&tax!=='00000000000'&&tax!=='00000000000000'){
   if(!byDoc.has(tax))byDoc.set(tax,[]);
   byDoc.get(tax).push(p);
  }
  const name=fold(p.name);
  if(name){if(!byName.has(name))byName.set(name,[]);byName.get(name).push(p);}
 }
 return items.map(r=>{
  const sameCode=byCode.get(r.code);
  if(sameCode){
   if(doc(sameCode.document)&&doc(r.document)&&doc(sameCode.document)!==doc(r.document))
    return {...r,decision:'conflict',reason:'Código já cadastrado com CPF/CNPJ diferente'};
   return {...r,decision:'update',targetId:sameCode.id};
  }
  const tax=doc(r.document),taxMatches=(tax&&tax!=='00000000000'&&tax!=='00000000000000')?byDoc.get(tax)||[]:[];
  if(taxMatches.length===1&&!taxMatches[0].sankhyaCode)return {...r,decision:'match',targetId:taxMatches[0].id};
  if(taxMatches.length)return {...r,decision:'conflict',reason:'Documento vinculado a outro código ou várias pessoas'};
  const nameMatches=byName.get(fold(r.name))||[];
  if(nameMatches.length)return {...r,decision:'conflict',reason:'Mesmo nome já cadastrado sem correspondência de código/documento'};
  return {...r,decision:'create'};
 });
}
function roleFor(p){return p?.roles?.length?p.roles:['Outros'];}
function mergePartner(p,r,roles){
 const ext={source:ERP_SOURCE,code:r.code,legacyCode:r.legacyCode,legalName:r.legalName,
  personType:r.personType,identity:r.identity,zip:r.zip,street:r.street,number:r.number,
  complement:r.complement,neighborhood:r.neighborhood,city:r.city,mobile:r.mobile,
  matrixCode:r.matrixCode,created:r.created,attributes:r.attributes};
 p.sankhyaCode=r.code;p.sankhyaProfile=ext;
 p.name=r.name;p.tradeName=r.legalName&&r.legalName!==r.name?r.legalName:(p.tradeName||'');
 p.document=r.document||p.document||'';p.phone=r.phone||p.phone||'';
 p.email=r.email||p.email||'';p.address=r.address||p.address||'';
 p.active=r.active;p.roles=[...new Set([...roleFor(p),...(roles||[])])];
}
export function applyErpPartners(db,items,makeId,{confirmed=false}={}){
 if(!confirmed)throw Error('Confirme o cadastro antes de salvar.');
 if(!items.length||items.length>5000)throw Error('Selecione até 5.000 parceiros.');
 const decision=partnerDecisions(db,items);
 if(decision.some(r=>r.decision==='conflict'))throw Error('Há parceiros com códigos/documentos conflitantes. Corrija antes de importar.');
 const seen=new Set();for(const r of items){if(seen.has(r.code))throw Error('Código de parceiro repetido.');seen.add(r.code);}
 const result={created:0,updated:0,matched:0};
 for(const r of decision){
  if(r.decision==='create'){
   const p={id:makeId(),name:'',tradeName:'',document:'',phone:'',email:'',address:'',notes:'',active:true,roles:['Outros']};
   mergePartner(p,r);db.partners.push(p);result.created++;
  }else{
   const p=db.partners.find(p=>p.id===r.targetId);
   if(!p)throw Error('Parceiro associado não encontrado.');
   mergePartner(p,r);result[r.decision==='match'?'matched':'updated']++;
  }
 }
 return result;
}
const notesLabel=v=>id(v);
function accountCode(s){return trim(s).match(/C[oó]d\.?\s*Conta:\s*([\d]+)/i)?.[1]||'';}
export function parseErpMovements(rows,partnerItems=[]){
 const {header,data}=headerInfo(rows,['Nro Único','Parceiro','Receita/Despesa']);
 const cols={
  id:required(header,['Nro Único']),code:required(header,['Parceiro']),
  kind:required(header,['Receita/Despesa']),amount:required(header,['Vlr do Desdobramento']),
  net:required(header,['Valor Líquido']),due:required(header,['Dt. Vencimento']),
  invoice:columns(header,['Nro Nota']),company:columns(header,['Empresa']),
  issue:columns(header,['Dt. Negociação']),entry:columns(header,['Dt. Entrada e Saída']),
  paid:columns(header,['Data Baixa']),paidAmount:columns(header,['Vlr Baixa']),
  account:columns(header,['Conta Baixa']),interest:columns(header,['Vlr Juros']),
  penalty:columns(header,['Vlr Multa']),discount:columns(header,['Vlr Desconto']),
  history:columns(header,['Histórico']),origin:columns(header,['Origem']),
  operation:columns(header,['Tipo Operação']),center:columns(header,['Centro Resultado']),
  titleType:columns(header,['Tipo de Título']),seller:columns(header,['Vendedor']),
  late:columns(header,['Atraso (dias)'])
 };
 const rowsOut=[],ignored=[],seen=new Set(),accounts=new Map(),partnerNames=new Map(partnerItems.map(p=>[p.code,p.name]));
 for(const row of data){
  const unique=id(cell(row,cols.id)),code=id(cell(row,cols.code));
  if(!unique&&!code)continue;
  if(!/^\d{1,15}$/.test(unique)||!/^\d{1,12}$/.test(code)){ignored.push({unique,code,reason:'Título ou código do parceiro ausente'});continue;}
  const company=id(cell(row,cols.company))||'1',key=movementKey(company,unique);
  if(seen.has(key)){ignored.push({unique,code,reason:'Nro Único repetido no mesmo arquivo'});continue;}
  seen.add(key);
  const kindText=heading(cell(row,cols.kind));
  const kind=kindText==='receita'?'income':kindText==='despesa'?'expense':null;
  const due=isoDate(cell(row,cols.due)),issue=isoDate(cell(row,cols.issue)),entry=isoDate(cell(row,cols.entry));
  const paidDate=isoDate(cell(row,cols.paid));
  const principal=positive(cell(row,cols.amount)),net=Number(cell(row,cols.net));
  const paidAmount=positive(cell(row,cols.paidAmount));
  if(!kind||!validDate(due)||!Number.isSafeInteger(principal)||principal<1||!Number.isFinite(net)||
   (kind==='income'&&net<0)||(kind==='expense'&&net>0)){
   ignored.push({unique,code,reason:'Tipo, sinal, vencimento ou valor incoerente'});continue;
  }
  if(paidDate&&!validDate(paidDate)){ignored.push({unique,code,reason:'Data de baixa inválida'});continue;}
  const invoice=notesLabel(cell(row,cols.invoice)),bank=trim(cell(row,cols.account));
  const bankCode=accountCode(bank),typeCode=id(cell(row,cols.titleType));
  if(paidDate&&(!paidAmount||!Number.isSafeInteger(paidAmount))){
   ignored.push({unique,code,reason:'Título com data de baixa, mas sem valor de baixa'});continue;
  }
  if(paidDate){const acct=bankCode||'sem-conta';if(!accounts.has(acct))accounts.set(acct,{code:acct,label:bank||'Conta de baixa não informada',count:0});accounts.get(acct).count++;}
  rowsOut.push({key,unique,company,partnerCode:code,partnerName:partnerNames.get(code)||'',
   kind,principal,netCents:Math.round(net*100),paidAmount,paidDate,
   due,issue:issue||entry||due,entry,invoice,bankCode:bankCode|| (paidDate?'sem-conta':''),
   bankLabel:bank,operation:id(cell(row,cols.operation)),origin:trim(cell(row,cols.origin)),
   history:trim(cell(row,cols.history)).slice(0,300),center:id(cell(row,cols.center)),
   titleType:typeCode,seller:id(cell(row,cols.seller)),late:trim(cell(row,cols.late)),
   interest:positive(cell(row,cols.interest)),penalty:positive(cell(row,cols.penalty)),
   discount:positive(cell(row,cols.discount)),groupKey:'',sequence:1,count:1});
 }
 if(!rowsOut.length)throw Error('Nenhum movimento Sankhya válido encontrado.');
 // Invoice numbers may repeat across installments: group by partner + note +
 // negotiation date + operation + company + type, not invoice alone.
 const grouped=new Map();
 for(const r of rowsOut){
  if(!r.invoice)continue;
  const k=[r.company,r.partnerCode,r.invoice,r.issue,r.operation,r.kind].join('|');
  if(!grouped.has(k))grouped.set(k,[]);
  grouped.get(k).push(r);
 }
 for(const [k,partes] of grouped){
  if(partes.length<2)continue;
  if(partes.length>120){partes.forEach(r=>ignored.push({unique:r.unique,code:r.partnerCode,reason:'Série com mais de 120 parcelas: verificar manualmente'}));continue;}
  partes.sort((a,b)=>a.due.localeCompare(b.due)||Number(a.unique)-Number(b.unique));
  for(let i=0;i<partes.length;i++){partes[i].groupKey='erpinst-'+fp(k);partes[i].sequence=i+1;partes[i].count=partes.length;}
 }
 return {kind:'movements',rows:rowsOut,ignored,accounts:[...accounts.values()],
  total:rowsOut.reduce((s,r)=>s+r.principal,0),receipts:rowsOut.filter(r=>r.kind==='income').length,
  expenses:rowsOut.filter(r=>r.kind==='expense').length,source:ERP_SOURCE};
}
export function movementDecisions(db,items,now){
 const byKey=new Map((db.titles||[]).filter(t=>t.importKey?.startsWith(ERP_SOURCE+':')).map(t=>[t.importKey,t]));
 const partnerByCode=new Map((db.partners||[]).filter(p=>p.sankhyaCode).map(p=>[partnerKey(p.sankhyaCode),p]));
 const sameDoc=(r)=>(db.titles||[]).filter(t=>!t.importKey&&t.type===r.kind&&t.due===r.due&&
   String(t.document||'')===String(r.invoice||r.unique)&&t.amount===r.principal);
 return items.map(r=>{
  const partner=partnerByCode.get(r.partnerCode);
  if(!partner)return {...r,decision:'blocked',reason:'Código de parceiro '+r.partnerCode+' não cadastrado. Importe Parceiros.xlsx antes.'};
  const present=byKey.get(r.key),future=!!r.paidDate&&r.paidDate>now;
  if(!present){
   if(sameDoc(r).length)return {...r,decision:'blocked',reason:'Possível título manual existente: verifique antes de importar'};
   return {...r,partnerId:partner.id,decision:'create',future};
  }
  const meta=present.sankhyaMovement||{};
  if(present.type!==r.kind||meta.partnerCode&&meta.partnerCode!==r.partnerCode||
    meta.originalCents!==undefined&&meta.originalCents!==r.principal ||
    meta.invoice&&meta.invoice!==r.invoice || present.due!==r.due)
   return {...r,decision:'blocked',reason:'Mesmo Nro Único com campos divergentes do lançamento existente',existingId:present.id};
  const settlements=(db.payments||[]).filter(p=>p.titleId===present.id);
  const posted=settlements.reduce((sum,p)=>sum+p.amount,0);
  if(r.paidDate&&r.paidDate<=now&&!posted)return {...r,decision:'settle',existingId:present.id,partnerId:partner.id};
  if(r.paidDate&&r.paidDate<=now&&posted!==r.paidAmount)
   return {...r,decision:'blocked',existingId:present.id,reason:'Baixa existente com valor diferente: conferir manualmente'};
  return {...r,decision:'unchanged',existingId:present.id,future};
 });
}
function addRole(partner,type){
 const role=type==='income'?'Cliente':'Fornecedor';
 partner.roles=[...new Set([...(partner.roles||[]).filter(r=>r!=='Outros'),role])];
}
export function applyErpMovements(db,items,options,makeId,now){
 if(!options.confirmed)throw Error('Confirme a importação antes de gravar.');
 if(!items.length||items.length>5000)throw Error('Selecione de 1 a 5.000 movimentos.');
 const decisions=movementDecisions(db,items,now);
 if(decisions.some(r=>r.decision==='blocked'))throw Error('Há conflitos ou parceiros não cadastrados. Corrija a seleção.');
 const categories=options.categories||{},mapping=options.accounts||{};
 const result={created:0,settled:0,unchanged:0,future:0};
 const keys=new Set();
 for(const r of decisions){
  if(keys.has(r.key))throw Error('Nro Único repetido na seleção.');
  keys.add(r.key);
  const partner=db.partners.find(p=>p.id===r.partnerId);
  if(!partner)throw Error('Parceiro não encontrado para código '+r.partnerCode);
  const categoryId=categories[r.kind],category=db.categories.find(c=>c.id===categoryId&&c.type===r.kind);
  if(r.decision==='create'&&!category)throw Error('Escolha uma categoria para receitas e despesas.');
  const settled=!!r.paidDate&&!r.future;
  const bank=settled?mapping[r.bankCode]:null;
  if((r.decision==='settle'||r.decision==='create'&&settled)&&!db.accounts.some(a=>a.id===bank&&a.active))
   throw Error('Associe a conta da baixa '+(r.bankLabel||r.bankCode)+' a uma conta ativa do GB+.');
  if(r.decision==='unchanged'){result.unchanged++;continue;}
  const meta={source:ERP_SOURCE,unique:r.unique,company:r.company,partnerCode:r.partnerCode,
   invoice:r.invoice,operation:r.operation,origin:r.origin,center:r.center,entry:r.entry,
   negotiation:r.issue,titleType:r.titleType,seller:r.seller,originalCents:r.principal,
   netCents:r.netCents,bankCode:r.bankCode,bankLabel:r.bankLabel,paidAmount:r.paidAmount,
   paidDate:r.paidDate,interest:r.interest,penalty:r.penalty,discount:r.discount,groupKey:r.groupKey};
  const fullPaid=settled&&r.paidAmount>0;
  const amount=fullPaid?r.paidAmount:r.principal;
  if(r.decision==='create'){
   const name=partner.name;
   const notes=['Origem: Sankhya','Financeiro: '+r.unique,r.invoice?'Nota: '+r.invoice:'',
    'Código parceiro: '+r.partnerCode,r.groupKey?'Parcela '+r.sequence+'/'+r.count:'',
    'Valor original: '+(r.principal/100).toFixed(2),r.history].filter(Boolean).join(' · ').slice(0,2000);
   const t={id:makeId(),type:r.kind,description:(name+' · '+(r.history||r.invoice||'Movimentação financeira')).slice(0,300),
    document:r.invoice||r.unique,notes,amount,issue:r.issue,due:r.due,accountId:fullPaid?bank:'',
    partnerId:partner.id,categoryId,mode:r.count>1?'installment':'single',count:r.count,sequence:r.sequence,
    groupId:r.groupKey||null,cancelled:false,importKey:r.key,sankhyaMovement:meta};
   db.titles.push(t);addRole(partner,r.kind);result.created++;
   if(fullPaid){db.payments.push({id:makeId(),titleId:t.id,accountId:bank,date:r.paidDate,amount});result.settled++;}
   else if(r.future)result.future++;
  }else if(r.decision==='settle'){
   const t=db.titles.find(t=>t.id===r.existingId);
   if(!t)throw Error('Título a atualizar não encontrado.');
   // The ERP's Vlr Baixa can include mora or discounts; store original in meta
   // and use the realized amount for balance/payment in this data model.
   t.amount=amount;t.accountId=bank;t.sankhyaMovement=meta;
   db.payments.push({id:makeId(),titleId:t.id,accountId:bank,date:r.paidDate,amount});
   addRole(partner,r.kind);result.settled++;
  }
 }
 return result;
}
