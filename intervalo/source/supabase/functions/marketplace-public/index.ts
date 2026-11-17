import {createClient} from "npm:@supabase/supabase-js@2.50.0";

const origin="https://gaveblue.com.br";
const headers={
 "Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-retry-count,traceparent,tracestate,baggage",
 "Access-Control-Allow-Methods":"POST,OPTIONS",
 "Content-Type":"application/json",
 "Cache-Control":"no-store",
 "Vary":"Origin"
};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const bad=(message:string,status=400)=>respond({error:message},status);
const validSlug=(s:unknown)=>typeof s==="string"&&s.length>=3&&s.length<=60&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const str=(s:unknown,n=80)=>typeof s==="string"?s.trim().slice(0,n):"";
const compare=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
const db=createClient(Deno.env.get("SUPABASE_URL")??"",Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",{auth:{persistSession:false,autoRefreshToken:false}});

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return bad("Método não permitido",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return bad("Origem não permitida",403);
 if(!Deno.env.get("SUPABASE_URL")||!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))return bad("Serviço indisponível",503);
 let body:Record<string,unknown>;
 try{
  const text=await req.text();if(text.length>4000)throw Error("too large");
  body=JSON.parse(text);
  if(!body||typeof body!=="object"||Array.isArray(body))throw Error("invalid");
 }catch{return bad("Requisição inválida",400)}
 const action=body.action;
 if(action!=="discover"&&action!=="store")return bad("Ação inválida");
 try{
  if(action==="discover"){
   const query=str(body.query,80),city=str(body.city,80);
   const {data:storefronts,error:fe}=await db.from("restaurant_storefront")
     .select("restaurant_id,display_name,description,cuisine_tags,logo_url,banner_url,marketplace_visible")
     .eq("marketplace_visible",true).limit(100);
   if(fe)return bad("Não foi possível buscar restaurantes",503);
   const ids=(storefronts??[]).map(s=>s.restaurant_id);
   if(!ids.length)return respond({restaurants:[],customer_orders_enabled:false,marketplace_stage:"preview"});
   const [rr,pub,mods,cities,online,hours,zones]=await Promise.all([
    db.from("restaurants").select("id,name,slug,status").in("id",ids).eq("status","active"),
    db.from("restaurant_publication").select("restaurant_id,is_published,accepts_customer_orders").in("restaurant_id",ids).eq("is_published",true),
    db.from("restaurant_modules").select("restaurant_id,enabled").in("restaurant_id",ids).eq("module","cardapio").eq("enabled",true),
    db.from("restaurant_settings").select("restaurant_id,city,state,timezone").in("restaurant_id",ids),
    db.from("restaurant_online_settings").select("restaurant_id,enabled,paused,delivery_enabled,pickup_enabled,estimated_prep_minutes").in("restaurant_id",ids),
    db.from("restaurant_business_hours").select("restaurant_id,weekday,opens_at,closes_at,delivery_enabled,pickup_enabled").in("restaurant_id",ids).eq("active",true),
    db.from("restaurant_delivery_zones").select("restaurant_id").in("restaurant_id",ids).eq("active",true)
   ]);
   if([rr,pub,mods,cities,online,hours,zones].some(v=>v.error))return bad("Não foi possível buscar restaurantes",503);
   const now=new Date();
   const timeCache=new Map<string,{day:number,time:number}|null>();
   const clock=(value:string)=>{const a=value.split(":").map(Number);return a[0]*3600+a[1]*60+(a[2]??0)};
   const localClock=(tz:string)=>{
    if(timeCache.has(tz))return timeCache.get(tz);
    try{
     const parts=new Intl.DateTimeFormat("en-US",{timeZone:tz,weekday:"short",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(now);
     const get=(k:string)=>parts.find(p=>p.type===k)?.value??"";
     const day=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(get("weekday"));
     const result={day,time:clock(get("hour")+":"+get("minute")+":"+get("second"))};timeCache.set(tz,result);return result;
    }catch{timeCache.set(tz,null);return null}
   };
   const rows=(storefronts??[]).flatMap(s=>{
    const restaurant=(rr.data??[]).find(x=>x.id===s.restaurant_id);
    const publication=(pub.data??[]).find(x=>x.restaurant_id===s.restaurant_id);
    const enabled=(mods.data??[]).some(x=>x.restaurant_id===s.restaurant_id);
    if(!restaurant||!publication||!enabled)return [];
    const location=(cities.data??[]).find(x=>x.restaurant_id===s.restaurant_id);
    const settings=(online.data??[]).find(x=>x.restaurant_id===s.restaurant_id);
    const orderReady=!!(publication.accepts_customer_orders&&settings?.enabled&&!settings?.paused&&(settings?.delivery_enabled||settings?.pickup_enabled));
    const local=location?.timezone?localClock(location.timezone):null;
    const isOpen=(kind:"delivery"|"pickup")=>!!local&&(hours.data??[]).some(h=>{
     if(h.restaurant_id!==s.restaurant_id||!(kind==="delivery"?h.delivery_enabled:h.pickup_enabled))return false;
     const start=clock(h.opens_at),end=clock(h.closes_at);
     return (h.weekday===local.day&&((end>start&&local.time>=start&&local.time<end)||(end<start&&local.time>=start)))||(h.weekday===(local.day+6)%7&&end<start&&local.time<end);
    });
    const deliveryReady=orderReady&&!!settings?.delivery_enabled&&(zones.data??[]).some(z=>z.restaurant_id===s.restaurant_id);
    const pickupReady=orderReady&&!!settings?.pickup_enabled;
    const item={
     slug:restaurant.slug,
     name:s.display_name||restaurant.name,
     description:s.description??"",
     cuisine_tags:s.cuisine_tags??[],
     logo_url:s.logo_url??null,
     banner_url:s.banner_url??null,
     city:location?.city??null,
     state:location?.state??null,
     customer_orders_enabled:orderReady,
     delivery_available:deliveryReady,
     pickup_available:pickupReady,
     checkout_available:(deliveryReady&&isOpen("delivery"))||(pickupReady&&isOpen("pickup")),
     estimated_prep_minutes:settings?.estimated_prep_minutes??null
    };
    const haystack=compare([item.name,item.description,...item.cuisine_tags].join(" "));
    if(query&&!haystack.includes(compare(query)))return [];
    if(city&&!compare(item.city??"").includes(compare(city)))return [];
    return [item];
   });
   return respond({restaurants:rows,customer_orders_enabled:false,marketplace_stage:"preview"});
  }

  if(!validSlug(body.slug))return bad("Restaurante inválido",400);
  const slug=body.slug as string;
  const {data:r,error:re}=await db.from("restaurants").select("id,name,slug,status").eq("slug",slug).maybeSingle();
  if(re)return bad("Falha ao consultar restaurante",503);
  if(!r||r.status!=="active")return respond({published:false},404);
  const [pub,mod,store,settings,place,hrs,zones,cs,ps,os]=await Promise.all([
   db.from("restaurant_publication").select("is_published,accepts_customer_orders").eq("restaurant_id",r.id).maybeSingle(),
   db.from("restaurant_modules").select("enabled").eq("restaurant_id",r.id).eq("module","cardapio").maybeSingle(),
   db.from("restaurant_storefront").select("display_name,description,cuisine_tags,logo_url,banner_url,marketplace_visible").eq("restaurant_id",r.id).maybeSingle(),
   db.from("restaurant_online_settings").select("enabled,paused,delivery_enabled,pickup_enabled,minimum_order_cents,estimated_prep_minutes").eq("restaurant_id",r.id).maybeSingle(),
   db.from("restaurant_settings").select("city,state").eq("restaurant_id",r.id).maybeSingle(),
   db.from("restaurant_business_hours").select("weekday,opens_at,closes_at,active,delivery_enabled,pickup_enabled").eq("restaurant_id",r.id).eq("active",true),
   db.from("restaurant_delivery_zones").select("id,name,city,state,postal_code_from,postal_code_to,neighborhoods,fee_cents,minimum_order_cents,estimated_delivery_minutes").eq("restaurant_id",r.id).eq("active",true),
   db.from("menu_categories").select("id,name,sort_order").eq("restaurant_id",r.id).eq("active",true).order("sort_order"),
   db.from("menu_products").select("id,category_id,name,description,price_cents,image_url,sort_order,variant_group_name,variant_label").eq("restaurant_id",r.id).eq("available",true).eq("show_on_menu",true).order("sort_order"),
   db.from("menu_product_options").select("id,product_id,name,price_delta_cents,sort_order").eq("restaurant_id",r.id).eq("available",true).order("sort_order")
  ]);
  if([pub,mod,store,settings,place,hrs,zones,cs,ps,os].some(x=>x.error))return bad("Não foi possível carregar a loja",503);
  if(!pub.data?.is_published||!mod.data?.enabled)return respond({published:false},404);
  const allowed=new Set((cs.data??[]).map(x=>x.id));
  const products=(ps.data??[]).filter(x=>allowed.has(x.category_id));
  const productIDs=new Set(products.map(x=>x.id));
  const onlineReady=!!(pub.data.accepts_customer_orders&&settings.data?.enabled&&!settings.data?.paused&&(settings.data.delivery_enabled||settings.data.pickup_enabled));
  const activeZones=zones.data??[];
  const [deliveryCheck,pickupCheck]=await Promise.all([
   onlineReady&&settings.data?.delivery_enabled&&activeZones.length
     ?db.rpc("marketplace_store_is_open",{p_restaurant:r.id,p_kind:"delivery"})
     :Promise.resolve({data:false,error:null}),
   onlineReady&&settings.data?.pickup_enabled
     ?db.rpc("marketplace_store_is_open",{p_restaurant:r.id,p_kind:"pickup"})
     :Promise.resolve({data:false,error:null})
  ]);
  const canDeliver=!!(onlineReady&&settings.data?.delivery_enabled&&activeZones.length&&deliveryCheck.data&&!deliveryCheck.error);
  const canPickup=!!(onlineReady&&settings.data?.pickup_enabled&&pickupCheck.data&&!pickupCheck.error);
  return respond({
   published:true,marketplace_stage:onlineReady?"active":"preview",checkout_available:canDeliver||canPickup,customer_orders_enabled:onlineReady,
   restaurant:{name:store.data?.display_name||r.name,slug:r.slug,description:store.data?.description??"",cuisine_tags:store.data?.cuisine_tags??[],logo_url:store.data?.logo_url??null,banner_url:store.data?.banner_url??null,city:place.data?.city??null,state:place.data?.state??null},
   online_settings:{delivery_available:canDeliver,pickup_available:canPickup,
     delivery_configured:!!settings.data?.delivery_enabled,pickup_configured:!!settings.data?.pickup_enabled,
     minimum_order_cents:settings.data?.minimum_order_cents??0,estimated_prep_minutes:settings.data?.estimated_prep_minutes??30},
   hours:hrs.data??[],delivery_zones:zones.data??[],
   categories:cs.data??[],products,options:(os.data??[]).filter(x=>productIDs.has(x.product_id))
  });
 }catch{return bad("Não foi possível carregar o marketplace",503)}
});
