// Intervalo rc.17 — pedidos internos de delivery/retirada lançados pelo Garçom.
import {createClient} from "npm:@supabase/supabase-js@2.50.0";
const ORIGIN="https://gaveblue.com.br";
const headers={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-retry-count,traceparent,tracestate,baggage","Access-Control-Allow-Methods":"OPTIONS,POST","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const reply=(result:unknown,status=200)=>new Response(JSON.stringify(result),{status,headers});
const fail=(message:string,status=400)=>reply({error:message},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean=(s:unknown,n=180)=>typeof s==="string"?s.trim().slice(0,n):"";
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const db=createClient(Deno.env.get("SUPABASE_URL")||"",serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const hmacKey=serviceKey?await crypto.subtle.importKey("raw",new TextEncoder().encode(serviceKey),{name:"HMAC",hash:"SHA-256"},false,["sign"]):null;
const hex=(data:ArrayBuffer)=>Array.from(new Uint8Array(data)).map(v=>v.toString(16).padStart(2,"0")).join("");
const hmac=async(s:string)=>{if(!hmacKey)throw Error("Segurança indisponível");return hex(await crypto.subtle.sign("HMAC",hmacKey,new TextEncoder().encode(s)))};
const hash=async(s:string)=>hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return fail("Método inválido",405);
 if(!serviceKey)return fail("Serviço indisponível",503);
 const origin=req.headers.get("origin");
 if(origin&&origin!==ORIGIN)return fail("Origem inválida",403);
 let body:any;
 try{body=await req.json()}catch{return fail("JSON inválido")}
 const restaurant_id=body?.restaurant_id,action=body?.action;
 if(typeof restaurant_id!=="string"||!uuid.test(restaurant_id))return fail("Restaurante inválido");
 if(!["config","create"].includes(action))return fail("Ação inválida");
 const rawAuth=req.headers.get("authorization")||"";
 const match=/^Bearer\s+(\S+)$/i.exec(rawAuth);
 if(!match)return fail("Faça login para continuar",401);
 try{
  const {data:{user},error:ue}=await db.auth.getUser(match[1]);
  if(ue||!user||user.is_anonymous)return fail("Sessão inválida",401);
  if(user.app_metadata?.intervalo_password_change_required)return fail("Troque sua senha provisória",403);
  const [r,m,mod,ov]=await Promise.all([
   db.from("restaurants").select("id,status").eq("id",restaurant_id).maybeSingle(),
   db.from("restaurant_members").select("status,role").eq("restaurant_id",restaurant_id).eq("user_id",user.id).maybeSingle(),
   db.from("restaurant_modules").select("enabled").eq("restaurant_id",restaurant_id).eq("module","garcom").maybeSingle(),
   db.from("restaurant_member_module_access").select("allowed").eq("restaurant_id",restaurant_id).eq("module","garcom").eq("user_id",user.id).maybeSingle()
  ]);
  if(r.error||m.error||mod.error||ov.error)return fail("Não foi possível validar acesso",503);
  if(r.data?.status!=="active"||m.data?.status!=="active"||
     !["master","manager","waiter"].includes(m.data?.role||"")||mod.data?.enabled!==true||ov.data?.allowed===false)
    return fail("Sem permissão de Garçom neste restaurante",403);
  if(action==="config"){
   const [zones,settings]=await Promise.all([
    db.from("restaurant_delivery_zones").select("id,name,city,state,neighborhoods,fee_cents,minimum_order_cents,estimated_delivery_minutes,postal_code_from,postal_code_to").eq("restaurant_id",restaurant_id).eq("active",true).order("name"),
    db.from("restaurant_online_settings").select("enabled,paused,delivery_enabled,pickup_enabled").eq("restaurant_id",restaurant_id).maybeSingle()
   ]);
   if(zones.error||settings.error)return fail("Configurações de entrega indisponíveis",503);
   return reply({zones:zones.data??[],settings:settings.data??null});
  }
  const request_id=body.request_id;
  const kind=body.kind,method=body.payment_method;
  const name=clean(body.customer_name,120),phone=clean(body.customer_phone,20).replace(/\D/g,""),note=clean(body.customer_note,500);
  const items=body.items,zone=body.zone_id??null,address=body.address??null;
  if(typeof request_id!=="string"||!uuid.test(request_id))return fail("Identificação do pedido inválida");
  if(!["delivery","pickup"].includes(kind)||!Array.isArray(items)||items.length<1||items.length>25)return fail("Escolha modalidade e produtos válidos");
  if(name.length<2||phone.length<10||phone.length>13)return fail("Informe nome e celular do cliente");
  if(kind==="delivery"&&(!zone||!uuid.test(zone)||!address||typeof address!=="object"))return fail("Selecione a região e informe o endereço");
  const list=items.map((i:any)=>({
   product_id:clean(i.product_id,45),
   quantity:Number(i.quantity),
   note:clean(i.note,350),
   option_ids:[]
  }));
  if(list.some((i:{product_id:string,quantity:number})=>!uuid.test(i.product_id)||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>20))
   return fail("Produtos ou quantidades inválidas");
  if(kind==="delivery"&&!["cash","pix_on_delivery","card_on_delivery"].includes(method))return fail("Pagamento inválido");
  if(kind==="pickup"&&!["cash_on_pickup","pix_on_pickup","card_on_pickup"].includes(method))return fail("Pagamento inválido");
  const token=request_id+"."+await hmac("staff:"+restaurant_id+":"+request_id);
  const {data:result,error}=await db.rpc("marketplace_staff_place_order",{
   p_restaurant:restaurant_id,p_actor:user.id,p_request_id:request_id,p_kind:kind,p_zone:kind==="delivery"?zone:null,
   p_address:kind==="delivery"?address:null,p_items:list,p_name:name,p_phone:phone,
   p_note:note,p_method:method,p_track_hash:await hash(token)
  });
  if(error)return fail(error.message?.slice(0,240)||"Não foi possível criar o pedido",error.code==="P0001"?422:503);
  return reply({order:result,tracking_url:ORIGIN+"/intervalo/pedido/"+encodeURIComponent(token),
   tracking_token:token},result?.reused?200:201);
 }catch(err){return fail("Não foi possível concluir o pedido. Tente novamente.",503)}
});
