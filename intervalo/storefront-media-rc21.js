// Intervalo 1.1.0-rc.21 · logo e capa da vitrine; reusa Storage e biblioteca do restaurante.
import {openProductImageLibrary} from './product-image-library-rc20.js?v=1.1.0-rc.20';
const BUCKET='intervalo-product-images';
const MAX_RAW=16*1024*1024, MAX_UPLOAD=1500000;
const safe=url=>typeof url==='string'&&url.length<=1200&&/^https:\/\/[^\s<>"']+$/i.test(url);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const specs={logo:{title:'Logo do restaurante',hint:'Quadrada · aparece como foto de perfil'},banner:{title:'Capa da vitrine',hint:'Horizontal · aparece no topo da loja'}};
export function storefrontMediaFields(store={}){
 return '<div class="iv-on-media-fields">'+Object.entries(specs).map(([key,s])=>
  '<div class="iv-on-media-field" data-store-media="'+key+'">'
  +'<div class="iv-on-media-heading"><strong>'+s.title+'</strong><small>'+s.hint+'</small></div>'
  +'<div class="iv-on-media-preview '+key+'" role="img" aria-label="Prévia de '+s.title+'"></div>'
  +'<div class="iv-on-media-actions"><button type="button" data-media-pick>Enviar foto</button>'
  +'<button type="button" data-media-library>Biblioteca</button>'
  +'<button type="button" data-media-remove>Remover</button></div>'
  +'<input type="file" data-media-file hidden accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif">'
  +'<input type="hidden" name="'+key+'_url" value="'+esc(safe(store[key+'_url'])?store[key+'_url']:'')+'">'
  +'<small class="iv-on-media-status" data-media-status aria-live="polite"></small></div>'
 ).join('')+'</div>';
}
async function optimize(file){
 if(!file||!file.type.startsWith('image/')||file.size>MAX_RAW)throw Error('Escolha uma imagem de até 16 MB.');
 const objectUrl=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{
   const image=new Image(),timeout=setTimeout(()=>reject(Error('Não foi possível abrir a imagem.')),15000);
   image.onload=()=>{clearTimeout(timeout);resolve(image)};
   image.onerror=()=>{clearTimeout(timeout);reject(Error('Formato de imagem não suportado.'))};
   image.src=objectUrl;
  });
  if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>100000000)throw Error('Imagem inválida ou grande demais.');
  const scale=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Não foi possível preparar a imagem.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
  for(const quality of [0.84,0.72,0.60]){
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
   if(blob&&blob.size<=MAX_UPLOAD)return blob;
  }
  throw Error('A imagem ultrapassou o limite após otimização.');
 }finally{URL.revokeObjectURL(objectUrl)}
}
export function initStorefrontMedia({form,supabase,restaurant}){
 const controllers={};
 for(const key of Object.keys(specs)){
  const root=form.querySelector('[data-store-media="'+key+'"]');
  if(!root)throw Error('Campo de imagem '+key+' indisponível.');
  const field=root.querySelector('input[name="'+key+'_url"]'),fileInput=root.querySelector('[data-media-file]');
  const preview=root.querySelector('.iv-on-media-preview'),status=root.querySelector('[data-media-status]');
  let selected=null,objectUrl=null,uploaded=null;
  const statusText=(s,kind='')=>{status.textContent=s;status.dataset.state=kind};
  const revoke=()=>{if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null}};
  const render=()=>{
   preview.replaceChildren();
   const url=objectUrl||field.value.trim();
   if(!url){preview.textContent=key==='logo'?'Sem logo':'Sem capa';return}
   if(!objectUrl&&!safe(url)){preview.textContent='Imagem inválida';return}
   const img=document.createElement('img');img.alt=specs[key].title;
   img.referrerPolicy='no-referrer';img.src=url;
   img.onerror=()=>{if(img.isConnected){img.replaceWith(document.createTextNode('Não foi possível carregar a imagem'));statusText('Imagem indisponível. Envie outra foto.','error')}};
   preview.append(img);
  };
  root.querySelector('[data-media-pick]').onclick=()=>fileInput.click();
  fileInput.onchange=()=>{
   const file=fileInput.files?.[0];if(!file)return;
   if(!file.type.startsWith('image/')||file.size>MAX_RAW){statusText('Escolha uma imagem válida de até 16 MB.','error');fileInput.value='';return}
   revoke();selected=file;uploaded=null;field.value='';objectUrl=URL.createObjectURL(file);render();statusText('A imagem será enviada ao salvar a vitrine.','success');
  };
  root.querySelector('[data-media-library]').onclick=()=>{
   void openProductImageLibrary({supabase,restaurant,onSelect:url=>{
    if(!safe(url)){statusText('Imagem da biblioteca inválida.','error');return}
    revoke();selected=null;uploaded=null;fileInput.value='';field.value=url;render();
    statusText('Imagem reutilizada da biblioteca, sem novo upload.','success');
   }}).catch(e=>statusText(e.message||'Não foi possível abrir a biblioteca.','error'));
  };
  root.querySelector('[data-media-remove]').onclick=()=>{
   revoke();selected=null;uploaded=null;fileInput.value='';field.value='';render();statusText('Imagem removida. Salve para confirmar.');
  };
  render();
  controllers[key]=async()=>{
   if(!selected)return field.value.trim();
   if(uploaded?.file===selected)return uploaded.url;
   statusText('Otimizando e enviando a imagem...');
   const blob=await optimize(selected);
   const {data:permit,error:e}=await supabase.functions.invoke('restaurant-product-photos',{body:{action:'sign',restaurant_id:restaurant.id}});
   if(e||permit?.error)throw Error(permit?.error||'Não foi possível autorizar o envio da imagem.');
   if(permit.bucket!==BUCKET||!permit.path?.startsWith(restaurant.id+'/')||!permit.path.endsWith('.jpg')||!permit.token||!safe(permit.public_url))throw Error('Autorização de imagem inválida.');
   const {error:uploadError}=await supabase.storage.from(BUCKET).uploadToSignedUrl(permit.path,permit.token,blob,{contentType:'image/jpeg',upsert:false});
   if(uploadError)throw Error('Falha ao enviar a imagem: '+uploadError.message);
   uploaded={file:selected,url:permit.public_url};
   statusText('Imagem enviada.','success');
   return uploaded.url;
  };
 }
 return {async resolve(){return {logo_url:await controllers.logo(),banner_url:await controllers.banner()}}};
}
