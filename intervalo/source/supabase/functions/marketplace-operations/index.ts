import {createClient} from "npm:@supabase/supabase-js@2.50.0";
const origin="https://gaveblue.com.br";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-retry-count,traceparent,tracestate,baggage","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const answer=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const fail=(message:string,status=400)=>answer({error:message},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{4}[0-9a-f]{8}$/i;
const project=Deno.env.get("SUPABASE_URL")??"",secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const db=createClient(project,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const roleModules:Record<string,string[]>={master:["gestao","cozinha","caixa"],manager:["gestao","cozinha","caixa"],kitchen:["cozinha"],cashier:["caixa"]};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return fail("Método não permitido",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return fail("Origem não permitida",403);
 if(!project||!secret)return fail("Serviço indisponível",503);
 const token=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return fail("Faça login",401);
 const {data:{user},error:ue}=await db.auth.getUser(token);
 if(ue||!user||user.is_anonymous||!user.email_confirmed_at)return fail("Sessão inválida",401);
 if(user.app_metadata?.intervalo_password_change_required)return fail("Troque a senha provisória",403);
 let body:Record<string,unknown>;
 try{const s=await req.text();if(s.length>5500)throw Error();body=JSON.parse(s);if(!body||Array.isArray(body)||typeof body!=="object")throw Error()}
 catch{return fail("Dados inválidos",400)}
 const restaurant_id=body.restaurant_id,action=body.action;
 if(typeof restaurant_id!=="string"||!uuid.test(restaurant_id))return fail("Restaurante inválido",400);
 if(!["list","kitchen_queue","cash_list","cash_detail","transition","accept_manual_pix","pay","overview"].includes(String(action)))return fail("Ação inválida");
 const {data:r,error:re}=await db.from("restaurants").select("id,status").eq("id",restaurant_id).maybeSingle();
 const {data:member,error:me}=await db.from("restaurant_members").select("role,status").eq("restaurant_id",restaurant_id).eq("user_id",user.id).maybeSingle();
 if(re||me)return fail("Falha ao validar acesso",503);
 if(r?.status!=="active"||member?.status!=="active")return fail("Sem acesso a este restaurante",403);
 const target=body.target;
 const required=action==="kitchen_queue"||(action==="transition"&&["preparing","ready","ready_for_pickup"].includes(String(target)))?"cozinha":
  action==="cash_list"||action==="cash_detail"||action==="pay"?"caixa":"gestao";
 const role=member.role;
 if(!(roleModules[role]??[]).includes(required))return fail("Sem permissão para esta operação",403);
 const [{data:module,error:modError},{data:override,error:accessError}]=await Promise.all([
  db.from("restaurant_modules").select("enabled").eq("restaurant_id",restaurant_id).eq("module",required).maybeSingle(),
  db.from("restaurant_member_module_access").select("allowed").eq("restaurant_id",restaurant_id).eq("user_id",user.id).eq("module",required).maybeSingle()
 ]);
 if(modError||accessError)return fail("Falha ao verificar permissões",503);
 if(!module?.enabled||override?.allowed===false)return fail("Módulo não habilitado",403);
 const oid=body.order_id;
 if(["transition","pay","accept_manual_pix","cash_detail"].includes(String(action))&&(typeof oid!=="string"||!uuid.test(oid)))return fail("Pedido inválido");
 try{
  if(action==="transition"){
   if(typeof target!=="string"||!["accepted","rejected","cancelled","preparing","ready","ready_for_pickup","out_for_delivery","delivered","picked_up"].includes(target))return fail("Status inválido");
   const {data,error}=await db.rpc("marketplace_transition_order",{
    p_restaurant:restaurant_id,p_order:oid,p_target:target,p_actor:user.id});
   if(error)return fail(error.code==="P0001"?error.message:"Não foi possível atualizar pedido",error.code==="P0001"?422:503);
   return answer(data);
  }
  if(action==="accept_manual_pix"){
   const {data,error}=await db.rpc("marketplace_accept_manual_pix",{p_restaurant:restaurant_id,p_order:oid,p_actor:user.id});
   if(error)return fail(error.message?.slice(0,160)||"Não foi possível conferir o Pix",422);
   return answer(data);
  }
  if(action==="pay"){
   if(!["cash","pix","card"].includes(String(body.method)))return fail("Método inválido");
   const {data,error}=await db.rpc("marketplace_confirm_payment",{
    p_restaurant:restaurant_id,p_order:oid,p_actor:user.id,p_method:body.method});
   if(error)return fail(error.code==="P0001"?error.message:"Falha ao registrar pagamento",error.code==="P0001"?422:503);
   return answer(data);
  }
  if(action==="cash_detail"){
   const [o,i,p]=await Promise.all([
    db.from("online_orders").select("id,public_code,customer_name,customer_phone,delivery_address,customer_note,source,fulfillment_type,status,payment_status,payment_method,subtotal_cents,delivery_fee_cents,discount_cents,total_cents,created_at,accepted_at,prepared_at,dispatched_at,fulfilled_at,updated_at").eq("restaurant_id",restaurant_id).eq("id",oid).maybeSingle(),
    db.from("online_order_items").select("product_name,quantity,unit_price_cents,options_unit_cents,options_snapshot,line_total_cents,note").eq("restaurant_id",restaurant_id).eq("order_id",oid).limit(500),
    db.from("online_order_payments").select("id,amount_cents,method,confirmed_at,status").eq("restaurant_id",restaurant_id).eq("order_id",oid).eq("status","confirmed").limit(500)
   ]);
   if(o.error||i.error||p.error)return fail("Falha ao consultar detalhes do pedido",503);
   if(!o.data)return fail("Pedido não encontrado",404);
   if((i.data??[]).length>=500||(p.data??[]).length>=500)return fail("Pedido excede o limite de conferência",422);
   return answer({order:o.data,items:i.data??[],payments:p.data??[]});
  }
  await db.rpc("marketplace_expire_manual_pix");
  const limit=action==="kitchen_queue"?180:100;
  const selection=action==="list"?
   "id,public_code,customer_name,customer_phone,delivery_address,customer_note,source,fulfillment_type,status,payment_status,payment_method,subtotal_cents,delivery_fee_cents,total_cents,created_at,accepted_at,prepared_at,dispatched_at,fulfilled_at,updated_at":
   action==="kitchen_queue"?
   "id,public_code,fulfillment_type,status,created_at,accepted_at,prepared_at,updated_at":
   "id,public_code,fulfillment_type,status,payment_status,payment_method,total_cents,created_at,updated_at";
  const query=db.from("online_orders").select(selection).eq("restaurant_id",restaurant_id).order("created_at",{ascending:false}).limit(limit);
  if(action==="kitchen_queue")query.in("status",["accepted","preparing","ready","ready_for_pickup"]);
  const {data:orders,error:oe}=await query;
  if(oe)return fail("Falha ao buscar pedidos",503);
  const ids=(orders??[]).map((x:{id:string})=>x.id);
  let items:unknown[]=[];
  let preparing_since:Record<string,string>={};
  if(action==="kitchen_queue"){
   const pending=(orders??[]).filter((o:{status:string})=>o.status==="preparing").map((o:{id:string})=>o.id);
   if(pending.length){
    const {data,error}=await db.from("online_order_events").select("order_id,created_at").eq("restaurant_id",restaurant_id).eq("to_status","preparing").in("order_id",pending).order("created_at",{ascending:false}).limit(500);
    if(!error)for(const e of data??[])if(!preparing_since[e.order_id])preparing_since[e.order_id]=e.created_at;
   }
  }
  if(ids.length&&action!=="overview"&&action!=="cash_list"){
   const {data,error}=await db.from("online_order_items").select("order_id,product_name,quantity,note,unit_price_cents,options_unit_cents,options_snapshot,line_total_cents").eq("restaurant_id",restaurant_id).in("order_id",ids).limit(1200);
   if(error)return fail("Falha ao buscar itens",503);
   items=data??[];
  }
  if(action==="overview"){
   const ordersList=orders??[];
   const paid=ordersList.filter((x:{payment_status:string})=>x.payment_status==="paid");
   return answer({pending:ordersList.filter((x:{status:string})=>x.status==="pending_acceptance").length,
     preparing:ordersList.filter((x:{status:string})=>["accepted","preparing","ready","ready_for_pickup","out_for_delivery"].includes(x.status)).length,
     paid_total_cents:paid.reduce((a:number,x:{total_cents:number})=>a+Number(x.total_cents),0),recent_orders:ordersList.length});
  }
  if(action==="cash_list"){
   const {data:sessions}=await db.from("cash_sessions").select("id,status,opened_at").eq("restaurant_id",restaurant_id).eq("status","open").limit(1);
   const session=sessions?.[0]??null;
   let payments:unknown[]=[];
   if(session){
    const {data,error}=await db.from("online_order_payments").select("order_id,amount_cents,method,confirmed_at").eq("restaurant_id",restaurant_id).eq("cash_session_id",session.id).eq("status","confirmed");
    if(error)return fail("Falha ao consultar pagamentos",503);
    payments=data??[];
   }
   return answer({orders:orders??[],session,payments});
  }
  let manual_pix_charges:unknown[]=[];
  if(action==="list"&&ids.length){
   const {data:charges}=await db.from("online_manual_pix_charges").select("order_id,expires_at,reported_at,state").eq("restaurant_id",restaurant_id).in("order_id",ids);
   manual_pix_charges=charges??[];
  }
  return answer({orders:orders??[],items,manual_pix_charges,preparing_since});
 }catch{return fail("Serviço temporariamente indisponível",503)}
});
