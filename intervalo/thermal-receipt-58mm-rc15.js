// Intervalo 1.1.0-rc.15 — impressão manual térmica 58 mm (Cozinha e Caixa).
// A altura da folha é medida a partir do conteúdo, sem transformar o cupom em página A4.
export function openThermalReceipt({title,content}){
 const popup=window.open('','_blank');
 if(!popup){alert('O navegador bloqueou a prévia. Autorize pop-ups para este site.');return false}
 const safeTitle=String(title||'Cupom Intervalo').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
 const style=`
  @page{size:58mm 90mm;margin:0}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;color:#111;background:#f1f3f6}
  body{font:12.5px/1.35 Arial,Helvetica,sans-serif}
  .iv-print-toolbar{max-width:360px;margin:16px auto;padding:0 12px;display:flex;justify-content:space-between;align-items:center;gap:9px}
  .iv-print-toolbar span{font:600 12px Arial,sans-serif;color:#556070}
  .iv-print-toolbar button{background:#ff7600;color:white;border:0;border-radius:10px;padding:12px 16px;font:700 13px Arial,sans-serif;cursor:pointer}
  #iv-receipt-paper{display:block;width:58mm;margin:0 auto 20px;padding:3mm 3.5mm 3mm;background:white;color:#111;overflow-wrap:anywhere;box-shadow:0 6px 22px #1220331f}
  h1{font-size:16px;font-weight:800;text-align:center;line-height:1.18;margin:1mm 0}
  p{margin:1.5mm 0}
  hr{border:0;border-top:1px dashed #555;margin:2.5mm 0}
  small{font-size:10px;line-height:1.3}
  .item{margin:2.2mm 0;font-size:13px;font-weight:700;break-inside:avoid}
  .note{display:block;margin:.7mm 0 0;font-weight:400;font-size:11px}
  table{width:100%;border-collapse:collapse;table-layout:fixed}
  td{font-size:11.5px;padding:1.2mm .6mm;vertical-align:top;border-bottom:1px dotted #ccc;overflow-wrap:anywhere}
  td:first-child{width:65%}
  td:last-child{width:35%;text-align:right}
  .totals{text-align:right;margin:2.2mm 0;font-size:12px}
  .totals p{margin:1mm 0}
  @media print{
   html,body{width:58mm!important;height:auto!important;background:white!important;overflow:visible!important}
   .iv-print-toolbar{display:none!important}
   #iv-receipt-paper{width:58mm!important;max-width:58mm!important;margin:0!important;padding:3mm 3.5mm 3mm!important;box-shadow:none!important;min-height:0!important;height:auto!important}
   *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  }
 `;
 popup.document.open();
 popup.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+safeTitle+'</title><style>'+style+'</style><style id="iv-receipt-page"></style></head><body><div class="iv-print-toolbar"><span>Cupom térmico · 58 mm</span><button type="button" id="iv-receipt-print">Imprimir / PDF</button></div><main id="iv-receipt-paper">'+content+'</main></body></html>');
 popup.document.close();
 const updatePageSize=()=>{
  const paper=popup.document.getElementById('iv-receipt-paper');
  const page=popup.document.getElementById('iv-receipt-page');
  if(!paper||!page)return;
  // Layout screen e impressão usam a mesma largura/padding (58 mm).
  // Converte altura do cupom em pixels CSS para milímetros + 5 mm de tolerância.
  const mm=Math.max(40,Math.ceil(paper.scrollHeight*25.4/96+5));
  page.textContent='@page{size:58mm '+mm+'mm;margin:0}';
 };
 popup.addEventListener('beforeprint',updatePageSize);
 popup.document.getElementById('iv-receipt-print')?.addEventListener('click',()=>{
  updatePageSize();
  popup.focus();
  popup.print();
 });
 popup.addEventListener('load',updatePageSize,{once:true});
 updatePageSize();
 popup.focus();
 return true;
}
