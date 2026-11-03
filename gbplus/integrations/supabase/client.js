// Receives the official @supabase/supabase-js createClient function.
// Uses only the public browser key; authorization is enforced by the database.
export function createGbplusClient(createClient, config) {
  if (typeof createClient !== 'function') throw new Error('SDK oficial do Supabase não carregado.');
  let url;
  try { url = new URL(config.url); } catch { throw new Error('URL do projeto Supabase não configurada.'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
      || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new Error('Use a URL HTTPS do projeto Supabase.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey || '')) {
    throw new Error('Informe somente a chave pública publishable. Chaves secretas e service_role não são permitidas.');
  }
  return createClient(url.origin, config.publishableKey, {
    auth: {
      storageKey: 'gbplus-auth-v1',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
}
