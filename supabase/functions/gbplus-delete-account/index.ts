// GB+ 2.6.1 — delete ONLY the authenticated caller's own Auth account.
// Admin credentials remain exclusively in Supabase Edge Function environment.
// auth.users CASCADE removes gbplus_documents and gbplus_profiles for this user.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const allowedOrigins = new Set([
  'https://gaveblue.com.br',
  'https://www.gaveblue.com.br',
  'https://gaveblue.github.io',
]);
const MAX_BODY_BYTES = 1024;

function response(origin: string | null, code: number, data: Record<string, unknown>) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(JSON.stringify(data), { status: code, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (origin && !allowedOrigins.has(origin)) return response(origin, 403, { error: 'Origem não autorizada.' });
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'https://gaveblue.com.br',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
        'Access-Control-Max-Age': '600',
        'Cache-Control': 'no-store',
        'Vary': 'Origin',
      },
    });
  }
  if (req.method !== 'POST') return response(origin, 405, { error: 'Método não permitido.' });
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ') || header.length < 30) {
    return response(origin, 401, { error: 'Entre na sua conta antes de excluí-la.' });
  }
  if (!(req.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
    return response(origin, 415, { error: 'Formato de solicitação inválido.' });
  }
  if (Number(req.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return response(origin, 413, { error: 'Solicitação muito grande.' });
  }

  let body: { confirmation?: unknown; email?: unknown };
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return response(origin, 413, { error: 'Solicitação muito grande.' });
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
  } catch {
    return response(origin, 400, { error: 'Confira a confirmação de exclusão.' });
  }
  if (body.confirmation !== 'EXCLUIR' || typeof body.email !== 'string' || body.email.length > 254) {
    return response(origin, 400, { error: 'Confirmação inválida.' });
  }

  const url = Deno.env.get('SUPABASE_URL');
  // Supabase injects this secret into Edge Functions. Never embed in browser files.
  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  let currentKey: string | undefined;
  try {
    const namedSecrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    const value = namedSecrets?.default;
    if (typeof value === 'string') currentKey = Deno.env.get(value) || value;
  } catch { /* legacy env remains supported */ }
  const roleKey = legacyKey || currentKey;
  if (!url || !roleKey) {
    return response(origin, 503, { error: 'A exclusão automática está indisponível. Contate o suporte.' });
  }
  const admin = createClient(url, roleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = header.slice('Bearer '.length).trim();
  const { data: verified, error: authError } = await admin.auth.getUser(token);
  const user = verified?.user;
  if (authError || !user || !user.email) {
    return response(origin, 401, { error: 'Sua sessão não pôde ser validada. Entre novamente.' });
  }
  if (user.email.trim().toLowerCase() !== body.email.trim().toLowerCase()) {
    return response(origin, 400, { error: 'Informe o e-mail exato desta conta.' });
  }

  // Never accept a user_id supplied by the browser: the ID comes exclusively
  // from the JWT verified against Supabase Auth.
  try {
    const { error } = await admin.auth.admin.deleteUser(user.id, false);
    if (error) throw error;
    return response(origin, 200, { deleted: true });
  } catch {
    return response(origin, 500, {
      error: 'Não foi possível concluir a exclusão. Sua conta pode não ter sido excluída; confira seu acesso ou entre em contato com o suporte.',
    });
  }
});
