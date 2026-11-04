import {esc,icon} from './ui.js?v=20261104-35';
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
export function profileView(user,cpfStatus={ready:false,cpf:'',error:''}){
 if(!user)return '<section class="panel settings-card">Entre no GB+ para visualizar seu perfil.</section>';
 const p=profileOf(user),address=p.address||{};
 const fullName=p.full_name||user.user_metadata?.full_name||user.user_metadata?.name||'';
 const registeredCpf=cpfStatus.ready?cpfStatus.cpf||'':'';
 const accountField=(label,name,value='',type='text',attrs='')=>
  '<label class="gb-account-field gb-account-editable"><span class="gb-account-field-text"><span class="gb-account-field-caption">'+label+'</span><input name="'+name+'" type="'+type+'" value="'+val(value)+'" '+attrs+'></span><span class="gb-account-field-arrow">'+icon('chevron')+'</span></label>';
 const addressField=(label,name,value='',attrs='')=>
  '<label class="gb-account-address-field"><span>'+label+'</span><input name="'+name+'" type="text" value="'+val(value)+'" '+attrs+'></label>';
 const locked=(label,value)=>
  '<div class="gb-account-field gb-account-locked"><span class="gb-account-field-text"><span class="gb-account-field-caption">'+label+'</span><span class="gb-account-locked-value">'+val(value||'Não cadastrado')+'</span></span><span class="gb-account-lock-indicator">'+icon('lock')+'<span>Bloqueado</span></span></div>';
 return '<div class="gb-account-page">'+
  '<header class="gb-account-page-heading"><h1>Minha conta</h1></header>'+
  '<form id="profile-form" autocomplete="on">'+
   '<section class="gb-account-card" aria-labelledby="gb-account-personal-title">'+
    '<header class="gb-account-card-heading"><span class="gb-account-card-icon">'+icon('user')+'</span><div><h2 id="gb-account-personal-title">Dados pessoais</h2><p>Alguns dados sensíveis não podem ser editados nesta tela.</p></div></header>'+
    '<div class="gb-account-fields">'+
     accountField('Nome completo','full_name',fullName,'text','autocomplete="name" maxlength="120" required placeholder="Seu nome completo"')+
     accountField('Celular','phone',p.phone||'','tel','autocomplete="tel" inputmode="tel" maxlength="20" placeholder="(00) 00000-0000"')+
     accountField('Data de nascimento','birth_date',p.birth_date||'','date','max="'+today()+'"')+
     (cpfStatus.error?
       '<div class="gb-account-cpf-note" role="alert">Não foi possível consultar o CPF cadastrado. <button type="button" data-action="retry-profile-cpf">Tentar novamente</button></div>':
       !cpfStatus.ready?
       '<div class="gb-account-field gb-account-locked"><span class="gb-account-field-text"><span class="gb-account-field-caption">CPF</span><span class="gb-account-locked-value">Verificando cadastro…</span></span></div>':
       registeredCpf?
       locked('CPF',formatCPF(registeredCpf)):
       accountField('CPF','cpf','','text','inputmode="numeric" autocomplete="off" maxlength="14" placeholder="000.000.000-00" aria-describedby="gb-cpf-help gb-cpf-validation"')+
       '<p id="gb-cpf-help" class="gb-account-cpf-hint">Cadastre seu CPF uma única vez. Depois de salvo, não poderá ser alterado.</p>'+
       '<p id="gb-cpf-validation" class="gb-account-cpf-validation" aria-live="polite"></p>')+
    '</div>'+
   '</section>'+
   '<section class="gb-account-card" aria-labelledby="gb-account-security-title">'+
    '<header class="gb-account-card-heading"><span class="gb-account-card-icon">'+icon('shield')+'</span><div><h2 id="gb-account-security-title">Segurança da conta</h2></div></header>'+
    '<div class="gb-account-fields">'+
     locked('E-mail da conta',user.email||'')+
     '<button type="button" class="gb-account-action" data-action="profile-change-password">'+icon('key')+'<strong>Alterar senha</strong><span>'+icon('chevron')+'</span></button>'+
     '<button type="button" class="gb-account-action gb-account-action-danger" data-action="settings-delete">'+icon('trash')+'<strong>Excluir conta</strong></button>'+
    '</div>'+
   '</section>'+
   '<div class="gb-account-save-area"><span id="profile-message" role="status" aria-live="polite"></span><button type="submit" id="profile-save" class="gb-account-save" disabled>'+icon('check')+' Salvar alterações</button></div>'+
  '</form>'+
  '<details class="gb-account-address"><summary>'+icon('map-pin')+'<span><strong>Endereço</strong><small>Visualizar ou atualizar dados de endereço</small></span>'+icon('chevron')+'</summary>'+
    '<div class="gb-account-address-grid">'+
     addressField('CEP','postal_code',address.postal_code||'','inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000"')+
     addressField('Rua / logradouro','street',address.street||'','autocomplete="address-line1" maxlength="160"')+
     addressField('Número','number',address.number||'','maxlength="15"')+
     addressField('Complemento','complement',address.complement||'','autocomplete="address-line2" maxlength="100"')+
     addressField('Bairro','neighborhood',address.neighborhood||'','maxlength="100"')+
     addressField('Cidade','city',address.city||'','autocomplete="address-level2" maxlength="100"')+
     addressField('Estado (UF)','state',address.state||'','autocomplete="address-level1" maxlength="2" placeholder="ES"')+
    '</div>'+
   '</details>'+

  '<div class="gb-account-bottom"><button type="button" class="gb-account-signout" data-auth-action="signout">'+icon('arrow')+' Sair da conta</button><a href="#settings">'+icon('settings')+' Voltar às configurações</a></div>'+
 '</div>';
}
export function validateProfile(form,existingCpf=''){
 const v=Object.fromEntries(new FormData(form));
 const full_name=String(v.full_name||'').trim().replace(/\s+/g,' ');
 // Registered CPF is immutable; the form can only supply the initial CPF.
 const cpf=digits(existingCpf||v.cpf),phone=digits(v.phone),postal_code=digits(v.postal_code);
 if(existingCpf&&v.cpf&&digits(existingCpf)!==digits(v.cpf))throw Error('O CPF cadastrado não pode ser alterado.');
 if(!existingCpf&&v.cpf&&cpf.length!==11)throw Error('Informe um CPF com 11 dígitos.');
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
