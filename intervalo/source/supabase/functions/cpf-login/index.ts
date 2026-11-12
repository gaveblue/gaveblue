import { createClient } from "npm:@supabase/supabase-js@2.50.0";
import { cpfDigits, privateDigest, jsonHeaders } from "./cpf.ts";
const url=Deno.env.get("SUPABASE_URL")??"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const anonKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
const headers=jsonHeaders();
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{headers,status});
const bad=()=>json({error:"CPF ou senha incorretos."},401);
const allowedOrigin="https://gaveblue.com.br";
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return json({error:"Método não permitido."},405);
 if(req.headers.get("Origin") && req.headers.get("Origin")!==allowedOrigin)return json({error:"Origem inválida."},403);
 if(!url||!serviceKey||!anonKey)return json({error:"Autenticação indisponível."},503);
 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>2048)throw Error("Too long");body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))throw Error("Invalid");}
 catch{return bad();}
 const cpf=cpfDigits(body.cpf);
 const password=body.password;
 if(!cpf||typeof password!=="string"||password.length<1||password.length>128)return bad();
 const digest=await privateDigest(cpf,serviceKey);
 const remote=(req.headers.get("cf-connecting-ip")??req.headers.get("x-real-ip")??req.headers.get("x-forwarded-for")?.split(",")[0]??"").trim().slice(0,100);
 const network=await privateDigest(remote||"unknown",serviceKey,"network");
 const db=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
 const fifteenMinutesAgo=new Date(Date.now()-15*60*1000).toISOString();
 const [{count:subjectCount,error:se},{count:networkCount,error:ne}]=await Promise.all([
   db.from("cpf_login_attempts").select("id",{count:"exact",head:true}).eq("cpf_digest",digest).gte("attempted_at",fifteenMinutesAgo),
   remote?db.from("cpf_login_attempts").select("id",{count:"exact",head:true}).eq("network_digest",network).gte("attempted_at",fifteenMinutesAgo):Promise.resolve({count:0,error:null})
 ]);
 if(se||ne)return json({error:"Login temporariamente indisponível."},503);
 if((subjectCount??0)>=5||(remote&&(networkCount??0)>=25))return json({error:"Muitas tentativas. Tente novamente mais tarde."},429);
 const {error:recordError}=await db.from("cpf_login_attempts").insert({cpf_digest:digest,network_digest:network});
 if(recordError)return json({error:"Login temporariamente indisponível."},503);
 if(Math.random()<0.02){await db.from("cpf_login_attempts").delete().lt("attempted_at",new Date(Date.now()-2*24*3600*1000).toISOString());}
 const {data:row,error:re}=await db.from("user_cpf_login").select("user_id").eq("cpf_digest",digest).maybeSingle();
 if(re||!row)return bad();
 const {data:identity,error:identityError}=await db.auth.admin.getUserById(row.user_id);
 const currentEmail=identity.user?.email?.trim().toLowerCase();
 if(identityError||!currentEmail||!identity.user?.email_confirmed_at)return bad();
 const publicAuth=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:login,error:loginError}=await publicAuth.auth.signInWithPassword({email:currentEmail,password});
 if(loginError||!login.user||login.user.id!==row.user_id||!login.session?.access_token||!login.session?.refresh_token)return bad();
 await db.from("cpf_login_attempts").delete().eq("cpf_digest",digest);
 return json({access_token:login.session.access_token,refresh_token:login.session.refresh_token});
});