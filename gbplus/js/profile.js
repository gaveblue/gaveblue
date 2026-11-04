import {esc,icon} from './ui.js';
import {today} from './domain.js';

// Profile fields are attached to the signed-in user's Supabase Auth identity.
// Financial records and their revision are never mutated by these forms.
const val=(v)=>esc(String(v??''));
const profileOf=(user)=>user?.user_metadata?.gbplus_profile||{};
const digits=(s)=>String(s||'').replace(/\D/g,'');
export function formatCPF(raw){
 const d=digits(raw);
 if(d.length!==11)return raw||'';
 return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6,9)+'-'+d.slice(9);
}
export function profileView(user){
 if(!user)return '<section class="panel settings-card">Entre no GB+ para visualizar seu perfil.</section>';
 const p=profileOf(user),address=p.address||{};
 const fullName=p.full_name||user.user_metadata?.full_name||user.user_metadata?.name||'';
 const field=(label,name,value='',type='text',attrs='')=>
  '<label class="field"><span>'+label+'</span><input type="'+type+'" name="'+name+'" value="'+val(value)+'" '+attrs+'></label>';
 return '<div class="profile-layout">'+
  '<section class="panel profile-card">'+
   '<div class="profile-intro"><span class="profile-avatar">'+icon('user')+'</span><div><span class="eyebrow">PERFIL PESSOAL</span><h2>Suas informações</h2><p>Atualize os dados vinculados à sua conta GB+.</p></div></div>'+
   '<form id="profile-form" autocomplete="on">'+
    '<div class="profile-section-heading"><h3>Dados pessoais</h3><p>Preencha apenas as informações que deseja manter no perfil.</p></div>'+
    '<div class="profile-fields">'+
     field('Nome completo','full_name',fullName,'text','autocomplete="name" maxlength="120" required')+
     field('CPF','cpf',formatCPF(p.cpf||''),'text','inputmode="numeric" autocomplete="off" maxlength="14" placeholder="000.000.000-00"')+
     field('Data de nascimento','birth_date',p.birth_date||'','date','max="'+today()+'"')+
     field('Celular','phone',p.phone||'','tel','autocomplete="tel" inputmode="tel" maxlength="20" placeholder="(00) 00000-0000"')+
    '</div>'+
    '<div class="profile-section-heading"><h3>Endereço</h3><p>Dados para identificação e contato.</p></div>'+
    '<div class="profile-fields">'+
     field('CEP','postal_code',address.postal_code||'','text','inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000"')+
     field('Rua / logradouro','street',address.street||'','text','autocomplete="address-line1" maxlength="160"')+
     field('Número','number',address.number||'','text','maxlength="15"')+
     field('Complemento','complement',address.complement||'','text','autocomplete="address-line2" maxlength="100"')+
     field('Bairro','neighborhood',address.neighborhood||'','text','maxlength="100"')+
     field('Cidade','city',address.city||'','text','autocomplete="address-level2" maxlength="100"')+
     field('Estado (UF)','state',address.state||'','text','autocomplete="address-level1" maxlength="2" placeholder="ES"')+
    '</div>'+
    '<p class="profile-privacy">'+icon('info')+' CPF, nascimento e endereço são dados pessoais. Preencha somente se desejar cadastrá-los. Eles ficarão associados ao seu perfil de login, não aos lançamentos financeiros.</p>'+
    '<div class="profile-form-actions"><span id="profile-message" role="status" aria-live="polite"></span><button type="submit" class="button primary">'+icon('check')+' Salvar perfil</button></div>'+
   '</form>'+
  '</section>'+
  '<section class="panel profile-card profile-email-card">'+
   '<div class="profile-section-heading"><h3>E-mail da conta</h3><p>Alterar o e-mail pode exigir confirmação pelo endereço atual e pelo novo.</p></div>'+
   '<form id="profile-email-form">'+
    field('E-mail de acesso','email',user.email||'','email','autocomplete="email" inputmode="email" maxlength="254" required')+
    '<div class="profile-form-actions"><span id="profile-email-message" role="status" aria-live="polite"></span><button type="submit" class="button">'+icon('arrow')+' Solicitar alteração</button></div>'+
   '</form>'+
  '</section>'+
 '</div>';
}
export function validateProfile(form){
 const v=Object.fromEntries(new FormData(form));
 const full_name=String(v.full_name||'').trim().replace(/\s+/g,' ');
 const cpf=digits(v.cpf),phone=digits(v.phone),postal_code=digits(v.postal_code);
 const birth_date=String(v.birth_date||'').trim();
 const state=String(v.state||'').trim().toUpperCase();
 if(full_name.length<2||full_name.length>120)throw Error('Informe um nome com 2 a 120 caracteres.');
 if(cpf&&!validCPF(cpf))throw Error('CPF inválido. Confira os 11 dígitos.');
 if(phone&&(phone.length<10||phone.length>11))throw Error('Celular inválido. Use DDD e 8 ou 9 dígitos.');
 if(postal_code&&postal_code.length!==8)throw Error('CEP inválido. Informe 8 dígitos.');
 if(state&&!/^[A-Z]{2}$/.test(state))throw Error('Informe a sigla do estado com duas letras (ex.: ES).');
 if(birth_date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(birth_date))throw Error('Data de nascimento inválida.');
  const d=new Date(birth_date+'T12:00:00');
  if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==birth_date||birth_date>today())throw Error('A data de nascimento deve ser válida e não pode ser futura.');
 }
 return {
  full_name,cpf,birth_date,phone,
  address:{
   postal_code,street:String(v.street||'').trim().slice(0,160),
   number:String(v.number||'').trim().slice(0,15),
   complement:String(v.complement||'').trim().slice(0,100),
   neighborhood:String(v.neighborhood||'').trim().slice(0,100),
   city:String(v.city||'').trim().slice(0,100),
   state
  }
 };
}
export function validCPF(raw){
 const d=digits(raw);
 if(!/^\d{11}$/.test(d)||/^(\d)\1{10}$/.test(d))return false;
 for(let place=9;place<=10;place++){
  let sum=0;for(let i=0;i<place;i++)sum+=Number(d[i])*(place+1-i);
  let check=(sum*10)%11;if(check===10)check=0;
  if(check!==Number(d[place]))return false;
 }
 return true;
}
export function validateEmail(value){
 const email=String(value||'').trim().toLowerCase();
 if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Informe um e-mail válido.');
 return email;
}
