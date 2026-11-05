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

 if(/otp_expired|expired|expirad/.test(text))return 'Este link expirou ou já foi utilizado. Solicite um novo link de confirmação ou recuperação e abra-o no mesmo navegador.';
 if(/invalid_grant|invalid_token|token_invalid|flow_state_not_found|pkce|code_verifier|already_used|invalid_link/.test(text))return 'Este link é inválido, já foi usado ou foi aberto em outro navegador. Solicite um novo link e tente no mesmo navegador.';
 if(/access_denied|cancel|cancelado|canceled/.test(text))return 'O acesso com Google foi cancelado. Você pode tentar novamente ou entrar por e-mail.';
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

/** Classificação indicativa, sem exigir tipos específicos de caracteres. */
export function passwordStrength(value){
 const text=String(value||''),length=Array.from(text).length;
 if(!length)return {level:'empty',label:'',score:0};
 let score=Number(length>=8)+Number(length>=12)+Number(length>=16)+Number(length>=20);
 const types=[/[a-z]/.test(text),/[A-Z]/.test(text),/[0-9]/.test(text),/[^A-Za-z0-9]/u.test(text)].filter(Boolean).length;
 if(types>=2)score++;
 if(types>=3)score++;
 if(/(.)\1{3,}/u.test(text))score--;
 if(/^(?:12345678|123456789|abcdefgh|qwerty12|password|senha1234|11111111)$/i.test(text))score=0;
 score=Math.max(0,Math.min(5,score));
 const level=length<8||score<=1?'weak':score>=4?'strong':'medium';
 return {level,label:level==='strong'?'Forte':level==='medium'?'Razoável':'Fraca',score};
}
export function isExpiredSessionError(error){
 const code=String(error?.code||'').toLowerCase();
 return ['session_not_found','refresh_token_not_found','refresh_token_already_used','invalid_refresh_token','invalid_jwt','jwt_expired','token_expired','user_not_found'].includes(code);
}
