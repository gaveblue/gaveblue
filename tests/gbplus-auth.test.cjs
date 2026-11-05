'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus/js');
const load=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const helpers=new Function('URL','URLSearchParams',load('auth-flow.js')+';return {loginRedirectMessage,clearLoginErrorUrl,safeAuthEmail};')(URL,URLSearchParams);

test('Google cancellation produces a clear Portuguese explanation',()=>{
 const message=helpers.loginRedirectMessage('https://gaveblue.com.br/gbplus/?error=access_denied&error_description=User%20cancelled');
 assert.match(message,/cancelado/i);
});
test('PKCE/expired links produce a recovery instruction',()=>{
 const message=helpers.loginRedirectMessage('https://gaveblue.com.br/gbplus/?error=otp_expired');
 assert.match(message,/expirou/i);
});
test('Successful OAuth code stays intact; only errors are removed',()=>{
 const successful='https://gaveblue.com.br/gbplus/?code=token-to-exchange';
 assert.equal(helpers.loginRedirectMessage(successful),'');
 assert.equal(helpers.clearLoginErrorUrl(successful).url,successful);
 const error='https://gaveblue.com.br/gbplus/?error=access_denied&error_description=cancelled&foo=1';
 const result=helpers.clearLoginErrorUrl(error).url;
 assert.match(result,/foo=1/);
 assert.doesNotMatch(result,/error=/);
});
test('Email validation rejects malformed addresses',()=>{
 assert.equal(helpers.safeAuthEmail('financeiro@example.com'),true);
 assert.equal(helpers.safeAuthEmail('a@@b.com'),false);
 assert.equal(helpers.safeAuthEmail('a@b'),false);
});
test('Unconfirmed accounts can resend an email without a password prompt',()=>{
 const gate={
  hidden:true,innerHTML:'',
  querySelector:selector=>selector==='[name=email]'?{value:''}:null
 };
 const document={
  body:{classList:{add(){}}},
  querySelector:selector=>selector==='#auth-gate'?gate:null,
  addEventListener(){}
 };
 const auth=new Function('document','window','icon','esc','createGbplusClient','cloudConfig','loginRedirectMessage','clearLoginErrorUrl','safeAuthEmail',
  load('auth.js')+';return {showAuth};')(
   document,{},()=>'<i></i>',x=>String(x),()=>null,{},helpers.loginRedirectMessage,helpers.clearLoginErrorUrl,helpers.safeAuthEmail
  );
 auth.showAuth('confirm');
 assert.match(gate.innerHTML,/Reenviar confirmação/);
 assert.match(gate.innerHTML,/data-mode="confirm"/);
 assert.doesNotMatch(gate.innerHTML,/name="password"/);
 auth.showAuth('signin');
 assert.match(gate.innerHTML,/Continuar com o Google/);
});


test('welcome login and signup use shared visual identity and eight character passwords',()=>{
 const gate={hidden:true,innerHTML:'',querySelector:selector=>selector==='[name=email]'?{value:''}:null};
 const document={body:{classList:{add(){}}},querySelector:selector=>selector==='#auth-gate'?gate:null,addEventListener(){}};
 const auth=new Function('document','window','icon','esc','createGbplusClient','cloudConfig','loginRedirectMessage','clearLoginErrorUrl','safeAuthEmail',
  load('auth.js')+';return {showAuth,passwordMeetsMinimum};')(
   document,{},()=>'<i></i>',x=>String(x),()=>null,{},helpers.loginRedirectMessage,helpers.clearLoginErrorUrl,helpers.safeAuthEmail
  );
 auth.showAuth('signin');
 assert.match(gate.innerHTML,/Bem-vindo de volta/);
 assert.match(gate.innerHTML,/auth-story-preview/);
 assert.match(gate.innerHTML,/Voltar ao site/);
 assert.match(gate.innerHTML,/Cadastre-se gratuitamente/);
 auth.showAuth('signup');
 assert.match(gate.innerHTML,/Criar minha conta/);
 assert.match(gate.innerHTML,/name="confirmation"/);
 assert.match(gate.innerHTML,/Mínimo de 8 caracteres/);
 assert.match(gate.innerHTML,/sem combinação obrigatória/);
 assert.equal(auth.passwordMeetsMinimum('abcdefgh'),true);
 assert.equal(auth.passwordMeetsMinimum('12345678'),true);
 assert.equal(auth.passwordMeetsMinimum('!@#$%^&*'),true);
 assert.equal(auth.passwordMeetsMinimum('abc1234'),false);
 auth.showAuth('recovery');
 assert.match(gate.innerHTML,/name="confirmation"/);
 auth.showAuth('confirm');
 assert.doesNotMatch(gate.innerHTML,/name="password"/);
});
