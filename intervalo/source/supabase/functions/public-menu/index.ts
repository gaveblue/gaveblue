import {createClient} from "npm:@supabase/supabase-js@2.50.0";
const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const headers={"Access-Control-Allow-Origin":"https://gaveblue.com.br","Access-Control-Allow-Headers":"apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"public, max-age=30","Vary":"Origin"};
const reply=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST")return reply({error:"Método não permitido"},405);
 if(req.headers.get("Origin")&&req.headers.get("Origin")!=="https://gaveblue.com.br")return reply({error:"Origem não permitida"},403);
 if(!url||!key)return reply({error:"Serviço indisponível"},503);
 let body:Record<string,unknown>;
 try{body=await req.json();}catch{return reply({error:"Requisição inválida"},400)}
 const slug=typeof body?.slug==="string"?body.slug.trim():"";
 if(slug.length<3||slug.length>60||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return reply({published:false},404);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:r,error:re}=await db.from("restaurants").select("id,name,status,slug").eq("slug",slug).maybeSingle();
 if(re||!r||r.status!=="active")return reply({published:false},404);
 const [{data:state,error:se},{data:mod,error:me}]=await Promise.all([
 db.from("restaurant_publication").select("is_published").eq("restaurant_id",r.id).maybeSingle(),
 db.from("restaurant_modules").select("enabled").eq("restaurant_id",r.id).eq("module","cardapio").maybeSingle()
 ]);
 if(se||me||!state?.is_published||!mod?.enabled)return reply({published:false},404);
 const [categories,products,options]=await Promise.all([
 db.from("menu_categories").select("id,name,sort_order").eq("restaurant_id",r.id).eq("active",true).order("sort_order"),
 db.from("menu_products").select("id,category_id,name,description,price_cents,sort_order").eq("restaurant_id",r.id).eq("available",true).order("sort_order"),
 db.from("menu_product_options").select("product_id,name,price_delta_cents").eq("restaurant_id",r.id).eq("available",true).order("sort_order")
 ]);
 if(categories.error||products.error||options.error)return reply({error:"Não foi possível carregar cardápio"},503);
 const allowed=new Set((categories.data??[]).map(c=>c.id));
 const safeProducts=(products.data??[]).filter(x=>allowed.has(x.category_id));
 return reply({published:true,restaurant:{name:r.name,slug:r.slug},categories:categories.data,products:safeProducts,options:(options.data??[]).filter(o=>safeProducts.some(p=>p.id===o.product_id)),customer_orders_enabled:false});
});