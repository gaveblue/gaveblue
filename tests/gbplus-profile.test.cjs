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
const funcs=new Function('esc','icon','today',strip(read('js/profile.js'))+';return {profileView,validateProfile,validCPF};')(esc,icon,()=> '2026-11-04');
const mockUser={email:'exemplo@dominio.com',user_metadata:{gbplus_profile:{
 full_name:'Usuário Exemplo',cpf:'52998224725',phone:'27999998888',birth_date:'2000-10-10',
 address:{city:'Vila Velha',state:'ES'}
}}};

test('profile has minimal sections and locked identity fields',()=>{
 const html=funcs.profileView(mockUser,{ready:true,cpf:'52998224725'});
 for(const value of ['Minha conta','Dados pessoais','Segurança da conta','Endereço','Bloqueado','Alterar senha','Sair da conta','Salvar alterações'])assert.ok(html.includes(value),value);
 assert.ok(html.includes('529.982.247-25'));
 assert.ok(html.includes('exemplo@dominio.com'));
 assert.ok(!html.includes('name="cpf"'));
 assert.ok(!html.includes('id="profile-email-form"'));
 assert.ok(html.includes('id="profile-save" class="gb-account-save" disabled hidden'));
 assert.ok(html.includes('data-action="profile-signout"'));
 assert.ok(!html.includes('Excluir conta'));
 assert.ok(html.indexOf('data-action="profile-signout"')>html.indexOf('</form>'));
 assert.ok(!html.slice(html.indexOf('Segurança da conta'),html.indexOf('</section>',html.indexOf('Segurança da conta'))).includes('signout'));
 assert.ok(html.includes('M21 12H9'));
 assert.ok(!html.includes('Voltar às configurações'));
 assert.ok(html.indexOf('Dados pessoais')<html.indexOf('Visualizar ou atualizar dados de endereço'));
 assert.ok(html.indexOf('Visualizar ou atualizar dados de endereço')<html.indexOf('Segurança da conta'));
 assert.ok(html.indexOf('Segurança da conta')<html.indexOf('Salvar alterações'));
 assert.ok(html.indexOf('name="city"')<html.indexOf('</form>'));
});
test('profile renders safe user-provided values',()=>{
 const html=funcs.profileView({email:'example@example.com',user_metadata:{full_name:'<script>alert(1)</script>'}},{ready:true,cpf:''});
 assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('&lt;script&gt;'));
});
test('CPF is editable only for the first registration and locked afterwards',()=>{
 const user={email:'example@example.com',user_metadata:{full_name:'Exemplo'}};
 const first=funcs.profileView(user,{ready:true,cpf:''});
 const existing=funcs.profileView(user,{ready:true,cpf:'52998224725'});
 const pending=funcs.profileView(user,{ready:false,cpf:''});
 assert.ok(first.includes('name="cpf"'));
 assert.ok(first.includes('000.000.000-00'));
 assert.ok(!existing.includes('name="cpf"'));
 assert.ok(existing.includes('Bloqueado'));
 assert.ok(!pending.includes('name="cpf"'));
 assert.ok(pending.includes('Verificando cadastro'));
 assert.ok(existing.indexOf('Visualizar ou atualizar dados de endereço')<existing.indexOf('Segurança da conta'));
 assert.ok(existing.indexOf('Segurança da conta')<existing.indexOf('Salvar alterações'));
 assert.ok(!existing.includes('gb-account-bottom'));
 assert.ok(existing.includes('Sair da conta'));
 assert.ok(!existing.includes('Voltar às configurações'));
});
test('CPF validation accepts valid digits, rejects repeated numbers and wrong digits',()=>{
 assert.ok(funcs.validCPF('529.982.247-25'));
 assert.ok(!funcs.validCPF('111.111.111-11'));
 assert.ok(!funcs.validCPF('529.982.247-26'));
 const app=read('js/app.js');
 assert.ok(app.includes('validateProfile(form,savedCpf)'));
 assert.ok(app.includes("from('gbplus_profiles').insert("));
 assert.ok(app.includes("from('gbplus_profiles').select('cpf')"));
 assert.ok(app.includes("error.code==='23505'"));
});
test('save is enabled only when an editable profile field actually changes',()=>{
 const app=read('js/app.js');
 assert.ok(app.includes("const available=form.dataset.saving!=='true'&&form.dataset.initialSnapshot!==profileSnapshot(form)"));
 assert.ok(app.includes('submit.disabled=!available;submit.hidden=!available'));
 assert.ok(app.includes('area.hidden=!available'));
 assert.ok(app.includes("if(['phone','cpf','postal_code'].includes(key))"));
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
 assert.ok(css.includes('compact profile with a coherent sequence'));
 assert.ok(css.includes('.gb-account-address{margin:0 0 12px'));
 assert.ok(css.includes('.gb-account-field{min-height:60px'));
 assert.ok(index.includes('profile-page.css?v=20261105-60'));
 assert.ok(css.includes('.gb-account-logout'));
 assert.ok(version.assets.includes('./profile-page.css'));
 assert.equal(version.version,'2.4.5');
});

test('logout requires confirmation and protects unsaved profile changes',()=>{
 const app=read('js/app.js'),auth=read('js/auth.js'),css=read('profile-page.css');
 assert.ok(app.includes("'profile-signout':()=>{"));
 assert.ok(app.includes("form.dataset.initialSnapshot!==profileSnapshot(form)"));
 assert.ok(app.includes('Você tem alterações não salvas em Minha conta'));
 assert.ok(app.includes('Deseja sair da sua conta?'));
 assert.ok(app.includes("button('Continuar no GB+','close')"));
 assert.ok(app.includes('data-action="confirm"'));
 assert.ok(auth.includes("export async function signOutAccount()"));
 assert.ok(auth.includes("signOut({scope:'local'})"));
 assert.ok(auth.includes("location.replace('./?web=1')"));
 assert.ok(css.includes('.gb-logout-dialog-actions'));
 assert.ok(css.includes('.gb-logout-confirm-button'));
});
