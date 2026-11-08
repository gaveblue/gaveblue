// GB+ administrative API. Secrets stay in the Edge Function environment.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const ORIGIN = 'https://gaveblue.com.br';
const RETURN_URL = `${ORIGIN}/gbplus/`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isAdmin = user => user?.app_metadata?.gbplus_admin === true;
const suspended = user => Date.parse(user?.banned_until || '') > Date.now();
const safeUser = user => ({
  id: user.id, email: user.email || '',
  name: String(user.user_metadata?.gbplus_profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '').slice(0,120),
  phone: String(user.user_metadata?.gbplus_profile?.phone || '').slice(0,20),
  city: String(user.user_metadata?.gbplus_profile?.address?.city || '').slice(0,100),
  state: String(user.user_metadata?.gbplus_profile?.address?.state || '').slice(0,2),
  invited_at: user.invited_at || null,
  created_at: user.created_at, last_sign_in_at: user.last_sign_in_at || null,
  confirmed: Boolean(user.email_confirmed_at), suspended: suspended(user),
  admin: isAdmin(user), providers: (user.app_metadata?.providers || []).filter(p => ['email','google'].includes(p)),
});

const htmlEscape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sha256 = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const emailValid = value => typeof value==='string' && value.length<=254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);

export function createHandler(getAdmin, audit = event => console.info(JSON.stringify(event)), mailer = null) {
  return async function handle(req) {
    const origin = req.headers.get('origin');
    const headers = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store',
      'Vary':'Origin', 'X-Content-Type-Options':'nosniff',
      ...(origin === ORIGIN ? {'Access-Control-Allow-Origin':ORIGIN} : {}) };
    const respond = (status, body) => new Response(JSON.stringify(body), {status, headers});
    if (origin && origin !== ORIGIN) return respond(403,{error:'Origem não autorizada.'});
    if (req.method === 'OPTIONS') return new Response(null,{status:204,headers:{...headers,
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
      'Access-Control-Max-Age':'600'}});
    if (req.method !== 'POST') return respond(405,{error:'Método não permitido.'});
    const bearer = req.headers.get('authorization') || '';
    if (!/^Bearer \S+$/i.test(bearer)) return respond(401,{error:'Entre no GB+ para continuar.'});
    if (!(req.headers.get('content-type') || '').includes('application/json')) return respond(415,{error:'Formato inválido.'});
    let input;
    try {
      if (Number(req.headers.get('content-length') || 0) > 16000) return respond(413,{error:'Solicitação muito grande.'});
      const raw = await req.text();
      if (new TextEncoder().encode(raw).length > 16000) return respond(413,{error:'Solicitação muito grande.'});
      input = JSON.parse(raw);
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error();
    } catch { return respond(400,{error:'Solicitação inválida.'}); }
    let actor, action = input.action;
    try {
      const admin = getAdmin();
      // Validate the caller remotely on EVERY request. Never trust browser metadata
      // or a decoded JWT's old role claim, and never authorize by email address.
      const {data, error} = await admin.auth.getUser(bearer.slice(7));
      actor = data?.user;
      if (error || !actor) return respond(401,{error:'Sessão inválida. Entre novamente.'});
      if (!isAdmin(actor) || suspended(actor)) return respond(403,{error:'Esta conta não tem acesso administrativo.'});
      if (action === 'list') {
        const page = input.page ?? 1;
        if (!Number.isInteger(page) || page < 1 || page > 100000) return respond(400,{error:'Página inválida.'});
        const result = await admin.auth.admin.listUsers({page,perPage:50});
        if (result.error) throw result.error;
        const usage = await admin.rpc('gbplus_admin_usage',{p_users:result.data.users.map(u=>u.id)});
        if(usage.error)throw usage.error;
        const summaries = new Map((usage.data||[]).map(u=>[u.user_id,u]));
        return respond(200,{actor:safeUser(actor), users:result.data.users.map(u=>({...safeUser(u),usage:summaries.get(u.id)||null})), page,
          mail_ready:Boolean(mailer), daily_limit:30,
          total:Number.isFinite(result.data.total) ? result.data.total : null,
          hasMore:result.data.nextPage != null ? Boolean(result.data.nextPage) : result.data.users.length === 50});
      }
      if(action==='mail_history'){
        const result=await admin.rpc('gbplus_mail_history');
        if(result.error)throw result.error;
        return respond(200,{jobs:result.data});
      }
      if(action==='invite'){
        const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
        const name=typeof input.name==='string'?input.name.trim().replace(/\s+/g,' '):'';
        if(!emailValid(email)||name.length<2||name.length>120||!UUID.test(input.operation_id||''))return respond(400,{error:'Confira nome, e-mail e identificação do convite.'});
        const reserved=await admin.rpc('gbplus_reserve_mail',{p_id:input.operation_id,p_actor:actor.id,p_user:null,p_kind:'invite',p_recipient:email,p_subject:'Convite para o GB+',p_hash:await sha256(name)});
        if(reserved.error)return respond(429,{error:'Convite não enviado: confira o intervalo de 60 segundos, o limite de 30 envios em 24 horas ou use uma nova operação.'});
        if(!reserved.data.reserved)return respond(409,{error:'Este convite já foi processado. Consulte o histórico antes de enviar outro.'});
        let result;
        try{result=await admin.auth.admin.inviteUserByEmail(email,{data:{gbplus_profile:{full_name:name}},redirectTo:`${RETURN_URL}convite.html`});}
        catch{await admin.from('gbplus_mail_jobs').update({status:'unknown',updated_at:new Date().toISOString()}).eq('id',input.operation_id);return respond(502,{error:'Resultado do convite incerto. Confira o histórico e o provedor antes de repetir.'});}
        await admin.from('gbplus_mail_jobs').update({status:result.error?'failed':'accepted',user_id:result.data?.user?.id||null,updated_at:new Date().toISOString()}).eq('id',input.operation_id);
        if(result.error)return respond(400,{error:result.error.code==='email_exists'||result.error.code==='user_already_exists'?'Este e-mail já está cadastrado. Gerencie o perfil existente ou envie recuperação.':'O convite não foi confirmado pelo serviço. Confira se o e-mail já existe ou se o limite de envio foi atingido.'});
        audit({event:'gbplus_admin',actor:actor.id,target:result.data?.user?.id,action:'invite',outcome:'accepted'});
        return respond(200,{ok:true,status:'accepted'});
      }
      if(action==='send_email'){
        if(!mailer)return respond(503,{error:'O envio de mensagens ainda não foi configurado.'});
        if(!UUID.test(input.user_id||'')||!UUID.test(input.operation_id||'')||!['service','marketing'].includes(input.kind))return respond(400,{error:'Destinatário ou tipo de mensagem inválido.'});
        const subject=typeof input.subject==='string'?input.subject.trim():'',message=typeof input.message==='string'?input.message.trim():'';
        if(subject.length<3||subject.length>150||/[\r\n]/.test(subject)||message.length<10||message.length>5000)return respond(400,{error:'Use assunto de 3 a 150 caracteres e mensagem de 10 a 5.000 caracteres.'});
        const targetResult=await admin.auth.admin.getUserById(input.user_id),target=targetResult.data?.user;
        if(targetResult.error||!target?.email||!target.email_confirmed_at||suspended(target))return respond(409,{error:'O destinatário precisa ter e-mail confirmado e conta ativa.'});
        let unsubscribeUrl='',oneClickUrl='';
        if(input.kind==='marketing'){
          const pref=await admin.from('gbplus_email_preferences').select('marketing').eq('user_id',target.id).maybeSingle();
          if(pref.error)throw pref.error;
          if(pref.data?.marketing!==true)return respond(409,{error:'Este usuário não autorizou e-mails de marketing.'});
          const token=crypto.randomUUID()+crypto.randomUUID();
          const saved=await admin.from('gbplus_mail_unsubscribe').insert({token_hash:await sha256(token),user_id:target.id});
          if(saved.error)throw saved.error;
          unsubscribeUrl=`${RETURN_URL}email-preferencias.html#${token}`;
          oneClickUrl=`https://layrxmkosyqurpobzmku.supabase.co/functions/v1/gbplus-mail-optout?token=${token}`;
        }
        const reservation=await admin.rpc('gbplus_reserve_mail',{p_id:input.operation_id,p_actor:actor.id,p_user:target.id,p_kind:input.kind,p_recipient:target.email,p_subject:subject,p_hash:await sha256(message)});
        if(reservation.error)return respond(429,{error:'Envio não iniciado. Aguarde 60 segundos entre mensagens para o mesmo destinatário; o painel limita 30 envios em 24 horas.'});
        if(!reservation.data.reserved)return respond(409,{error:'Esta operação já foi processada. Consulte o histórico antes de reenviar.'});
        const footer=input.kind==='marketing'?`Você recebeu este e-mail porque autorizou novidades do GB+. Cancelar recebimento: ${unsubscribeUrl}`:'Mensagem de serviço do GB+. Suporte: contato@gaveblue.com.br';
        const payload={from:'GB+ Gestão Financeira <acesso@gbplus.gaveblue.com.br>',to:[target.email],reply_to:'contato@gaveblue.com.br',subject,
          text:`${message}\n\n${footer}`,
          html:`<div style="font:16px Arial,sans-serif;line-height:1.6;max-width:620px;margin:auto;padding:24px"><h2>GB+ Gestão Financeira</h2><div style="white-space:pre-wrap">${htmlEscape(message)}</div><hr><p style="font-size:12px">${input.kind==='marketing'?`Você autorizou novidades do GB+. <a href="${htmlEscape(unsubscribeUrl)}">Cancelar recebimento</a>.`:'Mensagem de serviço. <a href="mailto:contato@gaveblue.com.br">Fale com o suporte</a>.'}</p><p style="font-size:12px"><a href="${RETURN_URL}privacidade.html">Privacidade</a></p></div>`,
          ...(oneClickUrl?{headers:{'List-Unsubscribe':`<${oneClickUrl}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}}:{})};
        let result;
        try{result=await mailer(payload,input.operation_id);}
        catch{await admin.from('gbplus_mail_jobs').update({status:'unknown',updated_at:new Date().toISOString()}).eq('id',input.operation_id);return respond(502,{error:'Resposta do provedor incerta. Não reenvie sem conferir o histórico no Resend.'});}
        const status=result.ok?'accepted':result.uncertain?'unknown':'failed';
        const saved=await admin.from('gbplus_mail_jobs').update({status,provider_id:result.id||null,updated_at:new Date().toISOString()}).eq('id',input.operation_id);
        if(saved.error)return respond(502,{error:'O provedor respondeu, mas o histórico não pôde ser atualizado. Confira o Resend antes de repetir.'});
        if(!result.ok)return respond(502,{error:status==='unknown'?'Envio com resultado incerto. Confira o Resend antes de repetir.':'O provedor recusou a mensagem. Confira domínio, limite de envio e configuração.'});
        audit({event:'gbplus_admin',actor:actor.id,target:target.id,action:'send_email',outcome:'accepted'});
        return respond(200,{ok:true,status:'accepted'});
      }
      if (!['profile','suspend','reactivate','recovery'].includes(action)) return respond(400,{error:'Operação não permitida.'});
      if (typeof input.user_id !== 'string' || !UUID.test(input.user_id)) return respond(400,{error:'Usuário inválido.'});
      const targetResult = await admin.auth.admin.getUserById(input.user_id);
      if (targetResult.error || !targetResult.data?.user) return respond(404,{error:'Usuário não encontrado.'});
      const target = targetResult.data.user;
      if (['suspend','reactivate'].includes(action) && (isAdmin(target) || target.id === actor.id)) {
        return respond(409,{error:'O painel não altera o acesso de administradores.'});
      }
      let result;
      if (action === 'profile') {
        if (typeof input.name !== 'string' || typeof input.phone !== 'string') return respond(400,{error:'Informe nome e celular.'});
        const name = input.name.trim().replace(/\s+/g,' '), phone = input.phone.replace(/\D/g,'');
        if (name.length < 2 || name.length > 120 || (phone && !/^\d{10,11}$/.test(phone))) return respond(400,{error:'Confira o nome (2–120 caracteres) e o celular com DDD.'});
        // Only these two profile attributes are accepted. Never accept role,
        // password, email, CPF, financial document, or arbitrary metadata input.
        result = await admin.auth.admin.updateUserById(target.id,{user_metadata:{
          ...target.user_metadata, gbplus_profile:{...target.user_metadata?.gbplus_profile,full_name:name,phone}
        }});
      } else if (action === 'recovery') {
        if (!target.email || suspended(target)) return respond(409,{error:'Reative a conta antes de enviar a recuperação.'});
        result = await admin.auth.resetPasswordForEmail(target.email,{redirectTo:RETURN_URL});
      } else {
        result = await admin.auth.admin.updateUserById(target.id,{ban_duration:action === 'suspend' ? '876000h' : 'none'});
      }
      if (result.error) {
        if (result.error.status === 429) return respond(429,{error:'Limite de solicitações atingido. Aguarde antes de tentar novamente.'});
        throw result.error;
      }
      // No emails, passwords, tokens, profile contents or financial data in logs.
      audit({event:'gbplus_admin',actor:actor.id,target:target.id,action,outcome:'success'});
      return respond(200,{ok:true, user:result.data?.user ? safeUser(result.data.user) : null});
    } catch {
      if (actor?.id && isAdmin(actor)) audit({event:'gbplus_admin',actor:actor.id,action:String(action).slice(0,30),outcome:'error'});
      return respond(500,{error:'Não foi possível concluir. Atualize a lista e confira o resultado antes de repetir.'});
    }
  };
}

const resendKey=Deno.env.get('GBPLUS_RESEND_API_KEY');
Deno.serve(createHandler(() => {
  const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw Error('Server configuration missing');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
},undefined,resendKey?async(payload,id)=>{
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json','Idempotency-Key':`gbplus/${id}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
 const data=await response.json().catch(()=>({}));
 return {ok:response.ok&&Boolean(data.id),id:typeof data.id==='string'?data.id:null,uncertain:response.status>=500||response.ok&&!data.id};
}:null));
