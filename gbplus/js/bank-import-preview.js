/**
 * GB+ 2.5.0 preparation — local-only, READ-ONLY import preview.
 * Never writes to account balances, titles, payments, or Supabase.
 * Amounts are signed integer centavos; date is ISO YYYY-MM-DD.
 * Callers MUST require the user's explicit confirmation before reconciliation.
 */
export const BANK_IMPORT_MAX_BYTES=8_000_000;
export const BANK_IMPORT_MAX_ROWS=20000;
export const bankImportFileNameSupported = name=>/\.(?:ofx|csv|txt)$/i.test(String(name||'').trim());

export async function readBankFileText(file){
 if(!file||!bankImportFileNameSupported(file.name))throw Error('Selecione um arquivo OFX ou CSV.');
 if(!Number.isSafeInteger(file.size)||file.size<1||file.size>BANK_IMPORT_MAX_BYTES)
  throw Error('O arquivo precisa ter até 8 MB e não pode estar vazio.');
 const raw=await file.arrayBuffer();
 if(raw.byteLength!==file.size)throw Error('O arquivo foi modificado durante a leitura. Selecione-o novamente.');
 // UTF-8 is preferred. Older Brazilian banking exports often use Windows-1252.
 try{return new TextDecoder('utf-8',{fatal:true}).decode(raw);}
 catch{return new TextDecoder('windows-1252',{fatal:true}).decode(raw);}
}


