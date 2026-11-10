// GB+ 3.0.7 — leitores locais no navegador de desktop. Nenhum arquivo é enviado.
import {normalizeTabularReport,normalizeSicoobPositionedPages,normalizeReceivableOcr,fold,brlCents} from './financial-report-core.js?v=20261110-307';
const MAX_BYTES=12_000_000,MAX_ROWS=5000;
const decoder=new TextDecoder('utf-8');
function decodeCSV(buffer){
 let text=decoder.decode(buffer);
 if((text.match(/\uFFFD/g)||[]).length>3)text=new TextDecoder('windows-1252').decode(buffer);
 return text.replace(/^\uFEFF/,'');
}
export function csvRows(text){
 const first=String(text||'').split(/\r?\n/).find(line=>line.trim())||'';
 const delimiters=[';',',','\t'].map(sep=>({sep,count:([...first].filter(c=>c===sep)).length})).sort((a,b)=>b.count-a.count);
 const delimiter=delimiters[0].count?delimiters[0].sep:';';
 let cell='',row=[],quoted=false;const all=[];
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;continue;}
  if(!quoted&&ch===delimiter){row.push(cell);cell='';continue;}
  if(!quoted&&(ch==='\n'||ch==='\r')){
   if(ch==='\r'&&text[i+1]==='\n')i++;
   row.push(cell);if(row.some(c=>String(c).trim()))all.push(row);row=[];cell='';
   if(all.length>MAX_ROWS+16)throw Error('Relatório excede 5.000 linhas por importação.');
   continue;
  }
  cell+=ch;
 }
 if(quoted)throw Error('CSV com aspas não fechadas.');
 row.push(cell);if(row.some(c=>String(c).trim()))all.push(row);
 return all;
}
const u16=(dv,n)=>dv.getUint16(n,true),u32=(dv,n)=>dv.getUint32(n,true);
async function xlsxParts(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(u32(view,i)===0x06054b50){end=i;break;}}
 if(end<0)throw Error('Arquivo Excel inválido ou compactado em formato incompatível.');
 const count=u16(view,end+10),offset=u32(view,end+16);
 if(count>400||offset>=bytes.length)throw Error('Pasta de trabalho excede os limites seguros.');
 const files=new Map();let cursor=offset;
 for(let i=0;i<count;i++){
  if(cursor+46>bytes.length||u32(view,cursor)!==0x02014b50)throw Error('Estrutura ZIP do Excel inválida.');
  const method=u16(view,cursor+10),size=u32(view,cursor+20),len=u16(view,cursor+28),extra=u16(view,cursor+30),comment=u16(view,cursor+32),lo=u32(view,cursor+42);
  const name=decoder.decode(bytes.slice(cursor+46,cursor+46+len));cursor+=46+len+extra+comment;
  if(!/^xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml|workbook\.xml)$/i.test(name))continue;
  if(size>5_000_000||lo+30>bytes.length||u32(view,lo)!==0x04034b50)throw Error('XML comprimido inválido.');
  const start=lo+30+u16(view,lo+26)+u16(view,lo+28);
  if(start+size>bytes.length)throw Error('Arquivo Excel truncado.');
  let content=bytes.slice(start,start+size);
  if(method===8){
   if(typeof DecompressionStream==='undefined')throw Error('Este navegador não suporta a descompactação de Excel. Use Chrome/Edge atualizado ou exporte CSV.');
   try{
    const stream=new Blob([content]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    content=new Uint8Array(await new Response(stream).arrayBuffer());
   }catch{throw Error('Falha ao descompactar o Excel. Exporte o relatório como CSV.');}
  }else if(method!==0)throw Error('Compactação Excel não suportada.');
  if(content.length>10_000_000)throw Error('XML Excel maior que o limite.');
  files.set(name,decoder.decode(content));
 }
 return files;
}
function parseXML(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.getElementsByTagName('parsererror').length)throw Error('XML do Excel inválido.');
 return doc;
}
const localName=n=>String(n.localName||n.nodeName).replace(/^.*:/,'');
const descendants=(n,name)=>[...n.getElementsByTagName('*')].filter(el=>localName(el)===name);
export async function xlsxRows(buffer){
 const parts=await xlsxParts(buffer);
 const sheetName=[...parts.keys()].find(k=>/xl\/worksheets\/sheet\d+\.xml/.test(k));
 if(!sheetName)throw Error('Planilha sem aba de dados.');
 let shared=[];
 if(parts.has('xl/sharedStrings.xml')){
  const xml=parseXML(parts.get('xl/sharedStrings.xml'));
  shared=descendants(xml,'si').map(el=>descendants(el,'t').map(t=>t.textContent||'').join(''));
 }
 const doc=parseXML(parts.get(sheetName));
 const result=[];
 for(const row of descendants(doc,'row')){
  const number=Number(row.getAttribute('r')||result.length+1);
  if(number>MAX_ROWS+16)throw Error('Planilha com linhas demais (limite de 5.000).');
  const values=[];
  for(const cell of [...row.children].filter(el=>localName(el)==='c')){
   const address=cell.getAttribute('r')||'',letters=address.match(/^[A-Z]+/i)?.[0]?.toUpperCase()||'A';
   let index=0;for(const letter of letters)index=index*26+letter.charCodeAt(0)-64;index--;
   if(index<0||index>40)continue;
   const raw=descendants(cell,'v')[0]?.textContent??descendants(cell,'t').map(t=>t.textContent||'').join('')??'';
   const type=cell.getAttribute('t')||'';
   values[index]=type==='s'?shared[Number(raw)]??'':type==='inlineStr'||type==='str'?raw:raw!==''&&!isNaN(Number(raw))?Number(raw):raw;
  }
  if(values.some(x=>String(x??'').trim()))result.push(values.map(v=>v??''));
 }
 return result;
}
const PDF_LIB='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDF_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
async function pdfLibrary(){
 try{
  const lib=await import(PDF_LIB);
  lib.GlobalWorkerOptions.workerSrc=PDF_WORKER;
  return lib;
 }catch{throw Error('Não foi possível carregar o leitor de PDF. Confira a conexão ou use uma planilha Excel/CSV.');}
}
function verifySicoobFooter(pages,result){
 const lines=[];
 for(const page of pages){
  const map=new Map();
  for(const item of page.items){
   const y=Math.round(item.y/2)*2;
   if(!map.has(y))map.set(y,[]);
   map.get(y).push(item);
  }
  for(const items of map.values())lines.push(items.sort((a,b)=>a.x-b.x).map(v=>v.str).join(' '));
 }
 const all=lines.map(fold);
 const declared=(pattern)=>{
  const i=all.findIndex(l=>pattern.test(l));
  const text=i<0?'':lines[i];
  const m=text.match(/(\d[\d.,]*)\s*$/);
  return m?.[1]||'';
 };
 const actualCount=result.records.length;
 const bankCount=Number(declared(/total de registros liquidados/).replace(/[^\d]/g,'')||0);
 const bankBajas=Number(declared(/total de registros baixados/).replace(/[^\d]/g,'')||0);
 const declaredAmount=declared(/total de valores liquidados/);
 const declaredBajasAmount=declared(/total de valores baixados/);
 let amount=0,baixas=0;try{if(declaredAmount)amount=brlCents(declaredAmount);if(declaredBajasAmount)baixas=brlCents(declaredBajasAmount);}catch{}
 const baixados=result.excluded.filter(e=>e.reason.includes('82 —')).length;
 if(!bankCount||!amount||!bankBajas||!baixas||bankCount!==actualCount||amount!==result.bankTotals.liquidated||bankBajas!==baixados||baixas!==result.bankTotals.administrative){
  result.verificationFailed=true;
  result.warnings.push('Não foi possível conciliar automaticamente todos os totais do PDF com os itens reconhecidos: '+
   (bankCount||'?')+' liquidações declaradas ('+(declaredAmount||'valor ausente')+'), '+actualCount+' identificadas; '+
   (bankBajas||'?')+' baixas administrativas declaradas ('+(declaredBajasAmount||'valor ausente')+'), '+baixados+' identificadas. '+
   'A importação fica bloqueada até exportar um relatório íntegro em Excel/CSV.');
 }
 return result;
}
async function pdfRead(file,kind,notify){
 const lib=await pdfLibrary();
 const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true}).promise;
 if(doc.numPages>10)throw Error('PDF com mais de 10 páginas. Divida o relatório.');
 const pages=[],printed=[],pageRefs=[];
 try{
  for(let i=1;i<=doc.numPages;i++){
   notify?.('Analisando página '+i+' de '+doc.numPages);
   const page=await doc.getPage(i);
   const content=await page.getTextContent();
   const items=content.items.filter(x=>x.str?.trim()).map(x=>({str:x.str.trim(),x:x.transform[4],y:x.transform[5]}));
   pages.push({items});printed.push(items.map(x=>x.str).join(' '));pageRefs.push(page);
  }
  const fullText=printed.join('\n');
  if(kind==='received'){
   if(!/liquida|sicoob|nosso numero|t.tulos por per.odo/i.test(fold(fullText)))throw Error('Este PDF não parece um relatório de liquidação de títulos do Sicoob.');
   return verifySicoobFooter(pages,normalizeSicoobPositionedPages(pages));
  }
  // PDFs de títulos digitalizados são imagens sem texto selecionável. OCR somente no PC.
  if(pages.every(p=>p.items.length<15)){
   if(kind!=='receivable')throw Error('PDF digitalizado. Para contas a pagar, exporte Excel/CSV.');
   notify?.('PDF digitalizado: iniciando OCR local...');
   const tesseract=await loadOcr();
   const worker=await tesseract.createWorker('por');
   let result;
   try{
    const page=pageRefs[0];
    if(doc.numPages!==1)throw Error('OCR em PDF de múltiplas páginas: exporte Excel/CSV.');
    const viewport=page.getViewport({scale:1.8});
    const canvas=document.createElement('canvas');canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
    await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport}).promise;
    for(const degrees of [0,90,270]){
     notify?.('Reconhecendo tabela digitalizada ('+degrees+'°)...');
     let img=canvas;
     if(degrees){
      const rotated=document.createElement('canvas');rotated.width=canvas.height;rotated.height=canvas.width;
      const context=rotated.getContext('2d',{alpha:false});context.translate(rotated.width/2,rotated.height/2);
      context.rotate(degrees*Math.PI/180);context.drawImage(canvas,-canvas.width/2,-canvas.height/2);img=rotated;
     }
     const extracted=await worker.recognize(img);
     try{result=normalizeReceivableOcr(extracted.data.text);break;}catch{ /* test next orientation */ }
    }
   }finally{await worker.terminate();}
   if(!result)throw Error('OCR não conseguiu identificar linhas confiáveis. Exporte o relatório em Excel/CSV e não lance valores manualmente sem conferência.');
   return result;
  }
  if(kind==='received')return normalizeSicoobPositionedPages(pages);
  throw Error('Este modelo de PDF não tem colunas confiáveis para importação. Exporte como Excel/CSV.');
 }finally{await doc.destroy();}
}
let ocrPromise;
async function loadOcr(){
 if(!ocrPromise)ocrPromise=new Promise((resolve,reject)=>{
  if(window.Tesseract){resolve(window.Tesseract);return;}
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';
  script.crossOrigin='anonymous';
  script.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(Error('Biblioteca OCR não encontrada.'));
  script.onerror=()=>reject(Error('OCR indisponível. Confira sua conexão ou exporte CSV/Excel.'));
  document.head.append(script);
 });
 return ocrPromise;
}
export async function readFinancialReport(file,kind,notify){
 if(!file||!file.name||file.size<1||file.size>MAX_BYTES)throw Error('Arquivo precisa ter de 1 byte até 12 MB.');
 if(!['receivable','payable','received'].includes(kind))throw Error('Escolha um tipo de relatório.');
 const name=file.name.toLowerCase();
 if(name.endsWith('.pdf'))return pdfRead(file,kind,notify);
 let rows;
 if(name.endsWith('.xlsx'))rows=await xlsxRows(await file.arrayBuffer());
 else if(name.endsWith('.csv')||name.endsWith('.txt'))rows=csvRows(decodeCSV(await file.arrayBuffer()));
 else throw Error('Use PDF, Excel (.xlsx) ou CSV.');
 const parsed=normalizeTabularReport(kind,rows);
 if(parsed.records.length>MAX_ROWS)throw Error('Limite de 5.000 títulos por arquivo.');
 return parsed;
}
