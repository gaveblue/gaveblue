// Lightweight authentication UX helpers: no session tokens or user data are stored.
export const AUTH_CALLBACK_KEYS=['error','error_code','error_description'];
export function loginRedirectMessage(rawUrl){
 const url=new URL(rawUrl);
 let error=url.searchParams.get('error')||url.searchParams.get('error_code')||'';
 let description=url.searchParams.get('error_description')||'';
 if(!error&&/^#error(?:=|_code=)/.test(url.hash)){
  const fragment=new URLSearchParams(url.hash.slice(1));
  error=fragment.get('error')||fragment.get('error_code')||'';
  description=fragment.get('error_description')||'';
 }
 if(!error)return '';
 const text=(error+' '+description).toLowerCase();
 if(/access_denied|cancel|cancelado|canceled/.test(text))return 'O acesso com Google foi cancelado. Você pode tentar novamente ou entrar por e-mail.';
 if(/otp_expired|expired|invalid_grant|pkce|code_verifier/.test(text))return 'O link de acesso expirou ou foi aberto em outro navegador. Recomece no mesmo navegador em que solicitou o acesso.';
 if(/redirect_uri|redirect_to|unauthorized_client|provider/.test(text))return 'Não foi possível concluir o retorno do Google. A configuração de acesso precisa ser conferida.';
 return 'Não foi possível concluir a autenticação. Tente novamente ou utilize a recuperação de acesso.';
}
export function clearLoginErrorUrl(rawUrl){
 const url=new URL(rawUrl);
 const hasQueryError=AUTH_CALLBACK_KEYS.some(key=>url.searchParams.has(key));
 for(const key of AUTH_CALLBACK_KEYS)url.searchParams.delete(key);
 if(/^#error(?:=|_code=)/.test(url.hash))url.hash='';
 return {changed:hasQueryError||url.href!==rawUrl,url:url.toString()};
}
export function safeAuthEmail(value){
 return typeof value==='string'&&value.trim().length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
