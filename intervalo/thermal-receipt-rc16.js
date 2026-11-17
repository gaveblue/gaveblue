// Intervalo 1.1.0-rc.16 — Cupom térmico configurável no aparelho.
// O modo imagem produz um PNG com altura EXATA dos itens para evitar páginas enormes no Android.
// A impressão padrão do Android fica disponível como alternativa, sujeita ao spooler e ao driver.
const PROFILE_KEY='intervalo.thermal.profile.v1';
const DEFAULTS=Object.freeze({paper:58,scale:110,margin:1,feed:2});
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function getThermalProfile(){
 let v={};
 try{v=JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')||{}}catch{}
 return {
  paper:Number(v.paper)===80?80:58,
  scale:clamp(Number(v.scale)||DEFAULTS.scale,85,150),
  margin:clamp(Number(v.margin)||0,0,4),
  feed:clamp(Number(v.feed)||0,0,12)
 };
}
export function saveThermalProfile(value){
 const p={
  paper:Number(value.paper)===80?80:58,
  scale:clamp(Number(value.scale)||110,85,150),
  margin:clamp(Number(value.margin)||0,0,4),
  feed:clamp(Number(value.feed)||0,0,12)
 };
 try{localStorage.setItem(PROFILE_KEY,JSON.stringify(p))}catch{}
 return p;
}
const escapeText=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function textWithLines(node){
 if(!node)return '';
 if(node.nodeType===3)return node.nodeValue||'';
 if(node.nodeType!==1)return '';
 if(node.tagName==='BR')return '\n';
 let t=Array.from(node.childNodes).map(textWithLines).join('');
 if(node.classList?.contains('note'))t='\n'+t;
 return t;
}
function normalizeText(t){
 return String(t||'').replace(/\u00a0/g,' ').split('\n')
  .map(x=>x.replace(/[ \t]+/g,' ').trim()).filter(Boolean).join('\n');
}
export function extractThermalRows(root){
 const rows=[];
 if(!root)return rows;
 for(const el of Array.from(root.children)){
  const tag=el.tagName;
  if(tag==='HR'){rows.push({kind:'rule'});continue}
  if(tag==='H1'||tag==='H2'){rows.push({kind:'center',bold:true,title:true,text:normalizeText(textWithLines(el))});continue}
  if(tag==='TABLE'){
   for(const tr of Array.from(el.querySelectorAll('tr'))){
    const cells=Array.from(tr.querySelectorAll('td,th'));
    if(!cells.length)continue;
    if(cells.length===1)rows.push({kind:'heading',text:normalizeText(textWithLines(cells[0]))});
    else rows.push({kind:'pair',left:normalizeText(textWithLines(cells[0])),right:normalizeText(textWithLines(cells[1]))});
   }
   continue;
  }
  if(el.classList?.contains('totals')){
   for(const p of Array.from(el.querySelectorAll('p'))){
    rows.push({kind:'right',bold:!!p.querySelector('b,strong'),text:normalizeText(textWithLines(p))});
   }
   continue;
  }
  const text=normalizeText(textWithLines(el));
  if(!text)continue;
  if(tag==='SMALL'||el.querySelector(':scope > small'))rows.push({kind:'small',text});
  else if(el.classList?.contains('item'))rows.push({kind:'item',bold:true,text});
  else if((el.getAttribute('style')||'').includes('text-align:center'))rows.push({kind:'center',text});
  else rows.push({kind:'text',bold:!!el.querySelector('b,strong'),text});
 }
 return rows;
}
function wrapLine(ctx,text,maxWidth){
 const list=[];
 const input=String(text||'').trim();
 if(!input)return [''];
 let line='';
 for(const token of input.split(/\s+/)){
  const candidate=line?line+' '+token:token;
  if(ctx.measureText(candidate).width<=maxWidth){line=candidate;continue}
  if(line){list.push(line);line=''}
  let part='';
  for(const char of token){
   if(part&&ctx.measureText(part+char).width>maxWidth){list.push(part);part=''}
   part+=char;
  }
  line=part;
 }
 if(line)list.push(line);
 return list.length?list:[''];
}
function buildCanvas(doc,rows,profile){
 const width=profile.paper===80?576:384;
 // Impressora 58 mm tem tipicamente ~49 mm de área imprimível (384 dots).
 const usableMm=profile.paper===80?72:49;
 const pxPerMm=width/usableMm;
 const side=Math.round((profile.margin+1)*pxPerMm);
 const contentWidth=Math.max(110,width-side*2);
 const base=Math.round((profile.paper===80?23:21)*profile.scale/100);
 const canvas=doc.createElement('canvas');
 canvas.width=width;
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)throw Error('O navegador não disponibilizou o gerador de imagem.');
 const cssFont=(kind,bold)=>{
  const size=kind==='small'?Math.max(15,Math.round(base*.76)):
   kind==='center'?base+1:kind==='heading'?base:kind==='item'?base:base-1;
  return (bold||kind==='item'||kind==='heading'||kind==='center'&&bold?'700 ':'400 ')+size+'px Arial,Helvetica,sans-serif';
 };
 const fontHeight=(kind)=>kind==='small'?Math.max(19,Math.round(base*.91)):kind==='center'?Math.round((base+1)*1.35):Math.round(base*1.32);
 function processRow(row,y,paint){
  const kind=row.kind;
  if(kind==='rule'){
   if(paint){ctx.beginPath();ctx.strokeStyle='#444';ctx.setLineDash([6,4]);ctx.moveTo(side,y+5);ctx.lineTo(width-side,y+5);ctx.stroke();ctx.setLineDash([])}
   return 17;
  }
  const font=cssFont(kind,!!row.bold);
  ctx.font=font;
  ctx.textBaseline='top';
  ctx.fillStyle='#111';
  const lh=fontHeight(kind);
  const split=String(row.text||'').split('\n');
  if(kind==='pair'){
   const rightWidth=Math.round(contentWidth*.38);
   const leftWidth=contentWidth-rightWidth-8;
   const left=split.flatMap(t=>wrapLine(ctx,row.left||t,leftWidth));
   const right=String(row.right||'').split('\n').flatMap(t=>wrapLine(ctx,t,rightWidth));
   const count=Math.max(left.length,right.length,1);
   if(paint){
    left.forEach((t,i)=>ctx.fillText(t,side,y+i*lh));
    right.forEach((t,i)=>ctx.fillText(t,width-side-ctx.measureText(t).width,y+i*lh));
   }
   return count*lh+7;
  }
  const lines=split.flatMap(t=>wrapLine(ctx,t,contentWidth));
  if(paint){
   for(let i=0;i<lines.length;i++){
    const t=lines[i];let x=side;
    if(kind==='center')x=side+(contentWidth-ctx.measureText(t).width)/2;
    if(kind==='right')x=width-side-ctx.measureText(t).width;
    ctx.fillText(t,x,y+i*lh);
   }
  }
  return lines.length*lh+(kind==='item'||kind==='heading'?8:kind==='center'?7:5);
 }
 let height=Math.round(2*pxPerMm);
 for(const row of rows)height+=processRow(row,height,false);
 height+=Math.round((2+profile.feed)*pxPerMm);
 canvas.height=clamp(Math.ceil(height),64,30000);
 ctx.fillStyle='#fff';ctx.fillRect(0,0,width,canvas.height);
 let y=Math.round(2*pxPerMm);
 for(const row of rows){if(y>=canvas.height)break;y+=processRow(row,y,true)}
 return canvas;
}
function dataUrlFile(url,name){
 const base64=url.split(',')[1],raw=atob(base64),bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return new File([bytes],name,{type:'image/png'});
}
export function openThermalReceipt({title,content,popup:existingPopup,warning=''}){
 const popup=existingPopup??window.open('','_blank');
 if(!popup){alert('Autorize pop-ups para abrir a prévia de impressão.');return false}
 const markup=String(content||'');
 const css=[
 '*{box-sizing:border-box}html,body{margin:0;padding:0}body{background:#f5f6f8;color:#182338;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}',
 '.iv-pr-header{position:sticky;top:0;z-index:2;padding:15px 16px;background:#fff;border-bottom:1px solid #e8eaf0;display:flex;align-items:center;justify-content:space-between;gap:10px}',
 '.iv-pr-header b{font-size:15px}.iv-pr-header small{display:block;color:#84909d;font-size:11px}.iv-pr-shell{max-width:500px;margin:auto;padding:14px 14px 30px}',
 '.iv-pr-info{color:#596579;font-size:12px;margin:0 0 13px;line-height:1.5}',
 '.iv-pr-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}',
 '.iv-pr-button{border:1px solid #e6eaf1;border-radius:12px;padding:12px 8px;min-height:48px;background:#fff;color:#28344a;font:700 12px system-ui;cursor:pointer}',
 '.iv-pr-button.primary{background:#f97316;border-color:#f97316;color:#fff;grid-column:1 / -1}',
 '.iv-pr-button:focus-visible,select:focus-visible{outline:3px solid #ffb278;outline-offset:2px}',
 '.iv-pr-settings{background:white;border:1px solid #e5eaf0;border-radius:15px;padding:12px;margin:10px 0 15px}',
 '.iv-pr-settings>summary{cursor:pointer;font-weight:800;font-size:13px;list-style:none;display:flex;align-items:center;justify-content:space-between}',
 '.iv-pr-settings>summary:after{content:"⌄";font-size:19px;color:#ef7400}.iv-pr-settings[open]>summary:after{transform:rotate(180deg)}',
 '.iv-pr-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:14px}.iv-pr-grid label{display:grid;gap:6px;font-size:11px;font-weight:750;color:#526174}',
 '.iv-pr-grid select{width:100%;padding:10px 7px;font-size:13px;border:1px solid #dbe1e8;background:white;border-radius:9px;color:#182338}',
 '.iv-pr-settings-note{font-size:11px;color:#84909d;margin:12px 0 0}',
 '.iv-pr-preview{display:grid;place-items:center;gap:10px;min-height:80px}.iv-pr-preview img{width:min(100%,264px);height:auto;max-height:none;background:white;box-shadow:0 5px 24px #20334d20;image-rendering:auto}',
 '.iv-pr-preview figcaption{font-size:11px;color:#7d8896;text-align:center}.iv-pr-feedback{min-height:18px;font-size:12px;color:#526174;margin:8px 0}',
 '#iv-receipt-paper{position:absolute;left:-9999px;top:0;visibility:hidden;width:58mm;margin:0;padding:3mm 4.5mm;color:#111;background:#fff;font:12px/1.3 Arial,sans-serif}',
 '#iv-receipt-paper h1{font-size:16px;text-align:center;margin:1mm 0}#iv-receipt-paper p{margin:1.5mm 0}#iv-receipt-paper hr{border:0;border-top:1px dashed #555;margin:2mm 0}',
 '#iv-receipt-paper .item{font-weight:700;margin:2mm 0}#iv-receipt-paper .note{font-weight:400;display:block}#iv-receipt-paper table{width:100%;border-collapse:collapse;table-layout:fixed}',
 '#iv-receipt-paper td{padding:1mm .4mm;border-bottom:1px dotted #bbb;overflow-wrap:anywhere}#iv-receipt-paper td:last-child{text-align:right}#iv-receipt-paper .totals{text-align:right}',
 '@media print{body{background:#fff!important;margin:0!important;padding:0!important;width:var(--iv-pr-width,58mm)!important;height:auto!important}',
 'body>*:not(#iv-receipt-paper){display:none!important}#iv-receipt-paper{display:block!important;position:static!important;left:auto!important;visibility:visible!important;width:var(--iv-pr-width,58mm)!important;max-width:var(--iv-pr-width,58mm)!important;padding:3mm 4.5mm!important;margin:0!important;height:auto!important}',
 '@page{margin:0}}'
 ].join('');
 const html='<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeText(title||'Cupom Intervalo')+'</title><style>'+css+'</style><style id="iv-page-size"></style></head><body>'
  +'<header class="iv-pr-header"><div><b>Impressão térmica</b><small>Intervalo · Cupom configurável</small></div><small id="iv-pr-paper-label">58 mm</small></header>'
  +'<div class="iv-pr-shell">'+(warning?'<p class="iv-pr-info" role="alert" style="color:#9a3412;font-weight:700">'+escapeText(warning)+'</p>':'')+'<p class="iv-pr-info">O modo compacto envia apenas a imagem do cupom ao aplicativo, sem a página longa do Android.</p>'
  +'<div class="iv-pr-actions"><button class="iv-pr-button primary" id="iv-share" type="button">Compartilhar cupom compacto</button><button class="iv-pr-button" id="iv-save" type="button">Salvar imagem</button><button class="iv-pr-button" id="iv-native" type="button">Impressão do Android</button></div>'
  +'<details class="iv-pr-settings" id="iv-pr-settings"><summary>Ajustar tamanho e impressão</summary><div class="iv-pr-grid">'
  +'<label>Largura do papel<select id="iv-pr-paper"><option value="58">58 mm · MPT-II</option><option value="80">80 mm</option></select></label>'
  +'<label>Tamanho do texto<select id="iv-pr-scale"><option value="90">Pequeno</option><option value="100">Normal</option><option value="110">Legível</option><option value="125">Grande</option><option value="140">Extra grande</option></select></label>'
  +'<label>Margens laterais<select id="iv-pr-margin"><option value="0">Mínimas</option><option value="1">1 mm</option><option value="2">2 mm</option><option value="3">3 mm</option><option value="4">4 mm</option></select></label>'
  +'<label>Avanço final<select id="iv-pr-feed"><option value="0">Nenhum</option><option value="2">2 mm</option><option value="5">5 mm</option><option value="8">8 mm</option><option value="12">12 mm</option></select></label>'
  +'</div><p class="iv-pr-settings-note">Preferências salvas neste celular. A imagem compacta tem altura proporcional aos itens. A impressão normal do Android ainda pode adicionar papel em branco por decisão do serviço instalado.</p></details>'
  +'<figure class="iv-pr-preview"><img id="iv-pr-image" alt="Prévia compacta do recibo térmico"><figcaption id="iv-pr-size">Preparando o cupom…</figcaption></figure>'
  +'<p class="iv-pr-feedback" id="iv-pr-feedback" role="status" aria-live="polite"></p></div>'
  +'<main id="iv-receipt-paper">'+markup+'</main></body></html>';
 popup.document.open();popup.document.write(html);popup.document.close();
 const doc=popup.document;
 const byId=id=>doc.getElementById(id);
 const rows=extractThermalRows(byId('iv-receipt-paper'));
 let profile=getThermalProfile();
 const names={paper:'iv-pr-paper',scale:'iv-pr-scale',margin:'iv-pr-margin',feed:'iv-pr-feed'};
 Object.entries(names).forEach(([key,id])=>{byId(id).value=String(profile[key])});
 let png='',canvas;
 function update(){
  profile=saveThermalProfile(Object.fromEntries(Object.entries(names).map(([key,id])=>[key,byId(id).value])));
  try{
   canvas=buildCanvas(doc,rows,profile);
   png=canvas.toDataURL('image/png');
   byId('iv-pr-image').src=png;
   byId('iv-pr-size').textContent=profile.paper+' mm · Altura do cupom: '+Math.round(canvas.height/canvas.width*(profile.paper===58?49:72))+' mm · Sem folha A4';
   byId('iv-pr-paper-label').textContent=profile.paper+' mm';
   byId('iv-pr-feedback').textContent='';
  }catch(err){byId('iv-pr-feedback').textContent='Não foi possível gerar imagem: '+err.message}
  // Mantém o modo clássico configurável para navegadores que respeitam @page.
  const paper=byId('iv-receipt-paper');
  const width=profile.paper+'mm';
  doc.documentElement.style.setProperty('--iv-pr-width',width);
  paper.style.width=width;
  paper.style.fontSize=(12*profile.scale/110)+'px';
  const mm=Math.max(36,Math.ceil(paper.scrollHeight*25.4/96+3+profile.feed));
  byId('iv-page-size').textContent='@page{size:'+width+' '+mm+'mm;margin:0}';
 }
 for(const id of Object.values(names))byId(id).addEventListener('change',update);
 byId('iv-native').addEventListener('click',()=>{
  update();
  popup.focus();popup.print();
 });
 byId('iv-save').addEventListener('click',()=>{
  if(!png){byId('iv-pr-feedback').textContent='A imagem ainda não está pronta.';return}
  const a=doc.createElement('a');a.href=png;a.download='intervalo-cupom-'+profile.paper+'mm.png';doc.body.append(a);a.click();a.remove();
  byId('iv-pr-feedback').textContent='Imagem salva. Abra ou compartilhe com o aplicativo Thermal Printer.';
 });
 byId('iv-share').addEventListener('click',async()=>{
  if(!png){byId('iv-pr-feedback').textContent='A imagem ainda não está pronta.';return}
  const file=dataUrlFile(png,'intervalo-cupom-'+profile.paper+'mm.png');
  const shareData={files:[file],title:'Cupom Intervalo'};
  if(!popup.navigator.share||popup.navigator.canShare&&!popup.navigator.canShare(shareData)){
   byId('iv-pr-feedback').textContent='O navegador não permite compartilhar imagens diretamente. Toque em Salvar imagem e compartilhe o arquivo com Thermal Printer.';
   return;
  }
  try{
   await popup.navigator.share(shareData);
   byId('iv-pr-feedback').textContent='Cupom enviado ao menu de compartilhamento. Selecione Thermal Printer.';
  }catch(err){
   if(err.name!=='AbortError')byId('iv-pr-feedback').textContent='Não foi possível compartilhar: '+err.message+'. Use Salvar imagem.';
  }
 });
 popup.addEventListener('beforeprint',update);
 update();
 popup.focus();
 return true;
}
