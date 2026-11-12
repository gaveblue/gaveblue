import {createClient} from "npm:@supabase/supabase-js@2.50.0";
const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const headers={"Access-Control-Allow-Origin":"https://gaveblue.com.br","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const out=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{status,headers});
const err=(msg:string,status=400)=>out({error:msg},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const modules=["gestao","garcom","cozinha","caixa","cardapio"];
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return err("Método inválido",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!=="https://gaveblue.com.br")return err("Origem inválida",403);
 if(!url||!key)return err("Servidor indisponível",503);
 const token=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return err("Faça login",401);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:ue}=await db.auth.getUser(token);
 if(ue||!user||!user.email_confirmed_at)return err("Sessão inválida",401);
 const {data:admin,error:ae}=await db.from("platform_admins").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
 if(ae)return err("Falha ao verificar autorização",503);
 if(!admin)return err("Acesso exclusivo da Gaveblue",403);
 let body:Record<string,unknown>;
 try{body=await req.json();if(!body||Array.isArray(body)||typeof body!=="object")throw Error("bad")}
 catch{return err("Dados inválidos",400)}
 const action=body.action;
 if(action==="list"){
  const [restaurants,flags,subs]=await Promise.all([
   db.from("restaurants").select("id,name,slug,status,created_at").order("created_at",{ascending:false}),
   db.from("restaurant_modules").select("restaurant_id,module,enabled"),
   db.from("restaurant_subscriptions").select("restaurant_id,plan_id,status,starts_at,ends_at")
  ]);
  if(restaurants.error||flags.error||subs.error)return err("Não foi possível carregar plataforma",503);
  return out({restaurants:restaurants.data,modules:flags.data,subscriptions:subs.data,has_billing_provider:false});
 }
 const restaurant_id=body.restaurant_id;
 if(typeof restaurant_id!=="string"||!uuid.test(restaurant_id))return err("Restaurante inválido",400);
 const {data:r,error:re}=await db.from("restaurants").select("id,status").eq("id",restaurant_id).maybeSingle();
 if(re||!r)return err("Restaurante não encontrado",404);
 if(action==="module_set"){
  const module=body.module;
  if(typeof module!=="string"||!modules.includes(module)||typeof body.enabled!=="boolean")return err("Módulo inválido",400);
  const {error:e}=await db.from("restaurant_modules").upsert({restaurant_id,module,enabled:body.enabled,updated_at:new Date().toISOString()},{onConflict:"restaurant_id,module"});
  if(e)return err("Falha ao alterar módulo",503);
  if(module==="cardapio"&&!body.enabled)await db.from("restaurant_publication").update({is_published:false,updated_at:new Date().toISOString()}).eq("restaurant_id",restaurant_id);
  await db.from("audit_logs").insert({restaurant_id,actor_user_id:user.id,event:"platform_module_changed",details:{module,enabled:body.enabled}});
  return out({updated:true});
 }
 if(action==="restaurant_status"){
  if(body.status!=="active"&&body.status!=="suspended")return err("Status inválido",400);
  const {error:e}=await db.from("restaurants").update({status:body.status,updated_at:new Date().toISOString()}).eq("id",restaurant_id);
  if(e)return err("Não foi possível alterar status",503);
  await db.from("audit_logs").insert({restaurant_id,actor_user_id:user.id,event:"platform_restaurant_status",details:{from:r.status,to:body.status}});
  return out({updated:true});
 }
 return err("Ação inválida",400);
});