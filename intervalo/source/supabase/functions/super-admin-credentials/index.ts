import { createClient } from "npm:@supabase/supabase-js@2.50.0";
const url=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const publicKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
const allowedOrigin="https://gaveblue.com.br";
const headers={
  "Access-Control-Allow-Origin":allowedOrigin,
  "Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Content-Type":"application/json",
  "Cache-Control":"no-store",
  "Vary":"Origin"
};
const respond=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
const fail=(message,status=400)=>respond({error:message},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailValid=email=>email.length>=5&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const roles=new Set(["master","manager","waiter","kitchen","cashier"]);
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
  if(req.method!=="POST")return fail("Método não permitido",405);
  const origin=req.headers.get("Origin");
  if(origin&&origin!==allowedOrigin)return fail("Origem não autorizada",403);
  if(!url||!serviceKey||!publicKey)return fail("Serviço de autenticação indisponível",503);
  const accessToken=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!accessToken)return fail("Faça login como Super Admin",401);
  const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:userError}=await db.auth.getUser(accessToken);
  if(userError||!user?.email||!user.email_confirmed_at)return fail("Sessão inválida",401);
  if(user.app_metadata?.intervalo_password_change_required)return fail("Troque sua senha provisória primeiro",403);
  const {data:admin,error:adminError}=await db.from("platform_admins").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
  if(adminError)return fail("Não foi possível confirmar seu acesso",503);
  if(!admin)return fail("Somente o Super Admin pode definir senhas",403);
  let body;
  try{
    const raw=await req.text();
    if(raw.length>3000)throw Error("oversize");
    body=JSON.parse(raw);
    if(!body||Array.isArray(body)||typeof body!=="object")throw Error("invalid");
  }catch{return fail("Dados inválidos",400)}
  if(body.action!=="create_user"&&body.action!=="reset_password")return fail("Ação inválida",400);
  if(typeof body.restaurant_id!=="string"||!uuid.test(body.restaurant_id))return fail("Restaurante inválido",400);
  if(typeof body.temporary_password!=="string"||body.temporary_password.length<12||body.temporary_password.length>128||
      body.temporary_password.trim()!==body.temporary_password)
    return fail("A senha precisa ter entre 12 e 128 caracteres e não pode ter espaços nas extremidades",400);
  const {data:restaurant,error:restaurantError}=await db.from("restaurants").select("id,status").eq("id",body.restaurant_id).maybeSingle();
  if(restaurantError||!restaurant)return fail("Restaurante não encontrado",404);
  if(restaurant.status!=="active")return fail("Reative o restaurante antes de cadastrar acessos",409);
  if(typeof body.admin_password!=="string"||body.admin_password.length<1||body.admin_password.length>256)return fail("Confirme sua senha de Super Admin",403);
  const publicAuth=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:verified,error:verifyError}=await publicAuth.auth.signInWithPassword({email:user.email,password:body.admin_password});
  if(verifyError||verified.user?.id!==user.id)return fail("Senha de Super Admin incorreta",403);
  const now=new Date().toISOString();

  if(body.action==="reset_password"){
    const targetId=body.user_id;
    if(typeof targetId!=="string"||!uuid.test(targetId))return fail("Selecione um usuário válido",400);
    if(targetId===user.id)return fail("Contas administrativas devem usar a troca pessoal de senha",403);
    const {data:membership,error:membershipError}=await db.from("restaurant_members")
      .select("status").eq("restaurant_id",body.restaurant_id).eq("user_id",targetId).maybeSingle();
    if(membershipError||!membership||membership.status==="revoked")return fail("Usuário não pertence a este restaurante",404);
    const {data:isAdmin,error:adminCheckError}=await db.from("platform_admins").select("user_id")
      .eq("user_id",targetId).eq("active",true).maybeSingle();
    if(adminCheckError)return fail("Erro ao verificar permissões",503);
    if(isAdmin)return fail("Não é permitido redefinir senhas de Super Admin",403);
    const {data:target,error:targetError}=await db.auth.admin.getUserById(targetId);
    if(targetError||!target.user?.email)return fail("Conta não encontrada",404);
    const metadata={
      ...(target.user.app_metadata??{}),
      intervalo_password_change_required:true,
      intervalo_password_reset_at:now,
      intervalo_manual_provisioning:true
    };
    // Confirmação administrativa viabiliza o login, mas não prova titularidade do e-mail.
    const updates={
      password:body.temporary_password,
      app_metadata:metadata,
      ...(!target.user.email_confirmed_at?{email_confirm:true}:{})
    };
    const {error:changeError}=await db.auth.admin.updateUserById(targetId,updates);
    if(changeError)return fail("Não foi possível definir a senha provisória",503);
    // A autorização explícita do Super Admin também ativa o vínculo pendente neste restaurante.
    if(membership.status!=="active"){
      const {error:activateError}=await db.from("restaurant_members").update({
        status:"active",activated_at:now,invite_expires_at:null
      }).eq("restaurant_id",body.restaurant_id).eq("user_id",targetId);
      if(activateError)return fail("Senha atualizada, mas não foi possível ativar o vínculo. Verifique a equipe antes de repetir.",503);
    }
    const {error:auditError}=await db.from("audit_logs").insert({
      restaurant_id:body.restaurant_id,actor_user_id:user.id,
      event:"platform_manual_temporary_password",
      details:{target_user_id:targetId,operation:"reset",administrative_email_confirmation:!target.user.email_confirmed_at,activated_membership:membership.status!=="active"}
    });
    if(auditError)console.error("manual_password_audit_failed",{code:auditError.code});
    return respond({updated:true,must_change:true});
  }

  const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
  const role=body.role;
  if(!emailValid(email)||typeof role!=="string"||!roles.has(role))return fail("Informe um e-mail e uma função válidos",400);
  // Não redefinir automaticamente uma conta Auth global já existente.
  for(let page=1;page<=25;page++){
    const {data,error}=await db.auth.admin.listUsers({page,perPage:200});
    if(error)return fail("Não foi possível verificar usuários existentes",503);
    if(data.users.some(u=>u.email?.trim().toLowerCase()===email))
      return fail("Essa conta já existe no Intervalo. Vincule-a ao restaurante pela gestão da equipe; se já estiver vinculada, use Definir senha provisória.",409);
    if(data.users.length<200)break;
    if(page===25)return fail("Limite de consulta de contas; contate o administrador",503);
  }
  const {data:created,error:createError}=await db.auth.admin.createUser({
    email,password:body.temporary_password,email_confirm:true,
    app_metadata:{
      intervalo_password_change_required:true,
      intervalo_password_reset_at:now,
      intervalo_manual_provisioning:true
    }
  });
  if(createError||!created.user?.id){
    console.error("manual_user_create_failed",{code:createError?.code??"unknown"});
    return fail("Não foi possível criar o usuário; confira se o e-mail já está cadastrado",503);
  }
  const {error:membershipError}=await db.from("restaurant_members").insert({
    restaurant_id:body.restaurant_id,user_id:created.user.id,
    invited_email:email,role,status:"active",activated_at:now,invite_expires_at:null
  });
  if(membershipError){
    const {error:rollbackError}=await db.auth.admin.deleteUser(created.user.id);
    console.error("manual_user_membership_failed",{code:membershipError.code,rollback_error:rollbackError?.code??null});
    return fail(rollbackError?
      "Conta criada, mas o vínculo falhou; procure esse e-mail no Supabase antes de repetir":
      "Não foi possível vincular o usuário. O cadastro foi revertido.",503);
  }
  if(role==="master"){
    const {data:setup}=await db.from("restaurant_master_setup")
      .select("master_email").eq("restaurant_id",body.restaurant_id).maybeSingle();
    if(setup?.master_email?.trim().toLowerCase()===email){
      const {error:setupError}=await db.from("restaurant_master_setup").update({
        status:"linked",linked_user_id:created.user.id,updated_at:now
      }).eq("restaurant_id",body.restaurant_id);
      if(setupError)console.error("manual_master_setup_update_failed",{code:setupError.code});
    }
  }
  const {error:auditError}=await db.from("audit_logs").insert({
    restaurant_id:body.restaurant_id,actor_user_id:user.id,
    event:"platform_manual_user_created",
    details:{target_user_id:created.user.id,role,administrative_email_confirmation:true}
  });
  if(auditError)console.error("manual_user_audit_failed",{code:auditError.code});
  return respond({created:true,must_change:true},201);
});