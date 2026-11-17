// Intervalo 1.1.0-rc.20 — biblioteca compartilhada entre produtos de UM restaurante.
// Não duplica os arquivos: atribui a URL já existente a quantos produtos forem necessários.
const validPhoto=url=>typeof url==='string'&&url.length<=1200&&/^https:\/\/[^\s<>"']+$/i.test(url);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export async function openProductImageLibrary({supabase,restaurant,onSelect}){
 if(!restaurant?.id||typeof onSelect!=='function')throw Error('Biblioteca indisponível');
 const existing=document.querySelector('dialog.iv-photo-library[open]');
 if(existing)return;
 const dialog=document.createElement('dialog');
 dialog.className='iv-photo-library';
 dialog.setAttribute('aria-label','Biblioteca de fotos do restaurante');
 dialog.innerHTML='<div class="iv-photo-library-shell"><header class="iv-photo-library-head">'
  +'<div><strong>Biblioteca de fotos</strong><small>Imagens deste restaurante · reutilize sem enviar novamente</small></div>'
  +'<button class="iv-photo-library-close" aria-label="Fechar biblioteca" type="button">×</button></header>'
  +'<div class="iv-photo-library-toolbar"><input class="iv-photo-library-search" type="search" placeholder="Buscar pelo nome do produto" aria-label="Buscar fotos" autocomplete="off">'
  +'<nav aria-label="Filtrar fotos" class="iv-photo-library-filters">'
  +'<button type="button" data-library-filter="all" aria-pressed="true">Todas</button>'
  +'<button type="button" data-library-filter="uploaded" aria-pressed="false">Enviadas</button>'
  +'<button type="button" data-library-filter="linked" aria-pressed="false">Em produtos</button>'
  +'</nav></div><div class="iv-photo-library-body"><div class="iv-photo-library-grid" aria-label="Fotos disponíveis"></div>'
  +'<p class="iv-photo-library-state" role="status" aria-live="polite">Buscando fotos do restaurante...</p>'
  +'<button type="button" class="iv-photo-library-more" hidden>Carregar mais</button></div>'
  +'<footer class="iv-photo-library-foot">A mesma foto pode ser usada em vários produtos sem duplicar arquivos.</footer></div>';
 document.body.append(dialog);
 let filter='all',query='',nextOffset=0,hasMore=false,busy=false,disposed=false,loadError='';
 const by=sel=>dialog.querySelector(sel);
 const items=new Map();
 const close=()=>{if(dialog.open)dialog.close()};
 const onClose=()=>{disposed=true;dialog.remove()};
 dialog.addEventListener('close',onClose,{once:true});
 by('.iv-photo-library-close').onclick=close;
 dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
 const state=by('.iv-photo-library-state'),grid=by('.iv-photo-library-grid'),more=by('.iv-photo-library-more');
 const setState=(message,error=false)=>{state.textContent=message;state.dataset.error=String(!!error)};
 const add=(item,source)=>{
  if(!item||!validPhoto(item.url))return;
  const old=items.get(item.url);
  const used=Math.max(Number(old?.used||0),Number(item.used||0));
  const names=[...new Set([...(old?.product_names||[]),...(item.product_names||item.names||[])].filter(x=>typeof x==='string'&&x.trim()))];
  items.set(item.url,{url:item.url,source:old?.source==='uploaded'||source==='uploaded'?'uploaded':'linked',
   used,names,created_at:item.created_at??old?.created_at??null});
 };
 const render=()=>{
  grid.replaceChildren();
  const results=[...items.values()].filter(item=>{
   if(filter==='uploaded'&&item.source!=='uploaded')return false;
   if(filter==='linked'&&item.used<=0)return false;
   if(query&&!item.names.join(' ').toLocaleLowerCase('pt-BR').includes(query)&&
     !item.url.toLocaleLowerCase('pt-BR').includes(query))return false;
   return true;
  });
  const frag=document.createDocumentFragment();
  for(const item of results){
   const button=document.createElement('button');button.type='button';button.className='iv-photo-library-tile';
   button.setAttribute('aria-label','Usar foto '+(item.names[0]||'da biblioteca')+(item.used?' (em '+item.used+' produtos)':''));
   const image=document.createElement('img');image.alt=item.names[0]?'Foto de '+item.names[0]:'Foto da biblioteca';image.loading='lazy';
   image.referrerPolicy='no-referrer';image.src=item.url;
   const name=document.createElement('span');name.className='iv-photo-library-name';
   name.textContent=item.names[0]||'Foto da biblioteca';
   const badge=document.createElement('small');badge.className='iv-photo-library-count';
   badge.textContent=item.used===1?'Em 1 produto':item.used>1?'Em '+item.used+' produtos':'Disponível';
   image.onerror=()=>{
    button.disabled=true;
    const fallback=document.createElement('span');fallback.className='iv-photo-library-broken';
    fallback.textContent='Imagem indisponível';
    image.replaceWith(fallback);
    badge.textContent='Link quebrado';
   };
   button.onclick=()=>{
    if(button.disabled)return;
    try{onSelect(item.url);close()}catch(e){setState(e.message||'Não foi possível selecionar foto',true)}
   };
   button.append(image,name,badge);frag.append(button);
  }
  grid.append(frag);
  if(!busy){
   if(loadError)setState(loadError,true);
   else if(results.length===0){
    if(items.size===0)setState('Nenhuma foto cadastrada ainda. Envie a primeira usando Galeria ou Câmera.');
    else if(filter==='uploaded')setState('Nenhuma foto enviada encontrada.');
    else setState('Nenhuma imagem encontrada neste filtro.');
   }else setState(results.length+' foto(s) encontradas. Toque em uma para reutilizar.');
  }
  more.hidden=!hasMore&&!loadError;more.disabled=busy;
  more.textContent=busy?'Carregando...':loadError?'Tentar novamente':'Carregar mais fotos';
 };
 async function fetchPhotos(){
  if(busy||disposed)return;
  busy=true;loadError='';more.disabled=true;setState('Carregando fotos...');
  const offset=nextOffset;
  try{
   const {data,error}=await supabase.functions.invoke('restaurant-product-photos',{
    body:{action:'list',restaurant_id:restaurant.id,offset}
   });
   if(disposed)return;
   if(error||data?.error){
    let message=data?.error||error?.message||'Erro ao buscar fotos';
    try{const detail=await error?.context?.json?.();if(detail?.error)message=detail.error}catch{}
    throw Error(message);
   }
   if(!Array.isArray(data?.items)||!Array.isArray(data?.linked)||typeof data.next_offset!=='number')
    throw Error('Biblioteca respondeu com dados inválidos');
   data.items.forEach(i=>add(i,'uploaded'));
   data.linked.forEach(i=>add(i,'linked'));
   nextOffset=data.next_offset;hasMore=!!data.has_more;
  }catch(e){
   if(disposed)return;
   hasMore=false;
   loadError=e.message||'Não foi possível carregar fotos';
   setState(loadError,true);
  }finally{
   busy=false;
   if(!disposed)render();
  }
 }
 by('.iv-photo-library-search').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('pt-BR');render()});
 dialog.querySelectorAll('[data-library-filter]').forEach(button=>button.onclick=()=>{
  filter=button.dataset.libraryFilter;
  dialog.querySelectorAll('[data-library-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  render();
 });
 more.onclick=fetchPhotos;
 dialog.showModal();
 void fetchPhotos();
 return dialog;
}
