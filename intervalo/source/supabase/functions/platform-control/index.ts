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
  const [restaurants,flags,subs,members]=await Promise.all([
   db.from("restaurants").select("id,name,slug,status,created_at").order("created_at",{ascending:false}),
   db.from("restaurant_modules").select("restaurant_id,module,enabled"),
   db.from("restaurant_subscriptions").select("restaurant_id,plan_id,status,starts_at,ends_at"),
   db.from("restaurant_members").select("restaurant_id,user_id,role,status,invite_expires_at,created_at").order("created_at",{ascending:true})
  ]);
  if(restaurants.error||flags.error||subs.error||members.error)return err("Não foi possível carregar plataforma",503);
  const userIds=new Set((members.data??[]).map(m=>m.user_id));
  const accounts=[];
  for(let page=1;page<=12;page++){
    const {data,error:e}=await db.auth.admin.listUsers({page,perPage:200});
    if(e)return err("Não foi possível carregar contas",503);
    for(const a of data.users)if(userIds.has(a.id))accounts.push({id:a.id,email:a.email??null,confirmed:!!a.email_confirmed_at,has_signed_in:!!a.last_sign_in_at});
    if(data.users.length<200)break;
  }
  return out({restaurants:restaurants.data,modules:flags.data,subscriptions:subs.data,members:members.data,accounts,has_billing_provider:false});
 }
 const restaurant_id=body.restaurant_id;
 if(typeof restaurant_id!=="string"||!uuid.test(restaurant_id))return err("Restaurante inválido",400);
 const {data:r,error:re}=await db.from("restaurants").select("id,slug,status").eq("id",restaurant_id).maybeSingle();
 if(re||!r)return err("Restaurante não encontrado",404);

 const verifyAdminPassword=async(raw:unknown)=>{
  if(typeof raw!=="string"||raw.length<1||raw.length>256||!user.email)return false;
  const publicKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
  if(!publicKey)return false;
  const client=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.signInWithPassword({email:user.email,password:raw});
  return !error&&data.user?.id===user.id;
 };
 if(action==="password_reset"){
  const target=body.user_id;
  if(typeof target!=="string"||!uuid.test(target))return err("Usuário inválido");
  const {data:member,error:me}=await db.from("restaurant_members").select("role,status").eq("restaurant_id",restaurant_id).eq("user_id",target).maybeSingle();
  if(me||!member||member.status==="revoked")return err("Usuário não pertence à equipe ativa ou convidada",404);
  const {data:isAdmin}=await db.from("platform_admins").select("user_id").eq("user_id",target).eq("active",true).maybeSingle();
  if(isAdmin||target===user.id)return err("Use a troca de senha pessoal para contas administrativas",403);
  const confirmed=await verifyAdminPassword(body.admin_password);
  if(!confirmed)return err("Confirme corretamente sua senha do Super Admin",403);
  const {data:targetUser,error:userError}=await db.auth.admin.getUserById(target);
  if(userError||!targetUser.user?.email||!targetUser.user?.email_confirmed_at)return err("Esta conta precisa confirmar o e-mail antes de receber senha provisória",409);
  const random=new Uint8Array(30);crypto.getRandomValues(random);
  const temporary=Array.from(random,b=>b.toString(16).padStart(2,"0")).join("");
  const now=new Date().toISOString();
  const app_metadata={...(targetUser.user.app_metadata??{}),intervalo_password_change_required:true,intervalo_password_reset_at:now};
  const {error:updateError}=await db.auth.admin.updateUserById(target,{password:temporary,app_metadata});
  if(updateError)return err("Falha na atualização da senha",503);
  await db.from("audit_logs").insert({restaurant_id,actor_user_id:user.id,event:"platform_temporary_password_issued",details:{target_user_id:target,at:now}});
  return out({updated:true,temporary_password:temporary,must_change:true},200);
 }
 if(action==="renew_master_invite"){
  const target=body.user_id;
  if(typeof target!=="string"||!uuid.test(target))return err("Usuário inválido");
  if(!await verifyAdminPassword(body.admin_password))return err("Confirme sua senha do Super Admin",403);
  const {data:member,error:me}=await db.from("restaurant_members").select("role,status").eq("restaurant_id",restaurant_id).eq("user_id",target).maybeSingle();
  if(me||member?.role!=="master"||member.status!=="pending")return err("Master não está pendente",409);
  const expires=new Date(Date.now()+7*86400000).toISOString();
  const {error:e}=await db.from("restaurant_members").update({invite_expires_at:expires}).eq("restaurant_id",restaurant_id).eq("user_id",target).eq("status","pending").eq("role","master");
  if(e)return err("Não foi possível renovar convite",503);
  await db.from("audit_logs").insert({restaurant_id,actor_user_id:user.id,event:"platform_master_invite_renewed",details:{target_user_id:target}});
  return out({renewed:true,expires_at:expires});
 }
 if(action==="join_as_master"){
  if(!await verifyAdminPassword(body.admin_password))return err("Confirme sua senha do Super Admin",403);
  if(r.status!=="active")return err("Reative o restaurante antes de acessá-lo",409);
  const {data:existing,error:existingError}=await db.from("restaurant_members").select("role,status").eq("restaurant_id",restaurant_id).eq("user_id",user.id).maybeSingle();
  if(existingError)return err("Falha ao verificar vínculo",503);
  const entry={restaurant_id,user_id:user.id,invited_email:user.email?.toLowerCase(),role:"master",status:"active",activated_at:new Date().toISOString(),invite_expires_at:null};
  const {error:writeError}=existing
   ?await db.from("restaurant_members").update(entry).eq("restaurant_id",restaurant_id).eq("user_id",user.id)
   :await db.from("restaurant_members").insert(entry);
  if(writeError)return err("Não foi possível vincular sua conta ao restaurante",503);
  await db.from("audit_logs").insert({restaurant_id,actor_user_id:user.id,event:"platform_admin_joined_as_master",details:{actor_user_id:user.id,former_role:existing?.role??null}});
  return out({joined:true,slug:r.slug??null});
 }
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