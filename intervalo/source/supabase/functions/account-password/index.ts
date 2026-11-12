import {createClient} from "npm:@supabase/supabase-js@2.50.0";
const url=Deno.env.get("SUPABASE_URL")??"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"",publicKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
const headers={"Access-Control-Allow-Origin":"https://gaveblue.com.br","Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const reply=(payload:unknown,status=200)=>new Response(JSON.stringify(payload),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Método não permitido"},405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!=="https://gaveblue.com.br")return reply({error:"Origem inválida"},403);
 if(!url||!secret||!publicKey)return reply({error:"Serviço indisponível"},503);
 const token=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return reply({error:"Entre na sua conta"},401);
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:ue}=await admin.auth.getUser(token);
 if(ue||!user||!user.email||!user.email_confirmed_at)return reply({error:"Sessão não confirmada"},401);
 let payload:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>1024)throw Error("oversize");payload=JSON.parse(raw);if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error("invalid")}
 catch{return reply({error:"Dados inválidos"},400)}
 const current=payload.current_password,updated=payload.new_password;
 if(typeof current!=="string"||current.length<1||current.length>256||typeof updated!=="string"||updated.length<12||updated.length>128||current===updated)return reply({error:"A nova senha deve ter 12 ou mais caracteres e ser diferente da anterior"},400);
 const auth=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:verified,error:ve}=await auth.auth.signInWithPassword({email:user.email,password:current});
 if(ve||verified.user?.id!==user.id)return reply({error:"Senha atual incorreta"},403);
 const app_metadata={...(user.app_metadata??{}),intervalo_password_change_required:false};
 const {error:updateErr}=await admin.auth.admin.updateUserById(user.id,{password:updated,app_metadata});
 if(updateErr)return reply({error:"Não foi possível atualizar sua senha"},503);
 await admin.from("audit_logs").insert({actor_user_id:user.id,event:"self_password_rotated",details:{forced:!!user.app_metadata?.intervalo_password_change_required}});
 return reply({changed:true,require_new_login:true});
});