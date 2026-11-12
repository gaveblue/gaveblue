import { createClient } from "npm:@supabase/supabase-js@2.50.0";
import { cpfDigits, privateDigest, jsonHeaders } from "./cpf.ts";
const url=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const anonKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
const headers=jsonHeaders();
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{headers,status});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return json({error:"Método não permitido."},405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!=="https://gaveblue.com.br")return json({error:"Origem inválida."},403);
 if(!url||!serviceKey||!anonKey)return json({error:"Autenticação indisponível."},503);
 const bearer=req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!bearer)return json({error:"Entre na conta para continuar."},401);
 const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await db.auth.getUser(bearer);
 if(authError||!user||user.is_anonymous||!user.email_confirmed_at||!user.email)return json({error:"Conta não confirmada."},401);
 if(user.app_metadata?.intervalo_password_change_required)return json({error:"Troque sua senha provisória primeiro"},403);
 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>2048)throw Error("Payload");body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=="object")throw Error("Payload");}
 catch{return json({error:"Dados inválidos."},400)}
 const action=body.action;
 if(action==="status"){
  const {data,error}=await db.from("user_cpf_login").select("cpf_last4,linked_at").eq("user_id",user.id).maybeSingle();
  if(error)return json({error:"Não foi possível consultar o CPF."},503);
  return json({linked:!!data,last4:data?.cpf_last4??null,linked_at:data?.linked_at??null});
 }
 if(action!=="link"&&action!=="unlink")return json({error:"Ação inválida."},400);
 const pass=body.current_password;
 if(typeof pass!=="string"||!pass||pass.length>128)return json({error:"Informe sua senha atual."},400);
 const publicAuth=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:reauth,error:reauthError}=await publicAuth.auth.signInWithPassword({email:user.email.trim().toLowerCase(),password:pass});
 if(reauthError||!reauth.user||reauth.user.id!==user.id)return json({error:"Senha atual incorreta."},403);
 if(action==="unlink"){
   const {error}=await db.from("user_cpf_login").delete().eq("user_id",user.id);
   if(error)return json({error:"Não foi possível desvincular o CPF."},503);
   await db.from("audit_logs").insert({actor_user_id:user.id,event:"cpf_login_unlinked",details:{method:"password_reauthentication"}});
   return json({unlinked:true});
 }
 const cpf=cpfDigits(body.cpf);
 if(!cpf)return json({error:"CPF inválido. Confira os 11 dígitos."},400);
 const digest=await privateDigest(cpf,serviceKey);
 const {data:conflict,error:conflictError}=await db.from("user_cpf_login").select("user_id").eq("cpf_digest",digest).maybeSingle();
 if(conflictError)return json({error:"Falha ao verificar CPF."},503);
 if(conflict&&conflict.user_id!==user.id)return json({error:"Este CPF já está associado a outra conta. Solicite ajuda ao suporte."},409);
 const {error:writeError}=await db.from("user_cpf_login").upsert({user_id:user.id,cpf_digest:digest,cpf_last4:cpf.slice(-4),linked_at:new Date().toISOString()},{onConflict:"user_id"});
 if(writeError){
  if(writeError.code==="23505")return json({error:"CPF já associado a outra conta."},409);
  return json({error:"Não foi possível vincular o CPF."},503);
 }
 await db.from("audit_logs").insert({actor_user_id:user.id,event:"cpf_login_linked",details:{method:"password_reauthentication"}});
 return json({linked:true,last4:cpf.slice(-4)});
});