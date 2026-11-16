import { createClient } from "npm:@supabase/supabase-js@2.50.0";

// InfinitePay rc8 — configuração isolada por restaurante; não gera links/cobranças.
const origin="https://gaveblue.com.br";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
 "Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const respond=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
const fail=(message:string,status=400)=>respond({error:message},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const handlePattern=/^[A-Za-z0-9][A-Za-z0-9_.-]{1,63}$/;
const apiURL=Deno.env.get("SUPABASE_URL")||"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=apiURL&&serviceKey?createClient(apiURL,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}}):null;

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return fail("Método não permitido",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return fail("Origem não permitida",403);
 if(!db)return fail("Serviço indisponível",503);
 const authorization=req.headers.get("Authorization")??"";
 const token=authorization.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return fail("Entre na sua conta",401);
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user||user.is_anonymous||!user.email_confirmed_at)return fail("Sessão inválida",401);
 if(user.app_metadata?.intervalo_password_change_required)return fail("Troque a senha provisória primeiro",403);
 let body:Record<string,unknown>;
 try{
  const payload=await req.text();if(payload.length>2500)throw Error("large");
  body=JSON.parse(payload);
  if(!body||typeof body!=="object"||Array.isArray(body))throw Error("invalid");
 }catch{return fail("Dados inválidos",400)}
 const restaurant_id=body.restaurant_id;
 if(typeof restaurant_id!=="string"||!uuid.test(restaurant_id))return fail("Restaurante inválido",400);
 const [restaurant,member,module,override]=await Promise.all([
  db.from("restaurants").select("id,slug,status").eq("id",restaurant_id).maybeSingle(),
  db.from("restaurant_members").select("role,status").eq("restaurant_id",restaurant_id).eq("user_id",user.id).maybeSingle(),
  db.from("restaurant_modules").select("enabled").eq("restaurant_id",restaurant_id).eq("module","gestao").maybeSingle(),
  db.from("restaurant_member_module_access").select("allowed").eq("restaurant_id",restaurant_id).eq("user_id",user.id).eq("module","gestao").maybeSingle()
 ]);
 if([restaurant,member,module,override].some(x=>x.error))return fail("Não foi possível conferir as permissões",503);
 const role=member.data?.role;
 if(restaurant.data?.status!=="active"||member.data?.status!=="active"||
  !["master","manager"].includes(role)||!module.data?.enabled||
  (role==="manager"&&override.data?.allowed===false))return fail("Acesso não autorizado",403);
 const action=body.action;
 if(!["get","save_handle","disconnect"].includes(String(action)))return fail("Ação inválida",400);
 if(action!=="get"&&role!=="master")return fail("Somente o Master pode configurar pagamentos",403);
 const {data:settings,error:settingsError}=await db.from("restaurant_payment_gateways")
  .select("handle,enabled,secret_env_name,updated_at")
  .eq("restaurant_id",restaurant_id).eq("provider","infinitepay").maybeSingle();
 if(settingsError)return fail("Não foi possível carregar a integração",503);
 if(action==="get"){
  const env=settings?.secret_env_name??"";
  const secret=env?Deno.env.get(env)??"":"";
  const key_configured=/^inchk_[A-Za-z0-9_-]{8,}$/.test(secret);
  return respond({provider:"infinitepay",restaurant_slug:restaurant.data?.slug,
   handle:settings?.handle??"",key_configured,
   enabled:settings?.enabled===true,
   ready_to_configure:!!settings?.secret_env_name,
   payments_available:false, // Gate conservador: a rc8 não permite compras externas.
   updated_at:settings?.updated_at??null,
   secret_setup_hint:settings?.secret_env_name?settings.secret_env_name:null,
   can_edit:role==="master"});
 }
 if(!settings?.secret_env_name)return fail("Vinculação segura do provedor ainda não preparada para este restaurante",409);
 if(action==="disconnect"){
  const {error:e}=await db.from("restaurant_payment_gateways")
    .update({handle:null,enabled:false,configured_by:user.id,updated_at:new Date().toISOString()})
    .eq("restaurant_id",restaurant_id).eq("provider","infinitepay");
  if(e)return fail("Não foi possível desconectar",503);
  return respond({saved:true,handle:"",enabled:false,payments_available:false});
 }
 const handle=typeof body.handle==="string"?body.handle.trim().replace(/^\$/,""):"";
 if(!handlePattern.test(handle))return fail("Informe sua InfiniteTag sem $, entre 2 e 64 caracteres.",422);
 const {error:writeError}=await db.from("restaurant_payment_gateways")
  .update({handle,enabled:false,configured_by:user.id,updated_at:new Date().toISOString()})
  .eq("restaurant_id",restaurant_id).eq("provider","infinitepay");
 if(writeError)return fail("Não foi possível salvar a InfiniteTag",503);
 return respond({saved:true,handle,enabled:false,payments_available:false});
});