const clean=value=>String(value??'').replace(/^\uFEFF/,'').trim();
const norm=text=>clean(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const validISO=date=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const d=new Date(date+'T12:00:00.000Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===date;
};
export function statementDate(value){
 const text=clean(value);
 let iso=text;
 if(/^\d{8}/.test(text)&&!/^\d{4}-\d{2}-\d{2}$/.test(text)){
  // OFX DTPOSTED may include time and timezone.
  iso=text.slice(0,4)+'-'+text.slice(4,6)+'-'+text.slice(6,8);
 }else if(/^\d{2}\/\d{2}\/\d{4}$/.test(text)){
  const [day,month,year]=text.split('/');
  iso=year+'-'+month+'-'+day;
 }else if(/^\d{4}\/\d{2}\/\d{2}$/.test(text)){
  iso=text.replace(/\//g,'-');
 }
 if(!validISO(iso))throw Error('Data inválida no extrato: '+text.slice(0,30));
 return iso;
}
export function statementCents(value){
 let str=clean(value).replace(/^(?:R\$\s*)/i,'').replace(/[\s\u00a0]/g,'');
 if(!str||!/^[+-]?[\d.,]+$/.test(str))throw Error('Valor monetário inválido no arquivo.');
 const sign=str.startsWith('-')?-1:1;
 str=str.replace(/^[+-]/,'');
 const comma=str.lastIndexOf(','),dot=str.lastIndexOf('.');
 let decimals='';
 if(comma>=0||dot>=0){
  const separator=comma>dot?',':'.',pos=str.lastIndexOf(separator);
  const right=str.slice(pos+1),left=str.slice(0,pos);
  if(!/^\d{1,2}$/.test(right))throw Error('Formato monetário ambíguo. Use duas casas decimais.');
  const group=separator===','?'.':',';
  if(left.includes(separator))throw Error('Valor monetário ambíguo.');
  if(left.includes(group)&&!/^\d{1,3}(?:[.,]\d{3})+$/.test(left))throw Error('Separador de milhares inválido.');
  str=left.split(group).join('');decimals=right.padEnd(2,'0');
 }else decimals='00';
 if(!/^\d+$/.test(str))throw Error('Valor monetário inválido.');
 const cents=Number(str)*100+Number(decimals);
 if(!Number.isSafeInteger(cents)||cents>1e12)throw Error('Valor do extrato acima do limite aceito.');
 return sign*cents;
}
function safeInput(value){
 const text=String(value??'');
 if(text.length>BANK_IMPORT_MAX_BYTES)throw Error('Arquivo excede o limite de 8 MB para prévia.');
 return text.replace(/^\uFEFF/,'');
}
function entry(date,description,amount,id='',source=''){
 const name=clean(description).replace(/\s+/g,' ').slice(0,500);
 if(!name||!Number.isSafeInteger(amount)||amount===0)throw Error('Movimento sem descrição ou valor válido.');
 return {date:statementDate(date),description:name,amount,externalId:clean(id).slice(0,180),source};
}
function ofxField(block,name){
 // OFX SGML 1.x often omits individual field closing tags. XML 2.x closes them.
 const match=block.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([^<\\r\\n]*)','i'));
 return match?clean(match[1]):'';
}
export function parseBankOfx(value){
 const text=safeInput(value);
 if(!/<OFX(?:\s|>)/i.test(text))throw Error('O arquivo não parece ser um extrato OFX.');
 const blocks=[...text.matchAll(/<STMTTRN(?:\s[^>]*)?>([\s\S]*?)(?=<\/STMTTRN\s*>|<STMTTRN(?:\s|>)|<\/BANKTRANLIST\s*>)/gi)];
 if(!blocks.length)throw Error('Nenhuma transação OFX identificada.');
 if(blocks.length>BANK_IMPORT_MAX_ROWS)throw Error('Extrato acima de 20.000 movimentos.');
 const records=blocks.map((match,index)=>{
  const b=match[1],date=ofxField(b,'DTPOSTED'),value=ofxField(b,'TRNAMT');
  if(!date||!value)throw Error('Movimento OFX '+(index+1)+' sem data ou valor.');
  const description=ofxField(b,'MEMO')||ofxField(b,'NAME')||ofxField(b,'TRNTYPE');
  return entry(date,description,statementCents(value),ofxField(b,'FITID'),'ofx');
 });
 return {format:'ofx',records,warnings:[],accountHint:ofxField(text,'ACCTID').replace(/.(?=.{4})/g,'•')};
}
function splitCsv(text,separator){
 const rows=[],row=[];let cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='"'){
   if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
  }else if(char===separator&&!quoted){row.push(cell);cell='';}
  else if((char==='\n'||char==='\r')&&!quoted){
   if(char==='\r'&&text[i+1]==='\n')i++;
   row.push(cell);cell='';
   if(row.some(x=>x.trim()))rows.push(row.slice());
   row.length=0;
   if(rows.length>BANK_IMPORT_MAX_ROWS+1)throw Error('Extrato acima de 20.000 movimentos.');
  }else cell+=char;
 }
 if(quoted)throw Error('Arquivo CSV possui aspas não fechadas.');
 row.push(cell);
 if(row.some(x=>x.trim()))rows.push(row);
 return rows;
}
function inferSeparator(first){
 let best=';',max=-1;
 for(const sep of [';',',','\t']){
  let found=0,quoted=false;
  for(const char of first){if(char==='"')quoted=!quoted;if(char===sep&&!quoted)found++;}
  if(found>max){max=found;best=sep;}
 }
 return best;
}
export function parseBankCsv(value,{separator}={}){
 const text=safeInput(value);
 if(!text.trim())throw Error('Arquivo CSV vazio.');
 const inferred=separator||inferSeparator(text.split(/\r?\n/,1)[0]);
 if(![';',',','\t'].includes(inferred))throw Error('Separador de CSV não suportado.');
 const rows=splitCsv(text,inferred),headers=(rows.shift()||[]).map(norm);
 const col=names=>headers.findIndex(h=>names.some(n=>h===n||h.startsWith(n)));
 const indexes={
  date:col(['data','dtmovimento','date','datamovimento']),
  description:col(['historico','descricao','detalhe','memo','lancamento','movimento','narrativa']),
  amount:col(['valor','amount','quantia']),
  credit:col(['credito','credit','entrada','recebimento']),
  debit:col(['debito','debit','saida','pagamento']),
  kind:col(['tipo','natureza','sinal','operacao']),
  id:col(['identificador','fitid','transacao','nsu','idmovimento','id'])
 };
 if(indexes.date<0||indexes.description<0||(indexes.amount<0&&(indexes.credit<0||indexes.debit<0)))
  throw Error('Colunas obrigatórias não identificadas. Informe Data, Descrição e Valor (ou Crédito/Débito).');
 if(!rows.length)throw Error('CSV sem movimentos.');
 const records=rows.map((cells,index)=>{
  const get=key=>indexes[key]<0?'':clean(cells[indexes[key]]);
  let amount;
  if(indexes.credit>=0&&indexes.debit>=0&&indexes.amount<0){
   const a=get('credit'),b=get('debit');
   if(a&&b)throw Error('CSV linha '+(index+2)+' tem crédito e débito simultaneamente.');
   if(!a&&!b)throw Error('CSV linha '+(index+2)+' sem crédito ou débito.');
   amount=a?Math.abs(statementCents(a)):-Math.abs(statementCents(b));
  }else{
   amount=statementCents(get('amount'));
   const kind=norm(get('kind'));
   if(['credito','credit','entrada','recebimento'].includes(kind))amount=Math.abs(amount);
   if(['debito','debit','saida','pagamento'].includes(kind))amount=-Math.abs(amount);
  }
  try{return entry(get('date'),get('description'),amount,get('id'),'csv');}
  catch(error){throw Error('CSV linha '+(index+2)+': '+error.message);}
 });
 return {format:'csv',records,warnings:[],accountHint:''};
}
export function parseBankStatement(contents,filename=''){
 const lower=clean(filename).toLowerCase();
 if(lower.endsWith('.ofx')||/<OFX(?:\s|>)/i.test(String(contents).slice(0,2048)))return parseBankOfx(contents);
 if(lower.endsWith('.csv')||lower.endsWith('.txt'))return parseBankCsv(contents);
 throw Error('Formato não suportado na preparação: selecione OFX ou CSV. XLSX será uma etapa específica.');
}
const dayDistance=(a,b)=>Math.round(Math.abs(Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);
export function proposeReconciliation(parsed,db,accountId,{dayWindow=3}={}){
 if(!Array.isArray(parsed?.records))throw Error('Prévia de extrato inválida.');
 if(!db?.accounts?.some(a=>a.id===accountId))throw Error('Selecione uma conta GB+ válida.');
 if(!Number.isInteger(dayWindow)||dayWindow<0||dayWindow>7)throw Error('Janela de conciliação inválida.');
 const titles=new Map((db.titles||[]).map(t=>[t.id,t]));
 const realPayments=(db.payments||[]).filter(p=>p.accountId===accountId).flatMap(p=>{
  const title=titles.get(p.titleId);
  if(!title||title.cancelled)return [];
  return [{id:p.id,type:'payment',date:p.date,amount:title.type==='income'?p.amount:-p.amount,description:title.description||''}];
 });
 const realTransfers=(db.transfers||[]).flatMap(t=>{
  if(t.from===accountId)return [{id:t.id,type:'transfer',date:t.date,amount:-t.amount,description:'Transferência entre contas'}];
  if(t.to===accountId)return [{id:t.id,type:'transfer',date:t.date,amount:t.amount,description:'Transferência entre contas'}];
  return [];
 });
 const history=[...realPayments,...realTransfers],seen=new Map(),byAmount=new Map();
 for(const movement of history){
  if(!byAmount.has(movement.amount))byAmount.set(movement.amount,[]);
  byAmount.get(movement.amount).push(movement);
 }
 const rows=parsed.records.map((record,index)=>{
  const fingerprint=[record.externalId||'',record.date,record.amount,norm(record.description)].join('|');
  const repeated=seen.has(fingerprint);
  seen.set(fingerprint,(seen.get(fingerprint)||0)+1);
  const candidates=(byAmount.get(record.amount)||[]).filter(p=>dayDistance(p.date,record.date)<=dayWindow);
  return {index,record,status:repeated?'possible_duplicate_in_file':candidates.length===1?'possible_match':candidates.length>1?'ambiguous':'not_found',
   candidates:candidates.map(c=>({...c,daysApart:dayDistance(c.date,record.date)}))
    .sort((a,b)=>a.daysApart-b.daysApart)};
 });
 return {format:parsed.format,accountId,rows,
  totals:{
   credits:rows.filter(r=>r.record.amount>0).reduce((s,r)=>s+r.record.amount,0),
   debits:rows.filter(r=>r.record.amount<0).reduce((s,r)=>s-r.record.amount,0),
   possibleMatches:rows.filter(r=>r.status==='possible_match').length,
   unmatched:rows.filter(r=>r.status==='not_found').length,
   ambiguous:rows.filter(r=>r.status==='ambiguous'||r.status==='possible_duplicate_in_file').length
  },
  readonly:true,requiresApproval:true};
}
