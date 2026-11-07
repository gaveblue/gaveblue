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
  created_at: user.created_at, last_sign_in_at: user.last_sign_in_at || null,
  confirmed: Boolean(user.email_confirmed_at), suspended: suspended(user),
  admin: isAdmin(user), providers: (user.app_metadata?.providers || []).filter(p => ['email','google'].includes(p)),
});

export function createHandler(getAdmin, audit = event => console.info(JSON.stringify(event))) {
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
      if (Number(req.headers.get('content-length') || 0) > 2048) return respond(413,{error:'Solicitação muito grande.'});
      const raw = await req.text();
      if (new TextEncoder().encode(raw).length > 2048) return respond(413,{error:'Solicitação muito grande.'});
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
        return respond(200,{actor:safeUser(actor), users:result.data.users.map(safeUser), page,
          total:Number.isFinite(result.data.total) ? result.data.total : null,
          hasMore:result.data.nextPage != null ? Boolean(result.data.nextPage) : result.data.users.length === 50});
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

Deno.serve(createHandler(() => {
  const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw Error('Server configuration missing');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}));
