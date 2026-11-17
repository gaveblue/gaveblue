// Cada opção mantém seu ID comercial, preço, nome completo e ficha técnica.
export function groupProducts(products){
 const groups=[],map=new Map();
 for(const p of products??[]){
  const name=typeof p.variant_group_name==='string'?p.variant_group_name.trim():'';
  const label=typeof p.variant_label==='string'?p.variant_label.trim():'';
  if(!name||!label){groups.push({key:p.id,name:p.name,product:p,variants:[]});continue}
  const id=JSON.stringify([p.category_id,name.toLocaleLowerCase('pt-BR')]);
  let g=map.get(id);
  if(!g){g={key:p.id,name,product:p,variants:[]};map.set(id,g);groups.push(g)}
  g.variants.push(p);
  if(!g.product.image_url&&p.image_url)g.product=p;
 }
 return groups.map(g=>({...g,price:Math.min(...(g.variants.length?g.variants:[g.product]).map(p=>Number(p.price_cents))),search:g.variants.map(p=>p.name).join(' ')}));
}
export function chooseVariant(group,money,callback){
 if(!group)return;
 if(!group.variants.length){callback(group.product);return}
 const dlg=document.createElement('dialog');dlg.className='iv-variant-picker';
 Object.assign(dlg.style,{position:'fixed',inset:'auto 0 0',margin:'0 auto',width:'min(100%,480px)',maxWidth:'100%',boxSizing:'border-box',border:'0',borderRadius:'22px 22px 0 0',padding:'20px',maxHeight:'80dvh',overflow:'auto',background:'#fff',color:'#243247',boxShadow:'0 -12px 40px #1c293a30'});
 dlg.setAttribute('aria-label','Escolher variação de '+group.name);
 const heading=document.createElement('h2');heading.textContent=group.name;Object.assign(heading.style,{fontSize:'20px',margin:'0 0 6px'});
 const hint=document.createElement('p');hint.textContent='Escolha uma opção · obrigatório';Object.assign(hint.style,{color:'#68798b',fontSize:'13px',margin:'0 0 15px'});
 dlg.append(heading,hint);let chosen=null;
 for(const p of group.variants){
  const b=document.createElement('button');b.type='button';Object.assign(b.style,{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',width:'100%',padding:'14px',margin:'0 0 8px',border:'1px solid #e6eaf0',borderRadius:'12px',background:'#fff',color:'#25344a',cursor:'pointer',textAlign:'left',fontSize:'14px'});
  const label=document.createElement('span');label.textContent=p.variant_label;
  const price=document.createElement('strong');price.textContent=money(p.price_cents);price.style.color='#ef7900';
  b.append(label,price);b.onclick=()=>{chosen=p;dlg.close()};dlg.append(b);
 }
 const close=document.createElement('button');close.type='button';close.textContent='Cancelar';Object.assign(close.style,{display:'block',width:'100%',background:'#f4f6f8',color:'#344256',border:'0',padding:'12px',borderRadius:'11px',cursor:'pointer'});close.onclick=()=>dlg.close();dlg.append(close);
 dlg.addEventListener('close',()=>{dlg.remove();if(chosen)callback(chosen)},{once:true});
 dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
 document.body.append(dlg);dlg.showModal();close.focus({preventScroll:true});
}
