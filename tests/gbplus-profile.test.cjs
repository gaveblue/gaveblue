'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const strip=s=>s.replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>'<svg data-icon="'+name+'"></svg>';
const funcs=new Function('esc','icon','today',strip(read('js/profile.js'))+';return {profileView,validateProfile};')(esc,icon,()=> '2026-11-04');
const mockUser={email:'exemplo@dominio.com',user_metadata:{gbplus_profile:{
 full_name:'Usuário Exemplo',cpf:'52998224725',phone:'27999998888',birth_date:'2000-10-10',
 address:{city:'Vila Velha',state:'ES'}
}}};

test('profile has minimal sections and locked identity fields',()=>{
 const html=funcs.profileView(mockUser);
 for(const value of ['Minha conta','Dados pessoais','Segurança da conta','Endereço','Bloqueado','Alterar senha','Excluir conta','Salvar alterações'])assert.ok(html.includes(value),value);
 assert.ok(html.includes('529.982.247-25'));
 assert.ok(html.includes('exemplo@dominio.com'));
 assert.ok(!html.includes('name="cpf"'));
 assert.ok(!html.includes('id="profile-email-form"'));
 assert.ok(html.includes('id="profile-save" class="gb-account-save" disabled'));
 assert.ok(html.includes('data-auth-action="signout"'));
});
test('profile renders safe user-provided values',()=>{
 const html=funcs.profileView({email:'example@example.com',user_metadata:{full_name:'<script>alert(1)</script>'}});
 assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('&lt;script&gt;'));
});
test('profile validation preserves server-loaded CPF, never reads editable form CPF',()=>{
 const app=read('js/app.js'),profile=read('js/profile.js');
 assert.ok(profile.includes('const cpf=digits(existingCpf)'));
 assert.ok(app.includes("const savedCpf=currentUser()?.user_metadata?.gbplus_profile?.cpf||'';"));
 assert.ok(app.includes('validateProfile(form,savedCpf)'));
});
test('save is enabled only when an editable profile field actually changes',()=>{
 const app=read('js/app.js');
 assert.ok(app.includes("submit.disabled=form.dataset.saving==='true'||form.dataset.initialSnapshot===profileSnapshot(form)"));
 assert.ok(app.includes('form.dataset.initialSnapshot=profileSnapshot(form)'));
 assert.ok(app.includes("e.target.form?.id==='profile-form'"));
 assert.ok(app.includes("if(form.id==='profile-form')"));
});
test('password change and request-only deletion remain available',()=>{
 const app=read('js/app.js');
 assert.ok(app.includes("'profile-change-password':"));
 assert.ok(app.includes('authClient().auth.resetPasswordForEmail'));
 assert.ok(app.includes("'settings-delete':"));
 assert.ok(app.includes('A exclusão automática ainda não está disponível'));
});
test('profile stylesheet uses a scoped design and release metadata',()=>{
 const css=read('profile-page.css'),index=read('index.html'),version=JSON.parse(read('version.json'));
 assert.ok(css.includes('.gb-account-card-heading'));
 assert.ok(css.includes('.gb-account-save:disabled'));
 assert.ok(index.includes('profile-page.css?v=20261104-35'));
 assert.ok(version.assets.includes('./profile-page.css'));
 assert.equal(version.version,'2.1.3');
});
