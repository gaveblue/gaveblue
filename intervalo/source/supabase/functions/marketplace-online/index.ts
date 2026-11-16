import {createClient} from "npm:@supabase/supabase-js@2.50.0";

// API pública de checkout/acompanhar. JWT desativado somente aqui, dados via token de capacidade.
// Todas as mutações são RPC transacionais, com RLS/grants fechados nas tabelas.
const origin="https://gaveblue.com.br";
const headers={
 "Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-retry-count,traceparent,tracestate,baggage",
 "Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json",
 "Cache-Control":"no-store","Vary":"Origin"
};
const answer=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
const err=(msg:string,status=400)=>answer({error:msg},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const apiUrl=Deno.env.get("SUPABASE_URL")??"";
const db=createClient(apiUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const cryptoKey=serviceKey?await crypto.subtle.importKey("raw",new TextEncoder().encode(serviceKey),{name:"HMAC",hash:"SHA-256"},false,["sign"]):null;
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join("");
const hmac=async(value:string)=>hex(await crypto.subtle.sign("HMAC",cryptoKey!,new TextEncoder().encode(value)));
const hash=async(value:string)=>hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));
const safeFailure=(error:unknown)=>{
 const e=error as {code?:string,message?:string};
 if(e?.code==="P0001")return (e.message??"Dados inválidos").slice(0,180);
 return "Não foi possível concluir a solicitação. Verifique os dados e tente novamente.";
};
const clip=(x:unknown,max:number)=>typeof x==="string"?x.trim().slice(0,max+1):"";
const clientItems=(data:unknown)=>{
 if(!Array.isArray(data)||data.length<1||data.length>25)throw Error("Adicione entre 1 e 25 produtos");
 return data.map(x=>{
  if(!x||typeof x!=="object"||!uuid.test(x.product_id??""))throw Error("Produto inválido");
  if(!Number.isSafeInteger(x.quantity)||x.quantity<1||x.quantity>20)throw Error("Quantidade inválida");
  if(!Array.isArray(x.option_ids)||x.option_ids.length>12||
    x.option_ids.some((i:unknown)=>typeof i!=="string"||!uuid.test(i))||
    new Set(x.option_ids).size!==x.option_ids.length)throw Error("Adicionais inválidos");
  const note=clip(x.note,350);if(note.length>350)throw Error("Observação longa demais");
  return {product_id:x.product_id,quantity:x.quantity,option_ids:x.option_ids,note};
 });
};
const parseOrder=(body:Record<string,unknown>)=>{
 const kind=body.fulfillment_type;
 if(kind!=="pickup"&&kind!=="delivery")throw Error("Selecione entrega ou retirada");
 const zone=body.zone_id;
 if(zone!==null&&zone!==undefined&&(typeof zone!=="string"||!uuid.test(zone)))throw Error("Região inválida");
 let address:Record<string,string>|null=null;
 if(kind==="delivery"){
  if(!body.address||typeof body.address!=="object"||Array.isArray(body.address))throw Error("Preencha o endereço de entrega");
  const a=body.address as Record<string,unknown>;
  address={
   street:clip(a.street,160),number:clip(a.number,25),neighborhood:clip(a.neighborhood,100),
   city:clip(a.city,100),state:clip(a.state,2).toUpperCase(),
   postal_code:clip(a.postal_code,8).replace(/[^0-9]/g,""),complement:clip(a.complement,120),
   reference:clip(a.reference,160)
  };
  if(Object.entries(address).some(([k,v])=>v.length>(k==="street"?160:k==="number"?25:k==="complement"?120:k==="reference"?160:100)))
   throw Error("Endereço longo demais");
 }else if(zone!=null)throw Error("Retirada não utiliza região");
 return {
  p_kind:kind,p_zone:zone??null,p_address:address,p_items:clientItems(body.items)
 };
};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return err("Método não permitido",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return err("Origem não permitida",403);
 if(!serviceKey||!apiUrl||!cryptoKey)return err("Serviço indisponível",503);
 let body:Record<string,unknown>;
 try{
  const text=await req.text();if(text.length>18000)throw Error("size");
  body=JSON.parse(text);
  if(!body||typeof body!=="object"||Array.isArray(body))throw Error("invalid");
 }catch{return err("Requisição inválida",400)}
 const action=body.action;
 if(action!=="quote"&&action!=="place"&&action!=="track")return err("Ação inválida",400);
 // Origem de rede é usada somente para limite temporal, SEM armazenar IP puro.
 const ip=req.headers.get("cf-connecting-ip")||
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"no-ip";
 try{
  const rateHash=await hmac("ip:"+action+":"+ip);
  const {data:ok,error:re}=await db.rpc("marketplace_rate_gate",{
   p_hash:rateHash,p_window_seconds:60,p_max:action==="quote"?35:action==="place"?8:60
  });
  if(re)return err("Verificação de segurança indisponível",503);
  if(!ok)return err("Muitas tentativas. Tente novamente em alguns minutos.",429);
  if(action==="track"){
   const token=clip(body.token,200);
   if(!/^[0-9a-f-]{36}\.[0-9a-f]{64}$/i.test(token))return err("Link de acompanhamento inválido",400);
   const tokenHash=await hash(token);
   const {data:key,error:te}=await db.from("online_order_tracking_tokens")
    .select("restaurant_id,order_id,expires_at,revoked_at")
    .eq("token_hash",tokenHash).is("revoked_at",null).gt("expires_at",new Date().toISOString()).maybeSingle();
   if(te)return err("Não foi possível consultar o pedido",503);
   if(!key)return err("Link de acompanhamento inválido ou expirado",404);
   const [{data:o,error:oe},{data:items,error:ie},{data:restaurant,error:rr}]=await Promise.all([
    db.from("online_orders").select("id,public_code,status,payment_status,fulfillment_type,subtotal_cents,delivery_fee_cents,total_cents,created_at,accepted_at,prepared_at,dispatched_at,fulfilled_at").eq("id",key.order_id).eq("restaurant_id",key.restaurant_id).maybeSingle(),
    db.from("online_order_items").select("product_name,quantity,line_total_cents,options_snapshot").eq("restaurant_id",key.restaurant_id).eq("order_id",key.order_id),
    db.from("restaurants").select("name,slug").eq("id",key.restaurant_id).maybeSingle()
   ]);
   if(oe||ie||rr||!o)return err("Não foi possível consultar o pedido",503);
   return answer({order:o,items:items??[],restaurant:restaurant??null});
  }
  const nameSlug=clip(body.slug,60);
  if(nameSlug.length<3||!slug.test(nameSlug))return err("Restaurante inválido",400);
  const {data:restaurant,error:rs}=await db.from("restaurants").select("id,slug").eq("slug",nameSlug).maybeSingle();
  if(rs)return err("Serviço indisponível",503);
  if(!restaurant)return err("Restaurante não encontrado",404);
  let payload:ReturnType<typeof parseOrder>;
  try{payload=parseOrder(body)}catch(e){return err(e instanceof Error?e.message:"Carrinho inválido",400)}
  const args={p_restaurant:restaurant.id,...payload};
  if(action==="quote"){
   const {data:quote,error:qe}=await db.rpc("marketplace_quote_order",args);
   if(qe)return err(safeFailure(qe),qe.code==="P0001"?422:503);
   return answer({quote,restaurant_slug:nameSlug});
  }
  if(body.accept_terms!==true)return err("Aceite os termos e a política de privacidade",400);
  if(typeof body.checkout_key!=="string"||!uuid.test(body.checkout_key))return err("Identificador de checkout inválido",400);
  const customerName=clip(body.customer_name,120),phone=clip(body.customer_phone,20).replace(/[^0-9]/g,"");
  const note=clip(body.customer_note,500),payment=clip(body.payment_method,32);
  if(customerName.length<2||customerName.length>120||phone.length<10||phone.length>13||note.length>500)
   return err("Confira nome, celular e observações",400);
  const {data:phoneAllow,error:pr}=await db.rpc("marketplace_rate_gate",{
   p_hash:await hmac("phone:"+phone),p_window_seconds:3600,p_max:6
  });
  if(pr)return err("Verificação de segurança indisponível",503);
  if(!phoneAllow)return err("Limite de pedidos para este telefone. Tente mais tarde.",429);
  // Token determinístico por chave única; idempotência evita duplicata também após timeout/retry.
  const token=body.checkout_key+"."+await hmac("order:"+restaurant.id+":"+body.checkout_key);
  const {data:order,error:oe}=await db.rpc("marketplace_place_order",{
   ...args,p_checkout_key:body.checkout_key,
   p_source:body.source==="marketplace"?"marketplace":"storefront",
   p_name:customerName,p_phone:phone,p_note:note,p_method:payment,
   p_track_hash:await hash(token),p_terms_version:"2026-11",p_marketing:body.marketing_opt_in===true
  });
  if(oe)return err(safeFailure(oe),oe.code==="P0001"?422:503);
  return answer({order,tracking_url:origin+"/intervalo/pedido/"+encodeURIComponent(token),
   tracking_token:token,checkout_available:true},order?.reused?200:201);
 }catch{
  return err("Não foi possível concluir a solicitação. Tente novamente.",503);
 }
});
