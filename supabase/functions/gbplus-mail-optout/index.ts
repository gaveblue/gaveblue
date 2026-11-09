import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
const ORIGIN='https://gaveblue.com.br';
Deno.serve(async req=>{
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type','X-Content-Type-Options':'nosniff'};
 const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 // GET never unsubscribes: automated link scanners must not modify preferences.
 if(req.method!=='POST')return reply(405,{error:'Confirme o descadastro pelo link recebido no e-mail.'});
 let token=new URL(req.url).searchParams.get('token');
 try{if(!token){const raw=await req.text();if(raw.length>200)return reply(400,{error:'Link inválido.'});token=JSON.parse(raw).token;}}
 catch{return reply(400,{error:'Link inválido.'});}
 if(typeof token!=='string'||!/^[a-f0-9-]{72}$/.test(token))return reply(400,{error:'Link inválido.'});
 try{
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  const admin=createClient(Deno.env.get('SUPABASE_URL'),Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.rpc('gbplus_unsubscribe',{p_hash:hash});
  if(error)throw error;
  return data?reply(200,{ok:true}):reply(400,{error:'Link inválido. Você também pode alterar a preferência nas Configurações do GB+.'});
 }catch{return reply(503,{error:'Não foi possível confirmar. Tente novamente.'});}
});
