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
 if(user.app_metadata?.intervalo_password_change_required)return out({error:"Troque sua senha provisória primeiro"},403);
 const {data:admin,error:ae}=await sb.from("platform_admins").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
 if(ae)return out({error:"Falha na verificação administrativa"},503);
 if(!admin)return out({error:"Apenas Super Admin"},403);

 let body:Record<string,unknown>;
 try{const raw=await req.text();if(raw.length>4000)throw Error("oversize");body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=="object")throw Error("invalid")}
 catch{return out({error:"Dados inválidos"},400)}
 const action=typeof body.action==="string"?body.action:"create";
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const validEmail=(value:string)=>value.length>=5&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
 const lookup=async(email:string)=>{
  for(let page=1;page<=12;page++){
   const {data,error}=await sb.auth.admin.listUsers({page,perPage:200});
   if(error)throw Error("auth_lookup_failed");
   const user=data.users.find(u=>u.email?.trim().toLowerCase()===email);
   if(user)return user;
   if(data.users.length<200)return null;
  }
  throw Error("auth_lookup_limit");
 };
 const assign=async(restaurantId:string,accountId:string,email:string)=>{
  const {data,error}=await sb.rpc("intervalo_assign_master",{p_admin:user.id,p_restaurant:restaurantId,p_user:accountId,p_email:email});
  if(error)throw Error("master_link_failed");
  return data;
 };
 if(action==="create"){
  const name=typeof body.name==="string"?body.name.trim():"";
  const slug=typeof body.slug==="string"?body.slug.trim().toLowerCase():"";
  const email=typeof body.master_email==="string"?body.master_email.trim().toLowerCase():"";
  if(name.length<2||name.length>120||slug.length<3||slug.length>60||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||reserved.has(slug)||(email&&!validEmail(email)))
   return out({error:"Confira o nome, identificador e e-mail do Master (opcional). Use letras minúsculas no identificador."},400);
  const {data:restaurant,error:createdError}=await sb.rpc("intervalo_create_restaurant",{p_admin:user.id,p_name:name,p_slug:slug,p_email:email||null});
  if(createdError){
    if(createdError.code==="23505")return out({error:"Já existe restaurante com esse identificador. Escolha outro."},409);
    console.error("restaurant_create_atomic_failed",{code:createdError.code});
    return out({error:"Não foi possível criar o restaurante. Nenhum cadastro parcial foi mantido."},500);
  }
  let master_status=email?"awaiting_account":"not_configured",existing_user=false;
  if(email){
   try{
    const account=await lookup(email);
    if(account){
      existing_user=true;
      await assign(restaurant.id,account.id,email);
      master_status="linked";
    }
   }catch(e){
    console.warn("restaurant_created_pending_master",{kind:String(e).slice(0,80)});
   }
  }
  return out({restaurant,created:true,existing_user,master_status,needs_manual_invite:master_status==="awaiting_account"},201);
 }
 const restaurant_id=typeof body.restaurant_id==="string"?body.restaurant_id:"";
 if(!uuid.test(restaurant_id))return out({error:"Restaurante inválido"},400);
 const {data:restaurant,error:re}=await sb.from("restaurants").select("id,name,slug,status").eq("id",restaurant_id).maybeSingle();
 if(re||!restaurant)return out({error:"Restaurante não encontrado"},404);
 if(action==="set_master_email"){
   const email=typeof body.master_email==="string"?body.master_email.trim().toLowerCase():"";
   if(!validEmail(email))return out({error:"E-mail do Master inválido"},400);
   const {data:setup,error:se}=await sb.from("restaurant_master_setup").select("status").eq("restaurant_id",restaurant_id).maybeSingle();
   if(se)return out({error:"Erro ao verificar responsável"},503);
   if(setup?.status==="linked")return out({error:"Já existe um Master vinculado; use a gestão de equipe."},409);
   const {data:members,error:me}=await sb.from("restaurant_members").select("user_id").eq("restaurant_id",restaurant_id).eq("role","master").neq("status","revoked").limit(1);
   if(me)return out({error:"Erro ao verificar responsáveis"},503);
   if((members??[]).length)return out({error:"O restaurante já possui um Master. Utilize a seção de usuários."},409);
   const {error:writeError}=await sb.from("restaurant_master_setup").upsert({restaurant_id,master_email:email,status:"awaiting_account",linked_user_id:null,updated_at:new Date().toISOString()},{onConflict:"restaurant_id"});
   if(writeError)return out({error:"Não foi possível definir o e-mail do Master"},503);
   await sb.from("audit_logs").insert({restaurant_id,actor_user_id:user.id,event:"restaurant_master_email_set",details:{email_configured:true}});
   return out({master_email_set:true});
 }
 if(action==="prepare_master_invite"){
   if(restaurant.status!=="active")return out({error:"Restaurante suspenso"},409);
   const password=body.admin_password;
   if(typeof password!=="string"||password.length<1||password.length>256||!user.email)return out({error:"Confirme sua senha de Super Admin"},403);
   const publicKey=Deno.env.get("SUPABASE_ANON_KEY")??"";
   if(!publicKey)return out({error:"Configuração Auth indisponível"},503);
   const publicClient=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data:pass,error:passwordError}=await publicClient.auth.signInWithPassword({email:user.email,password});
   if(passwordError||pass.user?.id!==user.id)return out({error:"Senha do Super Admin incorreta"},403);
   const {data:setup,error:se}=await sb.from("restaurant_master_setup").select("master_email,status,linked_user_id").eq("restaurant_id",restaurant_id).maybeSingle();
   if(se||!setup)return out({error:"Defina o e-mail do Master primeiro"},409);
   const email=setup.master_email;
   let account=null;
   try{account=await lookup(email)}catch{return out({error:"Não foi possível verificar a conta Master"},503)}
   if(account&&setup.status==="linked"&&account.email_confirmed_at)return out({linked:true,existing_user:true,confirmed:true,manual_link:null});
   let link:null|string=null;
   if(!account){
     const {data,error:linkError}=await sb.auth.admin.generateLink({type:"invite",email,options:{redirectTo:origin+"/intervalo/ativar"}});
     if(linkError||!data?.user?.id||!data?.properties?.action_link){
       console.warn("master_manual_link_failed",{code:linkError?.code??"unknown"});
       return out({error:"O restaurante foi criado, mas o link do convite ainda não pôde ser gerado. Tente preparar o convite novamente."},503);
     }
     account=data.user;
     link=data.properties.action_link;
   }else if(!account.email_confirmed_at){
     const {data,error:linkError}=await sb.auth.admin.generateLink({type:"magiclink",email,options:{redirectTo:origin+"/intervalo/ativar"}});
     if(linkError||!data?.properties?.action_link)
       return out({error:"Não foi possível gerar link de ativação para essa conta. O restaurante continua cadastrado."},503);
     link=data.properties.action_link;
   }
   try{await assign(restaurant_id,account.id,email)}
   catch{return out({error:"Conta encontrada, mas não foi possível vincular o Master. O restaurante continua salvo."},503)}
   await sb.from("audit_logs").insert({restaurant_id,actor_user_id:user.id,event:"master_manual_invite_prepared",details:{target_user_id:account.id,link_generated:!!link}});
   return out({linked:true,existing_user:!link,confirmed:!!account.email_confirmed_at,manual_link:link,delivery:"copy_only"},200);
 }
 return out({error:"Ação inválida"},400);
});