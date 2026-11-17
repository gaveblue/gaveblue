// RC26: cache de catálogos exclusivamente públicos; nunca pedidos, sessões ou pagamentos.
const PREFIX='intervalo-public-catalog-v1:';
const MAX_AGE=15*60*1000, MAX_ENTRIES=8, MAX_CHARS=180000;
const valid=(kind,slug)=>['store','menu'].includes(kind)&&typeof slug==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug.length<=60;
const key=(kind,slug)=>PREFIX+kind+':'+slug;
const pick=(obj,fields)=>Object.fromEntries(fields.filter(k=>Object.prototype.hasOwnProperty.call(obj??{},k)).map(k=>[k,obj[k]]));
const rows=(value,fields)=>Array.isArray(value)?value.map(row=>pick(row,fields)):[];
function project(data,slug){
 if(data?.published!==true||data.restaurant?.slug!==slug||!Array.isArray(data.categories)||!Array.isArray(data.products))return null;
 return {published:true,restaurant:{...pick(data.restaurant,['name','slug','description','logo_url','banner_url','city','state'])},
  categories:rows(data.categories,['id','name','sort_order']),
  products:rows(data.products,['id','category_id','name','description','price_cents','image_url','sort_order','variant_group_name','variant_label']),
  options:rows(data.options,['id','product_id','name','price_delta_cents','sort_order']),
  hours:rows(data.hours,['weekday','opens_at','closes_at','delivery_enabled','pickup_enabled']),
  online_settings:pick(data.online_settings,['minimum_order_cents','estimated_prep_minutes','delivery_configured','pickup_configured'])};
}
export function forgetCatalog(kind,slug){try{if(valid(kind,slug))localStorage.removeItem(key(kind,slug))}catch{}}
export function readCatalog(kind,slug){
 if(!valid(kind,slug))return null;
 try{
  const raw=localStorage.getItem(key(kind,slug));if(!raw)return null;
  if(raw.length>MAX_CHARS){forgetCatalog(kind,slug);return null}
  const entry=JSON.parse(raw),age=Date.now()-entry.savedAt;
  if(!Number.isFinite(age)||age<0||age>MAX_AGE){forgetCatalog(kind,slug);return null}
  const data=project(entry.data,slug);if(!data){forgetCatalog(kind,slug);return null}
  return {savedAt:entry.savedAt,data};
 }catch{forgetCatalog(kind,slug);return null}
}
export function saveCatalog(kind,slug,data){
 if(!valid(kind,slug))return false;
 try{
  const safe=project(data,slug);if(!safe){forgetCatalog(kind,slug);return false}
  const raw=JSON.stringify({savedAt:Date.now(),data:safe});
  if(raw.length>MAX_CHARS){forgetCatalog(kind,slug);return false}
  const thisKey=key(kind,slug),entries=[];
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(PREFIX)&&k!==thisKey)entries.push(k)}
  const old=[];
  for(const k of entries){try{const v=JSON.parse(localStorage.getItem(k));if(!Number.isFinite(v?.savedAt)||Date.now()-v.savedAt>MAX_AGE||Date.now()<v.savedAt)localStorage.removeItem(k);else old.push([k,v.savedAt])}catch{localStorage.removeItem(k)}}
  old.sort((a,b)=>a[1]-b[1]);
  while(old.length>=MAX_ENTRIES)localStorage.removeItem(old.shift()[0]);
  try{localStorage.setItem(thisKey,raw)}catch{while(old.length)localStorage.removeItem(old.shift()[0]);localStorage.setItem(thisKey,raw)}
  return true;
 }catch{return false}
}
export async function publicResult(result){
 if(result.error){
  const status=Number(result.error.context?.status);
  let details;try{details=await result.error.context?.json?.()}catch{}
  const error=new Error('Não foi possível atualizar o cardápio.');
  error.unavailable=[401,403,404,410].includes(status)||details?.published===false;
  throw error;
 }
 if(result.data?.published===false){const error=new Error('Cardápio indisponível.');error.unavailable=true;throw error}
 return result.data;
}
