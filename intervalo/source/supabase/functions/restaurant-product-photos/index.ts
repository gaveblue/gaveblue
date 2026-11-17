// Intervalo 1.1.0-rc.19: emissão de token temporário por produto, sem expor service_role ao Android.
import {createClient} from "npm:@supabase/supabase-js@2.50.0";
const url=Deno.env.get("SUPABASE_URL")??"";
const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const origin="https://gaveblue.com.br";
const bucket="intervalo-product-images";
const cors={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const fail=(reason:string,status=400)=>json({error:reason},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validUUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cryptoKey=secret?await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]):null;
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer)).map(v=>v.toString(16).padStart(2,"0")).join("");
const hmac=async(s:string)=>{if(!cryptoKey)throw Error("chave indisponível");return hex(await crypto.subtle.sign("HMAC",cryptoKey,new TextEncoder().encode(s)))};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return fail("Método não permitido",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return fail("Origem não autorizada",403);
 if(!url||!secret)return fail("Serviço indisponível",503);
 const jwt=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!jwt)return fail("Faça login para continuar",401);
 let body:Record<string,unknown>;
 try{
  const raw=await req.text();if(raw.length>3000)throw Error("Tamanho inválido");
  body=JSON.parse(raw);
  if(!body||Array.isArray(body)||typeof body!=="object")throw Error("Body inválido");
 }catch{return fail("Solicitação inválida")}
 if(!["sign","list"].includes(String(body.action||"")))return fail("Ação inválida");
 if(typeof body.restaurant_id!=="string"||!validUUID.test(body.restaurant_id))return fail("Restaurante inválido");
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 try{
  const {data:{user},error:authError}=await db.auth.getUser(jwt);
  if(authError||!user||user.is_anonymous||!user.email_confirmed_at)return fail("Sessão não confirmada",401);
  if(user.app_metadata?.intervalo_password_change_required)return fail("Troque a senha provisória",403);
  const restaurantId=body.restaurant_id;
  const [restaurant,member,mod,override]=await Promise.all([
   db.from("restaurants").select("id,status").eq("id",restaurantId).maybeSingle(),
   db.from("restaurant_members").select("role,status").eq("restaurant_id",restaurantId).eq("user_id",user.id).maybeSingle(),
   db.from("restaurant_modules").select("enabled").eq("restaurant_id",restaurantId).eq("module","gestao").maybeSingle(),
   db.from("restaurant_member_module_access").select("allowed").eq("restaurant_id",restaurantId).eq("user_id",user.id).eq("module","gestao").maybeSingle()
  ]);
  if(restaurant.error||member.error||mod.error||override.error)return fail("Falha ao verificar permissões",503);
  if(restaurant.data?.status!=="active"||member.data?.status!=="active"||
    !["master","manager"].includes(member.data?.role??"")||mod.data?.enabled!==true||
    (member.data?.role!=="master"&&override.data?.allowed===false))
   return fail("Somente Gestão autorizada pode enviar fotos",403);
  // Biblioteca: consulta SOMENTE o diretório do restaurante autenticado.
  // Os objetos podem ser reutilizados por N produtos sem copiá-los nem multiplicar armazenamento.
  if(body.action==="list"){
   const offset=body.offset===undefined?0:body.offset;
   if(!Number.isSafeInteger(offset)||offset<0||offset>10000)return fail("Página inválida");
   const [listed,existing]=await Promise.all([
    db.storage.from(bucket).list(restaurantId,{
     limit:49,offset,sortBy:{column:"created_at",order:"desc"}
    }),
    db.from("menu_products").select("name,image_url").eq("restaurant_id",restaurantId)
     .not("image_url","is",null).limit(500)
   ]);
   if(listed.error||existing.error)return fail("Não foi possível carregar biblioteca de fotos",503);
   const refs=new Map<string,{url:string,used:number,names:string[]}>();
   for(const product of existing.data??[]){
    const photo=String(product.image_url||"").trim();
    if(!/^https:\/\/[^\s<>"']+$/i.test(photo)||photo.length>1200)continue;
    let ref=refs.get(photo);
    if(!ref){ref={url:photo,used:0,names:[]};refs.set(photo,ref)}
    ref.used++;
    if(ref.names.length<5&&typeof product.name==="string")ref.names.push(product.name.slice(0,150));
   }
   const files=(listed.data??[]).filter(f=>f?.id&&/^[0-9a-f-]{36}\.jpg$/i.test(f.name));
   const visible=files.slice(0,48);
   const items=visible.map(f=>{
    const path=restaurantId+"/"+f.name;
    const u=db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    const use=refs.get(u);
    return {url:u,name:f.name,created_at:f.created_at??null,used:use?.used??0,
     product_names:use?.names??[]};
   });
   return json({items,linked:Array.from(refs.values()),next_offset:offset+visible.length,
    has_more:files.length>48});
  }
  // Limite por usuário: 12 tokens de upload a cada 60s, 150 por dia.
  const userHash=await hmac("intervalo:photo-upload:"+restaurantId+":"+user.id);
  const [minute,day]=await Promise.all([
   db.rpc("marketplace_rate_gate",{p_hash:await hmac("60:"+userHash),p_window_seconds:60,p_max:12}),
   db.rpc("marketplace_rate_gate",{p_hash:await hmac("86400:"+userHash),p_window_seconds:86400,p_max:150})
  ]);
  if(minute.error||day.error)return fail("Limite de segurança indisponível",503);
  if(minute.data!==true||day.data!==true)return fail("Limite temporário de fotos atingido. Tente novamente mais tarde.",429);
  const path=restaurantId+"/"+crypto.randomUUID()+".jpg";
  const {data:sign,error:signError}=await db.storage.from(bucket).createSignedUploadUrl(path);
  if(signError||!sign?.token)return fail("Não foi possível autorizar envio da foto",503);
  const publicUrl=db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return json({bucket,path,token:sign.token,public_url:publicUrl,max_bytes:1500000});
 }catch{return fail("Não foi possível preparar o envio da foto",503)}
});