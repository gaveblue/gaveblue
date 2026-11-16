import {createClient} from "npm:@supabase/supabase-js@2.50.0";
const origin="https://gaveblue.com.br";
const headers={
 "Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-retry-count,traceparent,tracestate,baggage",
 "Access-Control-Allow-Methods":"POST,OPTIONS",
 "Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"
};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const error=(message:string,status=400)=>reply({error:message},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text=(s:unknown,max=120)=>typeof s==="string"?s.trim().slice(0,max+1):"";
const integer=(x:unknown,min:number,max:number)=>typeof x==="number"&&Number.isSafeInteger(x)&&x>=min&&x<=max?x:null;
const envURL=Deno.env.get("SUPABASE_URL")??"",envKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return error("Método não permitido",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return error("Origem não permitida",403);
 if(!envURL||!envKey)return error("Serviço indisponível",503);
 const token=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return error("Faça login",401);
 const db=createClient(envURL,envKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:ue}=await db.auth.getUser(token);
 if(ue||!user||user.is_anonymous||!user.email_confirmed_at)return error("Sessão inválida",401);
 if(user.app_metadata?.intervalo_password_change_required)return error("Troque a senha provisória primeiro",403);
 let body:Record<string,unknown>;
 try{
  const s=await req.text();if(s.length>14000)throw Error("too large");
  body=JSON.parse(s);
  if(!body||typeof body!=="object"||Array.isArray(body))throw Error("bad");
 }catch{return error("Dados inválidos",400)}
 const restaurant_id=body.restaurant_id;
 if(typeof restaurant_id!=="string"||!uuid.test(restaurant_id))return error("Restaurante inválido",400);
 const [{data:r,error:re},{data:member,error:me},{data:module,error:mo},{data:override,error:oe}]=await Promise.all([
  db.from("restaurants").select("id,name,slug,status").eq("id",restaurant_id).maybeSingle(),
  db.from("restaurant_members").select("role,status").eq("restaurant_id",restaurant_id).eq("user_id",user.id).maybeSingle(),
  db.from("restaurant_modules").select("enabled").eq("restaurant_id",restaurant_id).eq("module","gestao").maybeSingle(),
  db.from("restaurant_member_module_access").select("allowed").eq("restaurant_id",restaurant_id).eq("user_id",user.id).eq("module","gestao").maybeSingle()
 ]);
 if(re||me||mo||oe)return error("Falha ao validar acesso",503);
 if(!r||r.status!=="active"||!member||member.status!=="active"||!module?.enabled||
    !["master","manager"].includes(member.role)||
    (member.role==="manager"&&override?.allowed===false))return error("Acesso não autorizado",403);
 const action=text(body.action,30);
 if(action==="get"){
  const [store,online,pub,modules,hours,zones,place]=await Promise.all([
   db.from("restaurant_storefront").select("display_name,description,cuisine_tags,logo_url,banner_url,marketplace_visible").eq("restaurant_id",restaurant_id).maybeSingle(),
   db.from("restaurant_online_settings").select("enabled,delivery_enabled,pickup_enabled,paused,minimum_order_cents,estimated_prep_minutes,acceptance_timeout_minutes,notes").eq("restaurant_id",restaurant_id).maybeSingle(),
   db.from("restaurant_publication").select("is_published,accepts_customer_orders").eq("restaurant_id",restaurant_id).maybeSingle(),
   db.from("restaurant_modules").select("enabled").eq("restaurant_id",restaurant_id).eq("module","cardapio").maybeSingle(),
   db.from("restaurant_business_hours").select("weekday,opens_at,closes_at,active").eq("restaurant_id",restaurant_id).order("weekday"),
   db.from("restaurant_delivery_zones").select("id,name,city,state,fee_cents,minimum_order_cents,estimated_delivery_minutes,active").eq("restaurant_id",restaurant_id).order("name"),
   db.from("restaurant_settings").select("city,state").eq("restaurant_id",restaurant_id).maybeSingle()
  ]);
  if([store,online,pub,modules,hours,zones,place].some(x=>x.error))return error("Falha ao consultar configurações",503);
  return reply({restaurant:{id:r.id,name:r.name,slug:r.slug,city:place.data?.city??null,state:place.data?.state??null},
   storefront:store.data??null,online_settings:online.data??null,
   publication:{is_published:pub.data?.is_published===true,cardapio_enabled:modules.data?.enabled===true,accepts_customer_orders:false},
   business_hours:hours.data??[],delivery_zones:zones.data??[],
   checkout_available:false,marketplace_stage:"preview"});
 }
 if(action==="save_draft"){
  const name=text(body.display_name,120),description=text(body.description,1000);
  if(name.length<2||name.length>120||description.length>1000)return error("Nome ou descrição inválidos");
  if(!Array.isArray(body.cuisine_tags)||body.cuisine_tags.length>12)return error("Categorias culinárias inválidas");
  const cuisine_tags=body.cuisine_tags.map(x=>text(x,40)).filter(x=>x.length>0&&x.length<=40);
  if(cuisine_tags.length!==body.cuisine_tags.length)return error("Categoria culinária inválida");
  const delivery_enabled=body.delivery_enabled,pickup_enabled=body.pickup_enabled;
  if(typeof delivery_enabled!=="boolean"||typeof pickup_enabled!=="boolean"||(!delivery_enabled&&!pickup_enabled))return error("Selecione entrega ou retirada");
  const minimum_order_cents=integer(body.minimum_order_cents,0,100000000);
  const estimated_prep_minutes=integer(body.estimated_prep_minutes,5,240);
  const notes=text(body.notes,500);
  if(minimum_order_cents===null||estimated_prep_minutes===null||notes.length>500)return error("Valores ou instruções inválidos");
  const [storeSave,onlineSave]=await Promise.all([
   db.from("restaurant_storefront").upsert({restaurant_id,display_name:name,description,cuisine_tags,updated_at:new Date().toISOString()},{onConflict:"restaurant_id"}),
   db.from("restaurant_online_settings").upsert({restaurant_id,enabled:false,delivery_enabled,pickup_enabled,minimum_order_cents,estimated_prep_minutes,notes,updated_at:new Date().toISOString()},{onConflict:"restaurant_id"})
  ]);
  if(storeSave.error||onlineSave.error)return error("Não foi possível salvar a loja",503);
  return reply({saved:true,checkout_available:false,customer_orders_enabled:false});
 }
 if(action==="set_visible"){
  if(typeof body.marketplace_visible!=="boolean")return error("Visibilidade inválida");
  if(body.marketplace_visible){
   const [pub,mod]=await Promise.all([
    db.from("restaurant_publication").select("is_published").eq("restaurant_id",restaurant_id).maybeSingle(),
    db.from("restaurant_modules").select("enabled").eq("restaurant_id",restaurant_id).eq("module","cardapio").maybeSingle()
   ]);
   if(pub.error||mod.error)return error("Falha ao conferir cardápio",503);
   if(!pub.data?.is_published||!mod.data?.enabled)return error("Publique o cardápio antes de exibir esta loja no marketplace");
  }
  const result=await db.from("restaurant_storefront").upsert({restaurant_id,marketplace_visible:body.marketplace_visible,updated_at:new Date().toISOString()},{onConflict:"restaurant_id"});
  if(result.error)return error("Não foi possível atualizar a vitrine",503);
  return reply({marketplace_visible:body.marketplace_visible,checkout_available:false,customer_orders_enabled:false});
 }
 return error("Operação inválida",400);
});
