// Intervalo 1.1.0-rc.20 — foto local/URL, prévia e biblioteca reutilizável de imagens.
import {openProductImageLibrary} from './product-image-library-rc20.js?v=1.1.0-rc.20';
// Não oferece upload a visitantes: o servidor assina um único caminho para Master/gerente.
const BUCKET='intervalo-product-images';
const controllers=new WeakMap();
const MAX_RAW=16*1024*1024;
const MAX_UPLOAD=1500000;
const ACCEPT='image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const validUrl=s=>typeof s==='string'&&s.length<=1200&&/^https:\/\/[^\s<>"']+$/i.test(s);
async function checkImageURL(value){
 const url=String(value||'').trim();
 if(!validUrl(url))throw Error('Use um link HTTPS direto de imagem, com até 1.200 caracteres.');
 await new Promise((resolve,reject)=>{
  const img=new Image();let ended=false;
  const timer=setTimeout(()=>finish(false),8500);
  function finish(ok){
   if(ended)return;ended=true;clearTimeout(timer);
   img.onload=img.onerror=null;
   ok?resolve():reject(Error('Esse link não abriu uma imagem. Cole uma URL direta pública ou use Enviar foto.'));
  }
  img.onload=()=>finish(img.naturalWidth>0&&img.naturalHeight>0);
  img.onerror=()=>finish(false);
  img.referrerPolicy='no-referrer';
  img.src=url;
 });
 return url;
}
function decodeImage(file){
 return new Promise((resolve,reject)=>{
  const src=URL.createObjectURL(file);
  const img=new Image();let ended=false;
  const timer=setTimeout(()=>finish(Error('Imagem demorou a abrir. Escolha JPG ou PNG.')),15000);
  const finish=(error)=>{
   if(ended)return;ended=true;clearTimeout(timer);
   if(error){URL.revokeObjectURL(src);reject(error)}
   else resolve({img,cleanup:()=>URL.revokeObjectURL(src)});
  };
  img.onload=()=>finish();
  img.onerror=()=>finish(Error('O navegador não reconheceu essa imagem. Tente JPG, PNG ou WebP.'));
  img.src=src;
 });
}
async function optimizePhoto(file){
 if(!file||!file.type.startsWith('image/'))throw Error('Escolha uma foto válida.');
 if(file.size>MAX_RAW)throw Error('A foto original deve ter no máximo 16 MB.');
 const {img,cleanup}=await decodeImage(file);
 try{
  const width=img.naturalWidth,height=img.naturalHeight;
  if(!width||!height||width*height>100000000)throw Error('Foto muito grande ou inválida.');
  const ratio=Math.min(1,1400/Math.max(width,height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*ratio));
  canvas.height=Math.max(1,Math.round(height*ratio));
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Este navegador não conseguiu preparar a imagem.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  for(const quality of [0.84,0.72,0.60]){
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
   if(!blob||blob.type!=='image/jpeg')throw Error('Falha ao converter a foto para JPG.');
   if(blob.size<=MAX_UPLOAD)return blob;
  }
  throw Error('A foto continua muito grande. Escolha outra imagem.');
 }finally{cleanup()}
}
export function initProductPhotoForm({form,existingUrl='',supabase,restaurant}){
 if(!form||controllers.has(form))return controllers.get(form);
 const urlInput=form.querySelector('input[name="image_url"]');
 const oldLabel=urlInput?.closest('label');
 if(!oldLabel)return null;
 const initialUrl=String(existingUrl||'').trim();
 const wrap=document.createElement('div');wrap.className='iv-photo-picker';
 wrap.innerHTML='<div class="iv-photo-title"><span>Foto do produto</span><small>Opcional</small></div>'
  +'<div class="iv-photo-view"><div class="iv-photo-thumb" data-photo-preview><span class="iv-photo-placeholder">Sem foto</span></div>'
  +'<div class="iv-photo-content"><div class="iv-photo-actions">'
  +'<button type="button" data-photo-gallery class="iv-photo-primary">Enviar foto</button>'
  +'<button type="button" class="iv-photo-library-open" data-photo-library>Biblioteca</button>'
  +'<button type="button" data-photo-camera>Câmera</button>'
  +'<button type="button" data-photo-clear class="iv-photo-remove" hidden>Remover</button></div>'
  +'<p class="iv-photo-help">Galeria ou câmera · JPG, PNG ou WebP · até 16 MB na origem. A imagem é reduzida antes do envio.</p>'
  +'</div></div><p class="iv-photo-status" role="status" aria-live="polite" data-photo-status></p>'
  +'<input type="file" accept="'+ACCEPT+'" data-photo-file aria-label="Escolher foto da galeria">'
  +'<input type="file" accept="image/*" capture="environment" data-photo-camera-file aria-label="Tirar foto com a câmera">'
  +'<details class="iv-photo-link"><summary>Ou usar um link de imagem (HTTPS)</summary></details>';
 oldLabel.replaceWith(wrap);
 const linkDetail=wrap.querySelector('.iv-photo-link');
 linkDetail.append(oldLabel);
 oldLabel.textContent='';oldLabel.append(document.createTextNode('Link direto da foto'),urlInput);
 urlInput.placeholder='https://exemplo.com/foto.jpg';
 urlInput.setAttribute('aria-label','URL HTTPS da foto');
 const gallery=wrap.querySelector('[data-photo-file]');
 const camera=wrap.querySelector('[data-photo-camera-file]');
 const preview=wrap.querySelector('[data-photo-preview]');
 const status=wrap.querySelector('[data-photo-status]');
 const clear=wrap.querySelector('[data-photo-clear]');
 let chosen=null,blobURL=null,uploaded=null,checkId=0,checkTimer=null,removed=false;
 const setStatus=(message='',state='')=>{status.textContent=message;status.dataset.state=state};
 const release=()=>{if(blobURL){URL.revokeObjectURL(blobURL);blobURL=null}};
 const display=(url)=>{
  preview.replaceChildren();
  if(!url){const span=document.createElement('span');span.className='iv-photo-placeholder';span.textContent='Sem foto';preview.append(span);return}
  const img=document.createElement('img');img.alt='Prévia da foto do produto';img.loading='lazy';
  img.referrerPolicy='no-referrer';img.src=url;
  img.onerror=()=>{
   if(img.isConnected&&preview.contains(img)){display(null);setStatus('Não foi possível abrir esta imagem. Experimente enviar a foto.', 'error')}
  };
  preview.append(img);
 };
 const fileChanged=file=>{
  if(!file)return;
  if(!file.type.startsWith('image/')){setStatus('Selecione uma imagem válida.','error');return}
  if(file.size>MAX_RAW){gallery.value='';camera.value='';setStatus('Imagem acima de 16 MB. Escolha outra.','error');return}
  chosen=file;uploaded=null;removed=false;checkId++;
  urlInput.value='';release();
  blobURL=URL.createObjectURL(file);display(blobURL);
  clear.hidden=false;
  setStatus('Foto selecionada. Ela será otimizada e enviada ao salvar o produto.','success');
 };
 gallery.addEventListener('change',()=>fileChanged(gallery.files?.[0]));
 camera.addEventListener('change',()=>fileChanged(camera.files?.[0]));
 wrap.querySelector('[data-photo-gallery]').onclick=()=>gallery.click();
 wrap.querySelector('[data-photo-camera]').onclick=()=>camera.click();
 wrap.querySelector('[data-photo-library]').onclick=()=>{
  void openProductImageLibrary({supabase,restaurant,onSelect:url=>{
   urlInput.value=url;
   urlInput.dispatchEvent(new Event('input',{bubbles:true}));
   setStatus('Foto da biblioteca selecionada. Ao salvar, ela será reutilizada sem novo upload.','success');
  }}).catch(e=>setStatus(e.message||'Não foi possível abrir a biblioteca','error'));
 };
 clear.onclick=()=>{
  chosen=null;uploaded=null;removed=true;gallery.value='';camera.value='';urlInput.value='';checkId++;
  clearTimeout(checkTimer);release();display(null);clear.hidden=true;
  setStatus('Foto removida. Salve o produto para confirmar.');
 };
 urlInput.addEventListener('input',()=>{
  chosen=null;uploaded=null;removed=false;gallery.value='';camera.value='';
  release();const val=urlInput.value.trim();checkId++;
  const localId=checkId;clearTimeout(checkTimer);
  clear.hidden=!val;display(val||null);
  if(!val){setStatus('');return}
  setStatus('Conferindo o link da imagem...');
  checkTimer=setTimeout(()=>{
   void checkImageURL(val).then(()=>{if(localId===checkId)setStatus('Imagem do link carregada com sucesso.','success')})
    .catch(e=>{if(localId===checkId)setStatus(e.message,'error')});
  },450);
 });
 if(initialUrl&&validUrl(initialUrl)){display(initialUrl);clear.hidden=false}
 else display(null);
 if(initialUrl&&!validUrl(initialUrl))setStatus('A foto antiga tem link inválido. Atualize-a para voltar a exibir.', 'error');
 const controller={
  async resolve(){
   if(chosen){
    if(uploaded?.file===chosen)return uploaded.url;
    setStatus('Otimizando imagem...');
    const blob=await optimizePhoto(chosen);
    setStatus('Enviando foto para o Intervalo...');
    const {data:permit,error:permitError}=await supabase.functions.invoke('restaurant-product-photos',{
     body:{action:'sign',restaurant_id:restaurant.id}
    });
    if(permitError||permit?.error){
     let message=permit?.error??permitError?.message??'Não foi possível autorizar o envio';
     try{const detail=await permitError?.context?.json?.();if(detail?.error)message=detail.error}catch{}
     throw Error(message);
    }
    if(permit.bucket!==BUCKET||typeof permit.path!=='string'||!permit.path.startsWith(restaurant.id+'/')||
      !permit.path.endsWith('.jpg')||!permit.token||!validUrl(permit.public_url))
      throw Error('Autorização de foto inválida.');
    const {error:uploadError}=await supabase.storage.from(BUCKET).uploadToSignedUrl(
     permit.path,permit.token,blob,{contentType:'image/jpeg',upsert:false}
    );
    if(uploadError)throw Error('Não foi possível enviar a foto: '+uploadError.message);
    uploaded={file:chosen,url:permit.public_url};
    setStatus('Foto enviada com sucesso.','success');
    return permit.public_url;
   }
   const url=urlInput.value.trim();
   if(!url)return '';
   if(!validUrl(url))throw Error('Link inválido: utilize HTTPS e uma URL pública direta.');
   if(url===initialUrl)return url;
   setStatus('Validando link antes de salvar...');
   await checkImageURL(url);
   setStatus('Link validado.','success');
   return url;
  },
  get hasNewFile(){return !!chosen},
  get removed(){return removed}
 };
 controllers.set(form,controller);
 return controller;
}
export async function resolveProductPhoto(form){
 const c=controllers.get(form);
 if(!c)throw Error('O seletor de fotos não foi preparado. Atualize a página.');
 return c.resolve();
}
