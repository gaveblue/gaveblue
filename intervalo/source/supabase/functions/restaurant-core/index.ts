import {createClient} from "npm:@supabase/supabase-js@2.50.0";
const apiUrl=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const origin="https://gaveblue.com.br";
const headers={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const error=(reason:string,status=400)=>reply({error:reason},status);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const txt=(value:unknown,max=150)=>typeof value==="string"?value.trim().slice(0,max+1):"";
const integer=(value:unknown,min=0,max=10000000000)=>typeof value==="number"&&Number.isSafeInteger(value)&&value>=min&&value<=max?value:null;
const roles:Record<string,string[]>={master:["gestao","garcom","cozinha","caixa","cardapio"],manager:["gestao","garcom","cozinha","caixa","cardapio"],waiter:["garcom","cardapio"],kitchen:["cozinha","cardapio"],cashier:["caixa","cardapio"]};
const isId=(v:unknown)=>typeof v==="string"&&uuid.test(v);
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return error("Método inválido",405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!==origin)return error("Origem não autorizada",403);
 if(!apiUrl||!key)return error("Servidor indisponível",503);
 const token=req.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return error("Faça login",401);
 const db=createClient(apiUrl,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authErr}=await db.auth.getUser(token);
 if(authErr||!user||user.is_anonymous||!user.email_confirmed_at)return error("Sessão inválida ou não confirmada",401);
 let body:Record<string,unknown>;
 try{const s=await req.text();if(s.length>12000)throw Error("invalid");body=JSON.parse(s);if(!body||Array.isArray(body)||typeof body!=="object")throw Error("invalid")}
 catch{return error("Dados inválidos",400)}
 const tenant=body.restaurant_id;
 if(!isId(tenant))return error("Restaurante inválido",400);
 const action=txt(body.action,50);
 const {data:restaurant,error:re}=await db.from("restaurants").select("id,name,slug,status").eq("id",tenant).maybeSingle();
 if(re)return error("Falha ao verificar restaurante",503);
 if(!restaurant||restaurant.status!=="active")return error("Restaurante indisponível",404);
 const {data:member,error:me}=await db.from("restaurant_members").select("role,status").eq("restaurant_id",tenant).eq("user_id",user.id).maybeSingle();
 if(me)return error("Falha ao verificar credenciais",503);
 if(!member||member.status!=="active")return error("Você não participa deste restaurante",403);
 const [modRes,permissionRes]=await Promise.all([
  db.from("restaurant_modules").select("module,enabled").eq("restaurant_id",tenant),
  db.from("restaurant_member_module_access").select("module,allowed").eq("restaurant_id",tenant).eq("user_id",user.id)
 ]);
 if(modRes.error||permissionRes.error)return error("Falha ao verificar módulos",503);
 const modules=modRes.data??[],overrides=permissionRes.data??[];
 const allowed=(module:string)=>{
  if(!modules.some(m=>m.module===module&&m.enabled))return false;
  if(member.role==="master")return true;
  const custom=overrides.find(o=>o.module===module);
  return custom?custom.allowed:(roles[member.role]??[]).includes(module);
 };
 const manage=()=>allowed("gestao")&&["master","manager"].includes(member.role);
 const id=body.id;
 const fail=()=>error("Operação não autorizada",403);
 if(action==="catalog"){
  if(!manage()&&!allowed("garcom"))return fail();
  const [cs,ps,os,pub]=await Promise.all([
   db.from("menu_categories").select("id,name,sort_order,active").eq("restaurant_id",tenant).order("sort_order"),
   db.from("menu_products").select("id,category_id,name,description,price_cents,available,sort_order").eq("restaurant_id",tenant).order("sort_order"),
   db.from("menu_product_options").select("id,product_id,name,price_delta_cents,available").eq("restaurant_id",tenant),
   db.from("restaurant_publication").select("is_published,accepts_customer_orders").eq("restaurant_id",tenant).maybeSingle()
  ]);
  if(cs.error||ps.error||os.error||pub.error)return error("Não foi possível carregar cardápio",503);
  if(!manage()){
   const activeCats=new Set((cs.data??[]).filter(c=>c.active).map(c=>c.id));
   const products=(ps.data??[]).filter(item=>item.available&&activeCats.has(item.category_id));
   return reply({categories:(cs.data??[]).filter(c=>c.active),products,options:(os.data??[]).filter(o=>o.available&&products.some(p=>p.id===o.product_id)),publication:pub.data,can_edit:false});
  }
  return reply({categories:cs.data,products:ps.data,options:os.data,publication:pub.data,can_edit:true});
 }
 if(action==="category_create"||action==="category_update"){
  if(!manage())return fail();
  const name=txt(body.name,90),sort_order=integer(body.sort_order??0,0,99999);
  if(name.length<2||name.length>90||sort_order===null)return error("Categoria inválida");
  if(action==="category_update"){
   if(!isId(id)||typeof body.active!=="boolean")return error("Categoria inválida");
   const {data, error:e}=await db.from("menu_categories").update({name,sort_order,active:body.active}).eq("id",id).eq("restaurant_id",tenant).select("id").maybeSingle();
   if(e||!data)return error("Falha ao atualizar categoria",409);
  }else{
   const {error:e}=await db.from("menu_categories").insert({restaurant_id:tenant,name,sort_order});if(e)return error("Não foi possível criar categoria",409);
  }
  await db.from("audit_logs").insert({restaurant_id:tenant,actor_user_id:user.id,event:"catalog_category_saved",details:{action}});
  return reply({saved:true});
 }
 if(action==="product_create"||action==="product_update"){
  if(!manage())return fail();
  const name=txt(body.name,150),description=txt(body.description??"",1000),category_id=body.category_id;
  const price_cents=integer(body.price_cents,0,100000000),sort_order=integer(body.sort_order??0,0,99999);
  if(!isId(category_id)||name.length<2||name.length>150||description.length>1000||price_cents===null||sort_order===null||typeof body.available!=="boolean")return error("Dados do produto inválidos");
  const row={category_id,name,description,price_cents,sort_order,available:body.available,updated_at:new Date().toISOString()};
  if(action==="product_update"){
   if(!isId(id))return error("Produto inválido");
   const {data,error:e}=await db.from("menu_products").update(row).eq("id",id).eq("restaurant_id",tenant).select("id").maybeSingle();
   if(e||!data)return error("Produto não encontrado ou categoria inválida",409);
  }else{
   const {error:e}=await db.from("menu_products").insert({...row,restaurant_id:tenant});if(e)return error("Produto não criado; confira a categoria",409);
  }
  await db.from("audit_logs").insert({restaurant_id:tenant,actor_user_id:user.id,event:"catalog_product_saved",details:{action}});
  return reply({saved:true});
 }
 if(action==="option_create"){
  if(!manage())return fail();
  const name=txt(body.name,120),price=integer(body.price_delta_cents,0,10000000);
  if(!isId(body.product_id)||name.length<2||name.length>120||price===null)return error("Adicional inválido");
  const {error:e}=await db.from("menu_product_options").insert({restaurant_id:tenant,product_id:body.product_id,name,price_delta_cents:price});
  if(e)return error("Não foi possível criar adicional",409);
  return reply({saved:true});
 }
 if(action==="menu_publish"){
  if(!manage()||!allowed("cardapio"))return fail();
  if(typeof body.published!=="boolean")return error("Publicação inválida");
  if(body.published){
   const {data:ps,error:e}=await db.from("menu_products").select("id,category_id").eq("restaurant_id",tenant).eq("available",true);
   const {data:cs,error:ce}=await db.from("menu_categories").select("id").eq("restaurant_id",tenant).eq("active",true);
   if(e||ce)return error("Não foi possível verificar cardápio",503);
   const ids=new Set((cs??[]).map(c=>c.id));
   if(!(ps??[]).some(pr=>ids.has(pr.category_id)))return error("Adicione uma categoria e um produto disponíveis antes de publicar",400);
  }
  const {error:e}=await db.from("restaurant_publication").upsert({restaurant_id:tenant,is_published:body.published,accepts_customer_orders:false,updated_at:new Date().toISOString()});
  if(e)return error("Falha ao publicar cardápio",503);
  await db.from("audit_logs").insert({restaurant_id:tenant,actor_user_id:user.id,event:"menu_publication_changed",details:{published:body.published}});
  return reply({published:body.published});
 }
 if(action==="tables"){
  if(!manage()&&!allowed("garcom")&&!allowed("caixa"))return fail();
  const {data,error:e}=await db.from("restaurant_tables").select("id,label,area,seats,active").eq("restaurant_id",tenant).order("label");
  if(e)return error("Não foi possível consultar mesas",503);
  return reply({tables:manage()?data:(data??[]).filter(t=>t.active)});
 }
 if(action==="table_create"||action==="table_update"){
  if(!manage())return fail();
  const label=txt(body.label,45),area=txt(body.area??"Salão",60),seats=integer(body.seats??4,1,50);
  if(label.length<1||label.length>45||area.length<1||area.length>60||seats===null||typeof body.active!=="boolean")return error("Mesa inválida");
  if(action==="table_update"){
   if(!isId(id))return error("Mesa inválida");
   const {data,error:e}=await db.from("restaurant_tables").update({label,area,seats,active:body.active}).eq("restaurant_id",tenant).eq("id",id).select("id").maybeSingle();
   if(e||!data)return error("Não foi possível editar mesa (pode haver comanda ativa)",409);
  }else{
   const {error:e}=await db.from("restaurant_tables").insert({restaurant_id:tenant,label,area,seats,active:body.active});
   if(e)return error("Mesa já cadastrada ou dados inválidos",409);
  }
  await db.from("audit_logs").insert({restaurant_id:tenant,actor_user_id:user.id,event:"restaurant_table_saved",details:{action}});
  return reply({saved:true});
 }
 if(action==="orders"){
  if(!allowed("garcom")&&!allowed("cozinha")&&!allowed("caixa")&&!manage())return fail();
  const [orders,items,tables,payments]=await Promise.all([
   db.from("orders").select("id,table_id,status,note,opened_at,submitted_at,closed_at").eq("restaurant_id",tenant).order("opened_at",{ascending:false}).limit(120),
   db.from("order_items").select("id,order_id,product_name,unit_price_cents,quantity,note,status").eq("restaurant_id",tenant).order("created_at",{ascending:true}).limit(1200),
   db.from("restaurant_tables").select("id,label,area").eq("restaurant_id",tenant),
   db.from("payments").select("id,order_id,method,amount_cents,at").eq("restaurant_id",tenant).order("at",{ascending:false}).limit(1200)
  ]);
  if(orders.error||items.error||tables.error||payments.error)return error("Não foi possível carregar comandas",503);
  const idSet=new Set((orders.data??[]).map(o=>o.id));
  return reply({orders:orders.data,items:(items.data??[]).filter(i=>idSet.has(i.order_id)),tables:tables.data,payments:allowed("caixa")?(payments.data??[]).filter(x=>idSet.has(x.order_id)):[]});
 }
 const rpc:Record<string,{fn:string,fields:string[],module:string}> = {
  order_open:{fn:"intervalo_open_order",fields:["p_table"],module:"garcom"},
  item_add:{fn:"intervalo_add_order_item",fields:["p_order","p_product","p_quantity","p_note"],module:"garcom"},
  order_submit:{fn:"intervalo_submit_order",fields:["p_order"],module:"garcom"},
  order_progress:{fn:"intervalo_advance_order",fields:["p_order","p_next"],module:"cozinha"},
  cash_open:{fn:"intervalo_open_cash",fields:["p_start"],module:"caixa"},
  pay_manual:{fn:"intervalo_record_manual_payment",fields:["p_order","p_amount","p_method"],module:"caixa"},
  cash_close:{fn:"intervalo_close_cash",fields:["p_counted"],module:"caixa"}
 };
 if(rpc[action]){
  const op=rpc[action],next=body.p_next;
  const module=action==="order_progress"&&next==="served"?"garcom":op.module;
  if(!allowed(module))return fail();
  const args:Record<string,unknown>={p_restaurant:tenant,p_actor:user.id};
  if(op.fields.includes("p_table")){if(!isId(body.table_id))return error("Mesa inválida");args.p_table=body.table_id}
  if(op.fields.includes("p_order")){if(!isId(body.order_id))return error("Comanda inválida");args.p_order=body.order_id}
  if(op.fields.includes("p_product")){if(!isId(body.product_id))return error("Produto inválido");args.p_product=body.product_id}
  if(op.fields.includes("p_quantity")){const qty=integer(body.quantity,1,99);if(qty===null)return error("Quantidade inválida");args.p_quantity=qty}
  if(op.fields.includes("p_note")){const note=txt(body.note??"",350);if(note.length>350)return error("Observação inválida");args.p_note=note}
  if(op.fields.includes("p_next")){if(!["preparing","ready","served"].includes(String(next)))return error("Status inválido");args.p_next=next}
  if(op.fields.includes("p_start")){const n=integer(body.starting_cash_cents,0,10000000000);if(n===null)return error("Troco inicial inválido");args.p_start=n}
  if(op.fields.includes("p_amount")){const n=integer(body.amount_cents,1,10000000000);if(n===null)return error("Valor inválido");args.p_amount=n}
  if(op.fields.includes("p_method")){if(!["cash","debit_recorded","credit_recorded","pix_recorded","other_recorded"].includes(String(body.method)))return error("Forma inválida");args.p_method=body.method}
  if(op.fields.includes("p_counted")){const n=integer(body.counted_cash_cents,0,10000000000);if(n===null)return error("Contagem inválida");args.p_counted=n}
  const {data,error:e}=await db.rpc(op.fn,args);
  if(e)return error("Operação não concluída: "+(e.message??"Tente novamente").slice(0,180),409);
  return reply({success:true,result:data});
 }
 if(action==="cash_summary"){
  if(!allowed("caixa"))return fail();
  const [sessions,payments]=await Promise.all([
   db.from("cash_sessions").select("id,status,starting_cash_cents,counted_cash_cents,opened_at,closed_at").eq("restaurant_id",tenant).order("opened_at",{ascending:false}).limit(40),
   db.from("payments").select("cash_session_id,method,amount_cents").eq("restaurant_id",tenant).order("at",{ascending:false}).limit(1000)
  ]);
  if(sessions.error||payments.error)return error("Falha ao carregar caixa",503);
  return reply({sessions:sessions.data,payments:payments.data,manual_only:true});
 }
 if(action==="stock_list"){
  if(!manage())return fail();
  const [items,recipes,movements]=await Promise.all([
   db.from("stock_items").select("id,name,unit,quantity,min_quantity,active").eq("restaurant_id",tenant).order("name"),
   db.from("recipe_components").select("id,product_id,stock_item_id,quantity").eq("restaurant_id",tenant),
   db.from("stock_movements").select("id,stock_item_id,quantity_delta,reason,created_at").eq("restaurant_id",tenant).order("created_at",{ascending:false}).limit(100)
  ]);
  if(items.error||recipes.error||movements.error)return error("Falha ao consultar estoque",503);
  return reply({items:items.data,recipes:recipes.data,movements:movements.data,automatic_deduction:false});
 }
 if(action==="stock_create"){
  if(!manage())return fail();
  const name=txt(body.name,120),unit=txt(body.unit,3);
  const qty=body.quantity,minimum=body.min_quantity;
  if(name.length<2||name.length>120||!["un","kg","g","l","ml"].includes(unit)||typeof qty!=="number"||typeof minimum!=="number"||!Number.isFinite(qty)||!Number.isFinite(minimum)||qty<0||minimum<0||qty>10000000||minimum>10000000)return error("Insumo inválido");
  const {error:e}=await db.from("stock_items").insert({restaurant_id:tenant,name,unit,quantity:qty,min_quantity:minimum});
  if(e)return error("Não foi possível cadastrar insumo",409);
  return reply({saved:true});
 }
 if(action==="printers"){
  if(!manage())return fail();
  const [devices,jobs]=await Promise.all([
   db.from("printer_devices").select("id,display_name,station,connection_type,enabled").eq("restaurant_id",tenant),
   db.from("print_jobs").select("id,printer_id,status,attempts,created_at").eq("restaurant_id",tenant).order("created_at",{ascending:false}).limit(50)
  ]);
  if(devices.error||jobs.error)return error("Falha ao consultar impressão",503);
  return reply({devices:devices.data,jobs:jobs.data,hardware_agent_connected:false});
 }
 if(action==="printer_register"){
  if(!manage()||member.role!=="master")return fail();
  const name=txt(body.display_name,100),station=txt(body.station,12);
  if(name.length<2||name.length>100||!["cozinha","caixa","balcao"].includes(station))return error("Dispositivo inválido");
  const {error:e}=await db.from("printer_devices").insert({restaurant_id:tenant,display_name:name,station,enabled:false});
  if(e)return error("Não foi possível cadastrar dispositivo",409);
  return reply({saved:true,enabled:false});
 }
 if(action==="report"){
  if(!manage()&&!allowed("caixa"))return fail();
  const [orders,payments]=await Promise.all([
   db.from("orders").select("status,opened_at").eq("restaurant_id",tenant).order("opened_at",{ascending:false}).limit(500),
   db.from("payments").select("method,amount_cents,at").eq("restaurant_id",tenant).order("at",{ascending:false}).limit(1000)
  ]);
  if(orders.error||payments.error)return error("Falha ao consultar relatório",503);
  const counts:Record<string,number>={};for(const o of orders.data??[])counts[o.status]=(counts[o.status]??0)+1;
  const byMethod:Record<string,number>={};for(const x of payments.data??[])byMethod[x.method]=(byMethod[x.method]??0)+Number(x.amount_cents);
  return reply({orders_by_status:counts,recorded_receipts_cents:byMethod,partial_limit:{orders:500,payments:1000},not_fiscal:true});
 }
 return error("Ação não suportada",400);
});