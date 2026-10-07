// Free-text invoices use measured lines; overflow stays in the same PDF.
(() => {
  'use strict';
  const following=new Set(['destino','dataServico','valorServico','linhaPagamento','tituloPagamento','emitente','banco','agencia','conta','dataCheque','cheque','valorCheque','declaracao0','declaracao1','declaracao2','declaracao3','localData']);
  function wrap(text,measure,width){
    const lines=[];
    for(const paragraph of text.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n')){
      let line='';
      for(const token of paragraph.match(/\S+| +/gu)||[]){
        if(measure(line+token)<=width){line+=token;continue;}
        if(line){lines.push(line.trimEnd());line='';}
        if(!token.trim())continue;
        if(measure(token)<=width){line=token;continue;}
        // Break even unspaced invoice keys, without losing characters or accents.
        for(const char of token){if(line&&measure(line+char)>width){lines.push(line);line='';}line+=char;}
      }
      lines.push(line.trimEnd());
    }
    return lines;
  }
  function plan(data,metrics,staticFields,customLayout,baseFields=metrics.fields){
    if(!data.nota)return null;
    const m={...metrics.fields.nota,align:metrics.fields.nota.align||'left'},ctx=document.createElement('canvas').getContext('2d');
    ctx.font=(m.weight==='bold'?'bold ':'')+m.size+'px Arial';
    const measure=text=>ctx.measureText(text).width;
    const width=Math.min(480,m.align==='center'?2*Math.min(m.x,metrics.width-m.x):m.align==='right'?m.x:metrics.width-m.x-18);
    if(width<m.size*3)throw new Error('A posição da nota fiscal está muito próxima da borda. Ajuste-a no layout de impressão.');
    const lineHeight=Math.max(12.42,m.size*1.3),lines=wrap('Nota fiscal: '+data.nota,measure,width);
    // Keep reflow independent of manual moves of the following field, so the
    // visual editor's arrows do not get cancelled by a recalculated offset.
    const nextKey=metrics.fields.destino?'destino':'dataServico';
    const gap=m.y-baseFields[nextKey].y,minGap=Math.max(m.size,metrics.fields[nextKey].size)+6;
    const signatureY=customLayout?.fields?.linhaAssinatura?.y??staticFields.linhaAssinatura.y;
    const maxShift=Math.max(0,metrics.fields.localData.y-signatureY-28);
    const capacity=Math.max(1,Math.floor((maxShift+gap-minGap)/lineHeight)+1);
    const overflow=lines.length>capacity;
    const inline=overflow?lines.slice(0,capacity-1):lines;
    const remaining=overflow?lines.slice(capacity-1):[];
    if(overflow)inline.push(capacity===1?'Nota fiscal: continua na página 2':'Continua na página 2');
    const shift=Math.max(0,(inline.length-1)*lineHeight-gap+minGap);
    return {metric:m,width,lineHeight,inline,remaining,shift:Math.min(maxShift,shift)};
  }
  async function block(pdf,page,lines,m,lineHeight){
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),font=(m.weight==='bold'?'bold ':'')+m.size+'px Arial';
    ctx.font=font;
    const width=Math.max(1,...lines.map(line=>ctx.measureText(line).width)),baseline=Math.max(12,Math.ceil(m.size)+2),height=baseline+4+(lines.length-1)*lineHeight;
    const x=m.align==='center'?m.x-width/2:m.align==='right'?m.x-width:m.x;
    if(x<0||x+width>page.getWidth()||m.y+baseline>page.getHeight()||m.y-(height-baseline)<0)throw new Error('A posição da nota fiscal ultrapassa a página. Ajuste-a no layout de impressão.');
    canvas.width=Math.ceil((width+1)*4);canvas.height=Math.ceil(height*4);ctx.scale(4,4);ctx.font=font;ctx.fillStyle='#000';
    lines.forEach((line,index)=>{const w=ctx.measureText(line).width;ctx.fillText(line,m.align==='center'?(width-w)/2:m.align==='right'?width-w:0,baseline+index*lineHeight);});
    const image=await pdf.embedPng(canvas.toDataURL('image/png'));
    page.drawImage(image,{x,y:m.y-(height-baseline),width:canvas.width/4,height:canvas.height/4});
    return {x,y:m.y-(height-baseline),width:canvas.width/4,height:canvas.height/4};
  }
  async function draw(pdf,page,data,plan,options){
    if(!plan)return;
    const {metric:m,inline,remaining,lineHeight}=plan;
    const bounds=await block(pdf,page,inline,m,lineHeight);
    options.onField?.({key:'nota',text:inline.join('\n'),metric:m,...bounds});
    if(!remaining.length)return;
    // Page-sized blocks avoid a giant canvas, even for a long list of companies.
    const top=724,bottom=56,perPage=Math.max(1,Math.floor((top-bottom)/lineHeight)+1);
    const count=Math.ceil(remaining.length/perPage)+1;
    const regular=await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
    page.drawText('Página 1 de '+count,{x:page.getWidth()/2-30,y:10,size:8,font:regular});
    for(let offset=0;offset<remaining.length;offset+=perPage){
      const extra=pdf.addPage([page.getWidth(),page.getHeight()]),number=2+offset/perPage;
      await drawLayoutText(pdf,extra,'','NOTAS FISCAIS - CONTINUAÇÃO',{x:56.784,y:786,size:12,weight:'bold'});
      await drawLayoutText(pdf,extra,'','Recibo nº '+(data.numero||'—')+' · '+modelName(data.tipo),{x:56.784,y:765,size:10});
      await drawLayoutText(pdf,extra,'','Recebedor: '+data.nome,{x:56.784,y:748,size:9.48});
      const column=m.align==='center'?page.getWidth()/2:m.align==='right'?page.getWidth()-56.784:56.784;
      await block(pdf,extra,remaining.slice(offset,offset+perPage),{...m,x:column,y:top},lineHeight);
      extra.drawText('Página '+number+' de '+count,{x:page.getWidth()/2-30,y:24,size:8,font:regular});
    }
  }
  window.receiptInvoice={plan,draw,following};
})();
