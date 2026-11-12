import { createClient } from "npm:@supabase/supabase-js@2.50.0";
const url=Deno.env.get("SUPABASE_URL")??"", key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const origin="https://gaveblue.com.br";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const out=(obj:unknown,status=200)=>new Response(JSON.stringify(obj),{status,headers});
const reserved=new Set(["admin","login","api","auth","assets","static","app","ativar","redefinir","manifest","suporte","cadastro","entrar","sair","inicio","configuracoes","www"]);
const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return out({error:"Método não permitido"},405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return out({error:"Origem não autorizada"},403);
 if(!url||!key)return out({error:"Servidor não configurado"},503);
 const token=req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return out({error:"Sessão obrigatória"},401);
 const {data:{user},error:ue}=await sb.auth.getUser(token);
 if(ue||!user)return out({error:"Sessão inválida"},401);
 const {data:admin,error:ae}=await sb.from("platform_admins").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
 if(ae)return out({error:"Falha na verificação administrativa"},503);
 if(!admin)return out({error:"Apenas Super Admin"},403);
 let body:Record<string,unknown>;
 try{body=await req.json();}catch{return out({error:"JSON inválido"},400);}
 const name=typeof body.name==="string"?body.name.trim():"",slug=typeof body.slug==="string"?body.slug.trim():"",email=typeof body.master_email==="string"?body.master_email.trim().toLowerCase():"";
 if(name.length<2||name.length>120||slug.length<3||slug.length>60||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||reserved.has(slug)||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return out({error:"Nome, slug ou email inválido"},400);
 const {data:existing,error:ee}=await sb.from("restaurants").select("id").eq("slug",slug).maybeSingle();
 if(ee)return out({error:"Falha ao verificar identificador"},503);
 if(existing)return out({error:"Identificador já cadastrado"},409);
 const {data:invited,error:ie}=await sb.auth.admin.inviteUserByEmail(email,{redirectTo:origin+"/intervalo/ativar"});
 if(ie||!invited.user?.id)return out({error:"Convite não enviado. Revise email, usuário existente ou limites do Auth."},409);
 const {data:restaurant,error:re}=await sb.from("restaurants").insert({name,slug,status:"active"}).select("id,name,slug,status").single();
 if(re||!restaurant){console.error("restaurant_create_failed",{code:re?.code});return out({error:"Erro ao cadastrar restaurante; convite poderá ter sido emitido"},500);}
 const expires=new Date(Date.now()+86400000).toISOString();
 const {error:me}=await sb.from("restaurant_members").insert({restaurant_id:restaurant.id,user_id:invited.user.id,role:"master",status:"pending",invite_expires_at:expires});
 const {error:mo}=me?{error:me}:await sb.from("restaurant_modules").insert(["gestao","garcom","cozinha","caixa","cardapio"].map(module=>({restaurant_id:restaurant.id,module,enabled:module==="gestao"})));
 if(me||mo){await sb.from("restaurants").delete().eq("id",restaurant.id);console.error("provision_failure",{member:me?.code,modules:mo?.code});return out({error:"Cadastro revertido; verifique logs"},500);}
 const {error:au}=await sb.from("audit_logs").insert({restaurant_id:restaurant.id,actor_user_id:user.id,event:"restaurant_created_master_invited",details:{slug,master_user_id:invited.user.id}});
 if(au){await sb.from("restaurants").delete().eq("id",restaurant.id);return out({error:"Falha de auditoria, cadastro revertido"},500);}
 return out({restaurant,invited:true},201);
});