import { createClient } from "npm:@supabase/supabase-js@2.50.0";
const url=Deno.env.get("SUPABASE_URL")??"";
const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const origin="https://gaveblue.com.br";
const cors={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const json=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers:cors});
const fail=(message:string,status=400)=>json({error:message},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailRx=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roles=["master","manager","waiter","kitchen","cashier"] as const;
const staff=["waiter","kitchen","cashier"];
const modules=["gestao","garcom","cozinha","caixa","cardapio"];
const clean=(x:unknown,max=140)=>typeof x==="string"?x.trim().slice(0,max):"";
const safeFields=["phone","street","address_number","neighborhood","city","state","postal_code","timezone"] as const;
const timezones=["America/Sao_Paulo","America/Manaus","America/Cuiaba","America/Rio_Branco","America/Belem","America/Fortaleza","America/Recife","America/Noronha"];
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return fail("Método não permitido",405);
 if(req.headers.get("Origin") && req.headers.get("Origin")!==origin)return fail("Origem não autorizada",403);
 if(!url||!secret)return fail("Serviço não configurado",503);
 const token=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return fail("Faça login para continuar",401);
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user||user.is_anonymous||!user.email||!user.email_confirmed_at)return fail("Conta não autenticada ou não confirmada",401);
 if(user.app_metadata?.intervalo_password_change_required)return fail("Troque sua senha provisória primeiro",403);
 let body:Record<string,unknown>;
 try{body=await req.json();if(!body||Array.isArray(body)||typeof body!=="object")throw Error("invalid");}
 catch{return fail("Dados inválidos",400)}
 const id=clean(body.restaurant_id,80);
 const action=clean(body.action,40);
 if(!uuid.test(id))return fail("Restaurante inválido",400);
 const {data:restaurant,error:restaurantErr}=await db.from("restaurants").select("id,slug,name,status").eq("id",id).maybeSingle();
 if(restaurantErr)return fail("Não foi possível validar restaurante",503);
 if(!restaurant||restaurant.status!=="active")return fail("Restaurante indisponível",404);
 const {data:mine,error:memberErr}=await db.from("restaurant_members").select("role,status,invited_email,invite_expires_at").eq("restaurant_id",id).eq("user_id",user.id).maybeSingle();
 if(memberErr)return fail("Falha ao validar vínculo",503);
 if(action==="accept"){
   if(!mine||mine.status!=="pending")return fail("Convite não encontrado",404);
   if(mine.role==="master")return fail("Ative o Master pelo fluxo de primeiro acesso",409);
   if(!mine.invite_expires_at||new Date(mine.invite_expires_at).getTime()<=Date.now())return fail("Convite expirado",410);
   if((mine.invited_email??"").toLowerCase()!==user.email.trim().toLowerCase())return fail("Convite de outro endereço",403);
   const {error:updateErr}=await db.from("restaurant_members").update({status:"active",activated_at:new Date().toISOString()}).eq("restaurant_id",id).eq("user_id",user.id).eq("status","pending").gt("invite_expires_at",new Date().toISOString());
   if(updateErr)return fail("Não foi possível aceitar convite",503);
   const {data:check}=await db.from("restaurant_members").select("status").eq("restaurant_id",id).eq("user_id",user.id).single();
   return check?.status==="active"?json({accepted:true,restaurant_slug:restaurant.slug}):fail("Convite expirado ou não atualizado",409);
 }
 const owner=mine?.status==="active"&&mine.role==="master";
 const manager=mine?.status==="active"&&mine.role==="manager";
 if(!owner&&!manager)return fail("Sem permissão para administrar equipe",403);
 const {data:managementEnabled,error:moduleErr}=await db.from("restaurant_modules").select("enabled").eq("restaurant_id",id).eq("module","gestao").maybeSingle();
 if(moduleErr)return fail("Falha ao conferir módulo contratado",503);
 if(!managementEnabled?.enabled)return fail("Módulo de gestão não habilitado",403);
 if(manager){
   const {data:restriction,error:restrictionError}=await db.from("restaurant_member_module_access").select("allowed").eq("restaurant_id",id).eq("user_id",user.id).eq("module","gestao").maybeSingle();
   if(restrictionError)return fail("Não foi possível validar sua permissão",503);
   if(restriction?.allowed===false)return fail("Sua permissão de gestão foi desativada",403);
 }
 if(action==="list"){
   const [members,overrides,settings,enabled]=await Promise.all([
     db.from("restaurant_members").select("restaurant_id,user_id,display_name,invited_email,role,status,invite_expires_at,created_at").eq("restaurant_id",id).order("created_at",{ascending:true}),
     db.from("restaurant_member_module_access").select("user_id,module,allowed").eq("restaurant_id",id),
     db.from("restaurant_settings").select("*").eq("restaurant_id",id).maybeSingle(),
     db.from("restaurant_modules").select("module,enabled").eq("restaurant_id",id)
   ]);
   if(members.error||overrides.error||settings.error||enabled.error)return fail("Falha ao carregar informações",503);
   return json({restaurant,members:members.data??[],overrides:overrides.data??[],settings:settings.data??null,enabled:enabled.data??[],actor_role:mine.role});
 }
 if(action==="invite"){
   const email=clean(body.email,254).toLowerCase(),role=clean(body.role,20),display_name=clean(body.display_name,100);
   if(!emailRx.test(email)||email.length>254||!roles.includes(role as typeof roles[number])||role==="master"||(manager&&!staff.includes(role))||(display_name&&display_name.length<2))return fail("E-mail, nome ou função inválidos");
   const {data:members,error:merr}=await db.from("restaurant_members").select("user_id,invited_email,status").eq("restaurant_id",id);
   if(merr)return fail("Falha ao conferir equipe",503);
   if((members??[]).some(m=>m.invited_email===email&&m.status!=="revoked"))return fail("Já existe convite ou vínculo para este e-mail",409);
   let target:string|undefined;
   let page=1;
   while(page<=10&&!target){
     const {data,error}=await db.auth.admin.listUsers({page,perPage:200});
     if(error)return fail("Não foi possível localizar usuário",503);
     target=data.users.find(u=>u.email?.toLowerCase()===email)?.id;
     if(data.users.length<200)break;
     page++;
   }
   if(!target&&page>10)return fail("Limite de busca atingido; tente novamente",503);
   let emailed=false;
   if(!target){
     const {data,error}=await db.auth.admin.inviteUserByEmail(email,{redirectTo:origin+"/intervalo/ativar"});
     if(error||!data.user)return fail("Não foi possível enviar convite; verifique as restrições de e-mail do Supabase",503);
     target=data.user.id;emailed=true;
   }
   const current=(members??[]).find(m=>m.user_id===target);
   if(current&&current.status!=="revoked")return fail("Usuário já pertence ao restaurante",409);
   const row={restaurant_id:id,user_id:target,invited_email:email,display_name:display_name||null,role,status:"pending",activated_at:null,invite_expires_at:new Date(Date.now()+7*86400000).toISOString()};
   const mutation=current?await db.from("restaurant_members").update(row).eq("restaurant_id",id).eq("user_id",target):
     await db.from("restaurant_members").insert(row);
   if(mutation.error)return fail("Convite não pôde ser associado ao restaurante",503);
   if(current)await db.from("restaurant_member_module_access").delete().eq("restaurant_id",id).eq("user_id",target);
   await db.from("audit_logs").insert({restaurant_id:id,actor_user_id:user.id,event:"staff_invited",details:{target_user_id:target,role,emailed}});
   return json({invited:true,emailed,existing_user:!emailed},201);
 }
 const target=clean(body.user_id,80);
 if(!uuid.test(target)||target===user.id)return fail("Funcionário inválido",400);
 const {data:member,error:targetError}=await db.from("restaurant_members").select("user_id,role,status").eq("restaurant_id",id).eq("user_id",target).maybeSingle();
 if(targetError||!member)return fail("Funcionário não encontrado",404);
 if(member.role==="master"||(manager&&!staff.includes(member.role)))return fail("Essa função não pode ser alterada por sua conta",403);
 if(action==="set_role"){
   const role=clean(body.role,20);
   if(!roles.includes(role as typeof roles[number])||role==="master"||(manager&&!staff.includes(role))||member.status!=="active")return fail("Função ou vínculo inválido",400);
   const {error}=await db.from("restaurant_members").update({role}).eq("restaurant_id",id).eq("user_id",target).eq("status","active");
   if(error)return fail("Falha ao atualizar função",503);
   await db.from("audit_logs").insert({restaurant_id:id,actor_user_id:user.id,event:"staff_role_changed",details:{target_user_id:target,from:member.role,to:role}});
   return json({updated:true});
 }
 if(action==="revoke"){
   if(member.status==="revoked")return fail("Acesso já revogado",409);
   const {error}=await db.from("restaurant_members").update({status:"revoked"}).eq("restaurant_id",id).eq("user_id",target);
   if(error)return fail("Não foi possível revogar",503);
   await db.from("audit_logs").insert({restaurant_id:id,actor_user_id:user.id,event:"staff_revoked",details:{target_user_id:target,role:member.role}});
   return json({revoked:true});
 }
 if(action==="set_access"){
   if(!owner||member.status!=="active")return fail("Somente o Master pode alterar permissões",403);
   const module=clean(body.module,25);
   if(!modules.includes(module)||typeof body.allowed!=="boolean")return fail("Permissão inválida",400);
   if(module==="gestao"&&member.role!=="manager"&&body.allowed===true)return fail("Somente gerentes podem receber acesso à gestão",403);
   const {error}=await db.from("restaurant_member_module_access").upsert({restaurant_id:id,user_id:target,module,allowed:body.allowed,updated_at:new Date().toISOString()},{onConflict:"restaurant_id,user_id,module"});
   if(error)return fail("Não foi possível ajustar permissão",503);
   await db.from("audit_logs").insert({restaurant_id:id,actor_user_id:user.id,event:"staff_access_changed",details:{target_user_id:target,module,allowed:body.allowed}});
   return json({updated:true});
 }
 if(action==="save_settings"){
   const input=(body.settings&&typeof body.settings==="object"&&!Array.isArray(body.settings))?body.settings as Record<string,unknown>:{};
   const patch:Record<string,unknown>={restaurant_id:id,updated_at:new Date().toISOString()};
   for(const field of safeFields){
      if(Object.prototype.hasOwnProperty.call(input,field)){
        if(input[field]!==null&&typeof input[field]!=="string")return fail("Informação inválida");
        const raw=clean(input[field],180);
        const lim=field==="phone"?30:field==="street"?150:field==="city"?120:field==="neighborhood"?100:field==="address_number"?30:field==="postal_code"?8:field==="state"?2:64;
        if(raw.length>lim)return fail("Campo excede o tamanho permitido");
        patch[field]=raw||null;
      }
   }
   if(patch.state&& !/^[A-Z]{2}$/.test(patch.state as string))return fail("UF inválida");
   if(patch.postal_code&&!/^\d{8}$/.test(patch.postal_code as string))return fail("CEP inválido");
   if(patch.timezone&&!timezones.includes(patch.timezone as string))return fail("Fuso horário inválido");
   const complete=body.complete===true;
   if(complete){
     const {data:old}=await db.from("restaurant_settings").select("phone,city,state").eq("restaurant_id",id).maybeSingle();
     const chosen={...old,...patch};
     if(!chosen.phone||!chosen.city||!chosen.state)return fail("Telefone, cidade e UF são necessários para concluir o cadastro",400);
     patch.onboarding_completed_at=new Date().toISOString();
   }
   const {error}=await db.from("restaurant_settings").upsert(patch,{onConflict:"restaurant_id"});
   if(error)return fail("Não foi possível salvar dados",503);
   await db.from("audit_logs").insert({restaurant_id:id,actor_user_id:user.id,event:complete?"restaurant_onboarding_completed":"restaurant_settings_updated",details:{fields:Object.keys(patch).filter(k=>k!=="restaurant_id"),completed:complete}});
   return json({saved:true,complete});
 }
 return fail("Ação não reconhecida",400);
});