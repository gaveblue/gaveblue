// The canvas is rendered from generatePDF's bytes. Transparent hit areas are
// reported by that same renderer, never drawn as replacement receipt content.
(() => {
  'use strict';
  const el=id=>document.getElementById(id);
  const labels={titulo:'Título do recibo',numero:'Número do recibo',tituloPagador:'Título: pagador',identidadePagador:'Dados do pagador',enderecoPagador:'Endereço do pagador',tituloRecebedor:'Título: recebedor',tituloServico:'Título: serviço',tituloPagamento:'Título: pagamento',tituloAnexo:'Título: anexo',linhaAssinatura:'Linha da assinatura',nome:'Nome do recebedor',documento:'CPF/CNPJ',servico:'Serviço',nota:'Nota fiscal',destino:'Destino',dataServico:'Data do serviço',valorServico:'Valor do serviço',emitente:'Emitente / forma de pagamento',banco:'Banco / titular',agencia:'Agência / chave PIX',conta:'Conta / agência',dataCheque:'Data / conta',cheque:'Número do cheque / tipo de conta',valorCheque:'Valor do pagamento',localData:'Local e data',assinatura:'Assinatura',assinaturaDocumento:'Documento da assinatura'};
  Object.assign(labels,{linhaPagador:'Linha acima do pagador',linhaRecebedor:'Linha acima do recebedor',linhaServico:'Linha acima do serviço',linhaPagamento:'Linha abaixo do valor / acima do pagamento',linhaAnexo:'Linha acima do anexo'});
  const lineKeys=new Set(['linhaPagador','linhaRecebedor','linhaServico','linhaPagamento','linhaAnexo']);
  const nameFor=key=>labels[key]||(key.startsWith('declaracao')?'Declaração · linha '+(Number(key.slice(10))+1):key);
  const section=el('layout-settings');
  section.innerHTML=`<div class="section-heading"><div><span class="section-kicker">Configurações</span><h1>Layout de impressão</h1><p>A página abaixo é o próprio PDF. Clique no texto que deseja ajustar.</p></div></div>
    <div class="print-layout-toolbar">
      <label>Modelo<select id="layout-model"><option value="covre">Pagamento de frete</option><option value="chapa">Carga / descarga</option></select></label>
      <label>Dados da prévia<select id="layout-record"><option value="">Dados de exemplo</option></select></label>
      <label id="layout-payment-label">Pagamento do exemplo<select id="layout-payment"><option value="cheque">Cheque</option><option value="deposito">Depósito</option><option value="pix">PIX</option><option value="dinheiro">Dinheiro</option></select></label>
      <button id="layout-save" type="button" disabled>Salvar layout</button>
    </div>
    <div class="print-layout-actions"><button id="layout-undo" type="button" class="secondary" disabled>Desfazer</button><button id="layout-reset" type="button" class="secondary">Restaurar original</button><button id="layout-download" type="button" class="secondary" disabled>Baixar este PDF</button><a id="layout-open-pdf" class="secondary" target="_blank" rel="noopener" aria-disabled="true">Abrir PDF / imprimir</a><span id="layout-dirty">Layout salvo</span></div>
    <p id="layout-status" role="status" aria-live="polite">Carregando PDF…</p>
    <div class="print-layout-editor">
      <div class="print-layout-workspace"><div class="print-layout-caption"><span>A4 · PDF real</span><label>Zoom<select id="layout-zoom"><option value="fit">Ajustar à tela</option><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option></select></label></div><div class="print-layout-scroll"><div id="layout-preview" class="print-layout-paper" tabindex="0" aria-label="PDF editável: selecione um texto para mover"><canvas id="layout-canvas"></canvas><div id="layout-hitareas"></div></div></div></div>
      <aside class="print-layout-inspector"><span class="section-kicker">Texto selecionado</span><h2 id="layout-selected-title">Clique no recibo</h2><p id="layout-selected-text">Selecione um texto diretamente na página para ajustar sua posição e formatação.</p>
      <div id="layout-inspector-controls" hidden><div class="print-layout-arrows"><button type="button" data-move="up" aria-label="Mover para cima">↑</button><button type="button" data-move="left" aria-label="Mover para esquerda">←</button><button type="button" data-move="down" aria-label="Mover para baixo">↓</button><button type="button" data-move="right" aria-label="Mover para direita">→</button></div><p class="print-layout-hint">Setas: mover 1 ponto<br>Shift + seta: mover 10 pontos</p>
      <label>Tamanho da fonte (pt)<input id="layout-size" type="number" min="6" max="24" step="0.5"></label><label>Peso<select id="layout-weight"><option value="auto">Original do recibo</option><option value="normal">Normal</option><option value="bold">Negrito</option></select></label><label>Alinhamento<select id="layout-align"><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label>
      <details><summary>Posição precisa</summary><label>Horizontal (pt)<input id="layout-x" type="number" min="0" max="595.56" step="1"></label><label>Altura a partir da base (pt)<input id="layout-y" type="number" min="0" max="842.04" step="1"></label></details><button id="layout-reset-item" type="button" class="secondary">Restaurar este texto</button></div>
      <p class="print-layout-hint">Ao salvar, as próximas emissões e edições usarão este layout. PDFs já salvos no histórico mantêm a versão emitida.</p><p class="print-layout-hint">Na impressão, use A4 e escala 100% / tamanho real.</p></aside>
    </div>`;
  section.querySelector('.section-heading p').textContent='A página abaixo é o próprio PDF. Clique em um texto ou linha para ajustar.';
  section.querySelector('.print-layout-inspector .section-kicker').textContent='Item selecionado';
  el('layout-preview').setAttribute('aria-label','PDF editável: selecione um texto ou linha para mover');
  el('layout-reset-item').textContent='Restaurar este item';
  const widthLabel=document.createElement('label');widthLabel.hidden=true;widthLabel.innerHTML='Largura da linha (pt)<input id="layout-width" type="number" min="10" max="595.56" step="1">';
  el('layout-size').closest('label').after(widthLabel);

  let tipo='covre',selected=null,rectangles=[],pdfBlob=null,pdfURL=null,revision=0,timer,readerPromise;
  let validPreview=false,renderedRevision=-1;
  const drafts=new Map(),histories=new Map(),baselines=new Map();
  const configKey=type=>'receipt-layout-'+type;
  function normalize(value,type){
    const output={version:2,fields:{}};
    if(!value)return output;
    const base=window.RECEIPT_MODELS['layout.json'].json[type];
    for(const [key,m] of Object.entries(value.fields||{})){
      if(!labels[key]&&!/^declaracao[0-3]$/.test(key))continue;
      if(!m||!['x','y','size'].every(k=>Number.isFinite(m[k])))throw new Error('Configuração de layout inválida. Restaure o original.');
      const line=lineKeys.has(key);
      if(m.x<0||m.x>595.56||m.y<0||m.y>842.04||m.size<(line ? 0.5 : 6)||m.size>(line ? 12 : 24))throw new Error('Posição ou tamanho fora dos limites do papel.');
      const metric={x:m.x,y:m.y,size:m.size};
      if(line){if(!Number.isFinite(m.width)||m.width<10||m.x+m.width>595.56||m.y+m.size>842.04)throw new Error('A linha divisória ultrapassa a página.');metric.width=m.width;}
      if(['left','center','right'].includes(m.align))metric.align=m.align;
      if(['auto','normal','bold'].includes(m.weight))metric.weight=m.weight;
      if(!value.version&&['localData','assinatura','assinaturaDocumento'].includes(key)&&!m.align){metric.x=base.width/2+(m.x-base.fields[key].x);metric.align='center';}
      output.fields[key]=metric;
    }
    return output;
  }
  async function read(type){await databaseReady;const saved=await transaction('readonly',s=>s.get(configKey(type)),'config');return saved?normalize(saved.value,type):null;}
  const current=()=>drafts.get(tipo)||{version:2,fields:{}};
  function message(text,error=false){el('layout-status').textContent=text;el('layout-status').classList.toggle('error',error);}
  function changed(){return JSON.stringify(current())!==baselines.get(tipo);}
  function controls(){
    el('layout-save').disabled=!validPreview||renderedRevision!==revision;
    el('layout-download').disabled=!validPreview||renderedRevision!==revision;
    el('layout-open-pdf').setAttribute('aria-disabled',String(!validPreview||renderedRevision!==revision));
    el('layout-dirty').textContent=changed()?'Alterações ainda não salvas':'Layout salvo';
    el('layout-undo').disabled=!(histories.get(tipo)||[]).length;
  }
  function remember(){const list=histories.get(tipo)||[];list.push(structuredClone(current()));if(list.length>50)list.shift();histories.set(tipo,list);}
  function sample(){return {tipo,numero:'0001',pagadorNome:'COVRE & CIA LTDA',pagadorDocumento:'28.419.232/0001-06',pagadorIE:'080.989.89-6',pagadorEndereco:'Av. Agenor Luiz Heringer, 463, Centro',pagadorCidade:'Pinheiros/ES',pagadorCEP:'29980-000',nome:'JOÃO DA SILVA',documento:'529.982.247-25',servico:tipo==='covre'?'Transporte de mercadoria':'Descarga de mercadoria',nota:'12345',destino:'Vitória/ES',dataServico:today(),dataEmissao:today(),local:'Pinheiros/ES',valor:6445.54,emitente:'COVRE & CIA LTDA',banco:'756 - SICOOB (COOPERATIVA DE CRÉDITO CONEXÃO)',agencia:'3007',conta:'316.134-0',dataCheque:today(),cheque:'123456',formaPagamento:el('layout-payment').value,depositoTitular:'JOÃO DA SILVA',depositoBanco:'SICOOB',depositoAgencia:'3007',depositoConta:'316.134-0',depositoTipo:'corrente',pixTipo:'email',pixChave:'pagamento@exemplo.com'};}
  function previewData(){const record=records.find(r=>r.id===el('layout-record').value&&r.data.tipo===tipo);return record?{data:structuredClone(record.data),attachment:record.attachment||null,attachmentPDF:record.attachmentPDF||(!Object.hasOwn(record,'attachment')?record.pdf:null)}:{data:sample(),attachment:null,attachmentPDF:null};}
  function populateRecords(){const previous=el('layout-record').value;el('layout-record').replaceChildren(new Option('Dados de exemplo',''));for(const record of records.filter(r=>r.data.tipo===tipo))el('layout-record').add(new Option('Nº '+(record.data.numero||'—')+' · '+record.data.nome,record.id));el('layout-record').value=[...el('layout-record').options].some(o=>o.value===previous)?previous:'';el('layout-payment-label').hidden=Boolean(el('layout-record').value);}
  async function pdfReader(){if(!readerPromise)readerPromise=import('./vendor/pdfjs/pdf.js').then(pdfjs=>{pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.js',document.baseURI).href;return pdfjs;}).catch(error=>{readerPromise=null;throw error;});return readerPromise;}
  function selection(){
    const box=rectangles.find(r=>r.key===selected);
    el('layout-inspector-controls').hidden=!box;
    el('layout-selected-title').textContent=box?nameFor(box.key):'Clique no recibo';
    el('layout-selected-text').textContent=box?(box.kind==='line'?'Mova com as setas e ajuste a largura ou a espessura.':box.text):'Selecione um texto ou linha diretamente na página para ajustar.';
    const isLine=box?.kind==='line';
    el('layout-size').closest('label').firstChild.textContent=isLine?'Espessura da linha (pt)':'Tamanho da fonte (pt)';
    el('layout-size').min=isLine?'0.5':'6';el('layout-size').max=isLine?'12':'24';el('layout-size').step=isLine?'0.05':'0.5';
    widthLabel.hidden=!isLine;el('layout-weight').closest('label').hidden=isLine;el('layout-align').closest('label').hidden=isLine;
    if(isLine)el('layout-width').value=Number((current().fields[selected]?.width??box.metric.width).toFixed(2));
    if(box){const m={...box.metric,...current().fields[selected]};for(const prop of ['x','y','size'])el('layout-'+prop).value=Number(m[prop].toFixed(2));el('layout-align').value=m.align||'left';el('layout-weight').value=m.weight||'auto';}
    for(const button of el('layout-hitareas').children){button.classList.toggle('selected',button.dataset.field===selected);button.setAttribute('aria-pressed',String(button.dataset.field===selected));}
  }
  function hitAreas(){
    const layer=el('layout-hitareas');layer.replaceChildren();
    for(const box of rectangles){const button=document.createElement('button');button.type='button';button.className='print-layout-hit';button.dataset.field=box.key;button.title=nameFor(box.key);button.setAttribute('aria-label',nameFor(box.key)+': '+box.text);button.style.left=(box.x/595.56*100)+'%';button.style.top=((842.04-box.y-box.height)/842.04*100)+'%';button.style.width=(box.width/595.56*100)+'%';button.style.height=(box.height/842.04*100)+'%';button.onclick=()=>{selected=box.key;selection();el('layout-preview').focus({preventScroll:true});};layer.append(button);}
    selection();
  }
  async function render(request){
    let task,doc;
    try{
      const input=previewData(),layout=structuredClone(current()),boxes=[];
      const source=records.find(r=>r.id===el('layout-record').value&&r.data.tipo===tipo);
      if(source&&window.receiptFiles){const loaded=await window.receiptFiles.hydrate(source);input.attachment=loaded.attachment||null;input.attachmentPDF=loaded.attachmentPDF||(!Object.hasOwn(loaded,'attachment')?loaded.pdf:null);}
      const blob=await generatePDF(input.data,{layout,attachment:input.attachment,attachmentPDF:input.attachmentPDF,onField:box=>boxes.push(box)});
      const pdfjs=await pdfReader();if(request!==revision)return;
      task=pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer()),standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',document.baseURI).href,isEvalSupported:false});doc=await task.promise;
      const page=await doc.getPage(1),viewport=page.getViewport({scale:2});
      const canvas=document.createElement('canvas');canvas.id='layout-canvas';canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
      if(request!==revision)return;
      rectangles=boxes;pdfBlob=blob;el('layout-canvas').replaceWith(canvas);hitAreas();
      if(pdfURL)URL.revokeObjectURL(pdfURL);pdfURL=URL.createObjectURL(blob);el('layout-open-pdf').href=pdfURL;
      renderedRevision=request;validPreview=true;el('layout-preview').setAttribute('aria-busy','false');
      message('PDF atualizado · '+(el('layout-record').value?'dados do recibo selecionado':'dados de exemplo')+' · clique em um texto ou linha para editar.');controls();
    }catch(error){if(request===revision){validPreview=false;el('layout-preview').setAttribute('aria-busy','false');message('Não foi possível atualizar o PDF: '+error.message,true);controls();}}
    finally{if(doc)await doc.destroy();else if(task)await task.destroy();}
  }
  function schedule(){revision++;validPreview=false;clearTimeout(timer);controls();message('Atualizando o PDF…');el('layout-preview').setAttribute('aria-busy','true');timer=setTimeout(()=>render(revision),100);}
  function change(patch){const box=rectangles.find(r=>r.key===selected);if(!box)return;remember();current().fields[selected]={...box.metric,...current().fields[selected],...patch};delete current().fields[selected].text;delete current().fields[selected].bounds;schedule();selection();}
  function move(direction,large=false){const box=rectangles.find(r=>r.key===selected);if(!box)return;const m={...box.metric,...current().fields[selected]},step=large?10:1;change({x:Math.max(0,Math.min(595.56,m.x+(direction==='left'?-step:direction==='right'?step:0))),y:Math.max(0,Math.min(842.04,m.y+(direction==='up'?step:direction==='down'?-step:0)))});}
  async function open(){try{await databaseReady;await refresh();tipo=el('layout-model').value;if(!drafts.has(tipo)){const saved=await read(tipo)||{version:2,fields:{}};drafts.set(tipo,saved);baselines.set(tipo,JSON.stringify(saved));}populateRecords();selected=null;schedule();}catch(error){message(error.message,true);}}
  el('layout-model').onchange=open;
  el('layout-record').onchange=()=>{el('layout-payment-label').hidden=Boolean(el('layout-record').value);selected=null;schedule();};
  el('layout-payment').onchange=()=>{selected=null;schedule();};
  el('layout-save').onclick=async()=>{if(!validPreview||renderedRevision!==revision)return;const type=tipo,savedRevision=revision;el('layout-save').disabled=true;try{const value=normalize(structuredClone(current()),type);await transaction('readwrite',s=>s.put({id:configKey(type),value}),'config');baselines.set(type,JSON.stringify(value));if(tipo===type&&revision===savedRevision){drafts.set(tipo,value);message('Layout salvo. O PDF de cada nova emissão usará estas posições e fontes.');}}catch(error){message(error.message,true);}finally{controls();}};
  el('layout-reset').onclick=()=>{remember();drafts.set(tipo,{version:2,fields:{}});schedule();};
  el('layout-reset-item').onclick=()=>{if(!selected)return;remember();delete current().fields[selected];schedule();};
  el('layout-undo').onclick=()=>{const last=histories.get(tipo)?.pop();if(last){drafts.set(tipo,last);schedule();}};
  el('layout-download').onclick=()=>{if(validPreview&&renderedRevision===revision)downloadBlob(pdfBlob,'previa-recibo-'+tipo+'.pdf');};
  el('layout-open-pdf').onclick=event=>{if(!validPreview||renderedRevision!==revision)event.preventDefault();};
  el('layout-zoom').onchange=()=>{const value=el('layout-zoom').value;el('layout-preview').style.width=value==='fit'?'min(100%, 595.56px)':(595.56*Number(value))+'px';};
  section.addEventListener('keydown',event=>{if(event.target.matches('input,select,textarea')||!selected||section.hidden||el('settings-layout')?.hidden)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key.slice(5).toLowerCase(),event.shiftKey);}if(event.key==='Escape'){selected=null;selection();}});
  section.querySelectorAll('[data-move]').forEach(button=>button.onclick=event=>move(button.dataset.move,event.shiftKey));
  el('layout-width').oninput=event=>{if(event.target.value&&event.target.checkValidity())change({width:Number(event.target.value)});};
  for(const prop of ['x','y','size','align','weight'])el('layout-'+prop).oninput=event=>{const input=event.target;if(['x','y','size'].includes(prop)){if(!input.value||!input.checkValidity())return;change({[prop]:Number(input.value)});}else if(prop==='align'){const box=rectangles.find(r=>r.key===selected);if(box)change({align:input.value,x:box.x+(input.value==='center'?box.width/2:input.value==='right'?box.width:0)});}else change({[prop]:input.value});};
  window.receiptLayout={read,open,normalize};
})();
