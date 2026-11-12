// Intervalo 0.7.0 — Gestao de restaurante e equipe; apenas UI, servidor decide permissões.
export async function renderManagement({supabase,restaurant,role,box,esc,link}) {
 const modules=["gestao","garcom","cozinha","caixa","cardapio"];
 const labels={gestao:"Gestão",garcom:"Garçom",cozinha:"Cozinha",caixa:"Caixa",cardapio:"Cardápio"};
 const roles={master:"Master",manager:"Gerente",waiter:"Garçom",kitchen:"Cozinha",cashier:"Caixa"};
 const defaults={master:modules,manager:modules,waiter:["garcom","cardapio"],kitchen:["cozinha","cardapio"],cashier:["caixa","cardapio"]};
 let state={tab:"dados",data:null};
 const sty='<style>.mtabs{display:flex;gap:8px;overflow:auto;margin:23px 0}.mtabs button{border:1px solid #dbe2e8;background:white;padding:11px 16px;border-radius:10px;font-size:13px;font-weight:700;color:#334155;white-space:nowrap}.mtabs button.selected{color:white;background:#0f766e;border-color:#0f766e}.mg{display:grid;grid-template-columns:1fr 1fr;gap:14px}.mg .full{grid-column:1/-1}.mg label{display:block;font-size:12px;font-weight:700;color:#475569;margin-bottom:7px}.mg input,.mg select{padding:11px;width:100%;border:1px solid #cbd5e1;border-radius:9px;background:white;color:#0f172a}.mg input:focus,.mg select:focus{outline:2px solid #99f6e4}.team-card{background:#fff;border:1px solid #dce4ec;border-radius:13px;padding:17px;margin:12px 0}.team-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}.team-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:13px}.team-actions select{border-radius:8px;padding:9px;border:1px solid #cbd5e1}.smallbtn{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:8px;padding:9px 12px;font-weight:700;font-size:12px}.smallbtn.danger{color:#b91c1c;border-color:#fecaca}.status{font-size:11px;border-radius:50px;background:#f1f5f9;padding:6px 10px;font-weight:750;color:#475569}.pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:10px}.pitem{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:13px}.pitem strong{display:block;margin:0 0 8px}.pitem span{font-size:12px;color:#64748b}.pitem button{margin-top:9px}.onboarding-note{font-size:13px;padding:12px;background:#ecfdf5;border:1px solid #ccfbf1;border-radius:10px;color:#115e59}.muted-sm{font-size:12px;color:#64748b;line-height:1.6}@media(max-width:650px){.mg{grid-template-columns:1fr}.mg .full{grid-column:auto}.team-actions{align-items:stretch}}</style>';
 function showTemporaryPassword(temp,email){
  const dlg=document.createElement('dialog');
  dlg.style.cssText='border:1px solid #cbd5e1;border-radius:14px;padding:23px;max-width:460px;width:calc(100% - 30px)';
  const heading=document.createElement('h2');heading.textContent='Funcionário cadastrado';
  const info=document.createElement('p');info.className='muted-sm';info.textContent='Conta '+email+'. Entregue esta senha provisória pessoalmente ou por canal privado. Ela não ficará disponível após fechar.';
  const value=document.createElement('input');value.readOnly=true;value.value=temp;value.style.cssText='padding:12px;width:100%;border:1px solid #cbd5e1;border-radius:8px';
  const copy=document.createElement('button');copy.className='smallbtn';copy.type='button';copy.textContent='Copiar senha';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(value.value);copy.textContent='Senha copiada'}catch{value.select();copy.textContent='Selecione e copie'}};
  const close=document.createElement('button');close.className='smallbtn';close.type='button';close.style.marginLeft='8px';close.textContent='Fechar';close.onclick=()=>dlg.close();
  dlg.onclose=()=>{value.value='';dlg.remove()};
  dlg.append(heading,info,value,copy,close);document.body.append(dlg);dlg.showModal();
 }
 function message(text,type="success"){const el=document.getElementById("mg-message");if(el){el.className=type==="error"?"error":"notice";el.textContent=text;el.scrollIntoView({block:"nearest"});}}
 async function call(action,values={}){
   const {data,error}=await supabase.functions.invoke("restaurant-team",{body:{restaurant_id:restaurant.id,action,...values}});
   if(error){let reason=error.message??"Erro ao comunicar com o servidor";try{const v=await error.context?.json?.();reason=v?.error??reason;}catch{}throw Error(reason)}
   if(data?.error)throw Error(data.error);
   return data;
 }
 async function refresh(){state.data=await call("list");draw();}
 const value=(x)=>esc(x??"");
 const input=(label,name,val,more="")=>'<div><label for="m-'+name+'">'+label+'</label><input id="m-'+name+'" name="'+name+'" value="'+value(val)+'" '+more+'></div>';
 function draw(){
   const d=state.data;if(!d)return;
   const s=d.settings??{},isMaster=d.actor_role==="master",isManager=d.actor_role==="manager";
   const note=s.onboarding_completed_at?"Cadastro inicial concluído. Você pode atualizar os dados abaixo.":"Preencha telefone, cidade e UF para concluir o cadastro inicial do restaurante.";
   const tabs=[["dados","Dados do restaurante"],["equipe","Equipe"],["acessos","Permissões"]];
   const quickModules=[["catalogo","Cardápio","gestao"],["mesas","Mesas","gestao"],["garcom","Garçom","garcom"],["cozinha","Cozinha","cozinha"],["caixa","Caixa","caixa"],["estoque","Estoque","gestao"],["impressao","Impressão","gestao"],["relatorios","Relatórios","gestao"]];
   const accessible=quickModules.filter(([path,label,required])=>(d.enabled??[]).some(m=>m.module===required&&m.enabled));
   const quickLinks='<style>.manage-modules{display:flex;gap:9px;flex-wrap:wrap;margin:8px 0 20px}.manage-modules a{padding:10px 13px;border-radius:9px;background:#f0fdfa;border:1px solid #ccfbf1;color:#0f766e;font-weight:700;font-size:12px}</style><h2>Operação</h2><div class="manage-modules">'+accessible.map(([path,label])=>'<a href="'+link("/"+d.restaurant.slug+"/"+path)+'">'+label+'</a>').join("")+'</div>';
   const viewHead=sty+'<div class="eyebrow">PAINEL DO RESTAURANTE</div><h1 style="margin-bottom:4px">'+value(d.restaurant.name)+'</h1><p class="muted">/'+value(d.restaurant.slug)+' · '+value(roles[d.actor_role]??d.actor_role)+'</p><a class="smallbtn" style="display:inline-block" href="'+link("/inicio")+'">← Trocar restaurante</a><nav aria-label="Áreas de gestão" class="mtabs">'+tabs.filter(x=>x[0]!=="acessos"||isMaster).map(([tab,label])=>'<button type="button" data-tab="'+tab+'" class="'+(tab===state.tab?"selected":"")+'">'+label+'</button>').join("")+'</nav>'+quickLinks+'<div id="mg-message" role="status" aria-live="polite"></div>';
   let inner="";
   if(state.tab==="dados"){
     inner='<section class="panel"><h2>Informações do estabelecimento</h2><p class="onboarding-note">'+note+'</p><form id="restaurant-settings" class="mg">'+input("Telefone","phone",s.phone,'inputmode="tel" maxlength="30"')+input("CEP (somente números)","postal_code",s.postal_code,'inputmode="numeric" maxlength="8"')+input("Rua / Avenida","street",s.street,'maxlength="150"')+input("Número","address_number",s.address_number,'maxlength="30"')+input("Bairro","neighborhood",s.neighborhood,'maxlength="100"')+input("Cidade","city",s.city,'maxlength="120"')+input("UF","state",s.state,'maxlength="2" style="text-transform:uppercase"')+'<div><label for="m-timezone">Fuso horário</label><select id="m-timezone" name="timezone">'+["America/Sao_Paulo","America/Manaus","America/Cuiaba","America/Rio_Branco","America/Belem","America/Fortaleza","America/Recife","America/Noronha"].map(t=>'<option value="'+t+'" '+((s.timezone??"America/Sao_Paulo")===t?"selected":"")+'>'+t.replace("America/","")+'</option>').join("")+'</select></div><div class="full team-actions"><button class="btn" type="submit">Salvar dados</button>'+(!s.onboarding_completed_at?'<button class="btn alt" name="finish" type="button" id="mg-finish">Concluir cadastro</button>':'')+'</div></form><p class="muted-sm">Cadastros e alterações ficam vinculados ao estabelecimento e registrados para auditoria.</p></section>';
   }else if(state.tab==="equipe"){
     const options=(isMaster?["manager","waiter","kitchen","cashier"]:["waiter","kitchen","cashier"]);
     inner=(isMaster?'<section class="panel"><h2>Criar funcionário com senha provisória</h2><p class="muted-sm">O Master cadastra sua equipe sem depender de confirmação de e-mail. A senha precisa ser trocada no primeiro acesso. O endereço informado é liberado administrativamente, mas a titularidade do e-mail não é verificada.</p><form id="manual-staff" class="mg">'
      +input("Nome","display_name","",'required minlength="2" maxlength="100"')
      +input("E-mail de login","email","",'required type="email" autocomplete="off"')
      +'<div><label>Função</label><select name="role"><option value="manager">Gerente</option><option value="waiter">Garçom</option><option value="kitchen">Cozinha</option><option value="cashier">Caixa</option></select></div>'
      +'<div><label>Senha provisória</label><input name="temporary_password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div>'
      +'<div><label>Repita a senha provisória</label><input name="repeat_password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div>'
      +'<div><label>Sua senha atual de Master</label><input name="current_password" type="password" autocomplete="current-password" required></div>'
      +'<div class="full"><button class="btn" type="submit">Cadastrar funcionário</button></div></form></section>':'')
      +'<section class="panel"><h2>Vincular funcionário que já tem conta</h2><p class="muted-sm">Use esta opção somente para um e-mail que já tenha conta no Intervalo. Nenhum e-mail será enviado. Para pessoas novas, use o cadastro com senha provisória acima.</p><form id="invite-team" class="mg">'+input("Nome","display_name","",'required minlength="2" maxlength="100"')+input("E-mail","email","",'required type="email" autocomplete="email"')+'<div><label for="staff-role">Função</label><select name="role" id="staff-role">'+options.map(o=>'<option value="'+o+'">'+roles[o]+'</option>').join("")+'</select></div><div style="display:flex;align-items:end"><button class="btn" type="submit">Vincular conta existente</button></div></form></section><h2 style="margin-top:28px">Pessoas cadastradas ('+d.members.length+')</h2>';
     for(const m of d.members){
       const editable=m.user_id!==null&&m.role!=="master"&&(isMaster||isManager&&["waiter","kitchen","cashier"].includes(m.role));
       const selectable=isMaster?["manager","waiter","kitchen","cashier"]:["waiter","kitchen","cashier"];
       inner+='<article class="team-card"><div class="team-top"><div><b>'+value(m.display_name||m.invited_email||"Usuário")+'</b><div class="muted-sm">'+value(m.invited_email)+'</div><div class="muted-sm">'+value(roles[m.role]??m.role)+'</div></div><span class="status">'+(m.status==="active"?"Ativo":m.status==="pending"?"Convite pendente":"Revogado")+'</span></div>';
       if(editable&&m.status==="active"){inner+='<div class="team-actions"><select aria-label="Alterar função" data-role="'+value(m.user_id)+'">'+selectable.map(t=>'<option value="'+t+'" '+(m.role===t?"selected":"")+'>'+roles[t]+'</option>').join("")+'</select><button type="button" class="smallbtn" data-setrole="'+value(m.user_id)+'">Salvar função</button><button type="button" class="smallbtn danger" data-revoke="'+value(m.user_id)+'">Revogar acesso</button></div>'}
       else if(editable&&m.status==="pending")inner+='<div class="team-actions"><button type="button" class="smallbtn danger" data-revoke="'+value(m.user_id)+'">Cancelar convite</button></div>';
       inner+='</article>';
     }
   }else if(state.tab==="acessos"&&isMaster){
     inner='<h2>Permissões individuais</h2><p class="muted">Configure exceções por funcionário. Essas permissões não ativam um módulo desabilitado para o restaurante.</p>';
     const active=d.members.filter(m=>m.status==="active"&&m.role!=="master");
     if(!active.length)inner+='<section class="panel">Convide um funcionário e aguarde a ativação para configurar permissões.</section>';
     for(const member of active){
       inner+='<h3>'+value(member.display_name||member.invited_email)+' · '+value(roles[member.role])+'</h3><div class="pgrid">';
       for(const mod of modules){
         const item=d.overrides.find(o=>o.user_id===member.user_id&&o.module===mod);
         const allowed=item?item.allowed:(defaults[member.role]??[]).includes(mod);
         const enabled=d.enabled.find(m=>m.module===mod)?.enabled??false;
         inner+='<div class="pitem"><strong>'+labels[mod]+'</strong><span>'+(!enabled?"Módulo ainda não habilitado · ":"")+(item?"Permissão personalizada":"Permissão padrão")+'</span><div><button class="smallbtn" data-perm="'+value(member.user_id)+'" data-mod="'+mod+'" data-allowed="'+(!allowed)+'">'+(allowed?"✓ Permitir — clique para bloquear":"Bloqueado — clique para permitir")+'</button></div></div>';
       }
       inner+='</div>';
     }
   }
   box(viewHead+inner);
   document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;draw()});
   const settingForm=document.getElementById("restaurant-settings");
   if(settingForm){
     async function save(complete){
       const settings=Object.fromEntries(new FormData(settingForm).entries());
       settings.state=(settings.state??"").trim().toUpperCase();
       settings.postal_code=(settings.postal_code??"").replace(/\D/g,"");
       try{await call("save_settings",{settings,complete});await refresh();message(complete?"Cadastro concluído.":"Dados salvos.")}catch(e){message(e.message,"error")}
     }
     settingForm.onsubmit=async e=>{e.preventDefault();await save(false)};
     const finish=document.getElementById("mg-finish");if(finish)finish.onclick=()=>save(true);
   }
   const manualStaffForm=document.getElementById("manual-staff");
   if(manualStaffForm)manualStaffForm.onsubmit=async e=>{
     e.preventDefault();
     const raw=Object.fromEntries(new FormData(manualStaffForm).entries());
     if(raw.temporary_password!==raw.repeat_password){message("As senhas provisórias não coincidem.","error");return}
     const button=manualStaffForm.querySelector('button[type="submit"]');button.disabled=true;
     const temp=raw.temporary_password,email=raw.email.trim().toLowerCase();
     try{
       await call("create_staff_with_password",{
         email,role:raw.role,display_name:raw.display_name,
         temporary_password:temp,current_password:raw.current_password
       });
       state.tab="equipe";await refresh();message("Funcionário criado. A senha será exigida para o primeiro acesso.");
       showTemporaryPassword(temp,email);
     }catch(err){message(err.message,"error");button.disabled=false}
   };
   const inviteForm=document.getElementById("invite-team");
   if(inviteForm)inviteForm.onsubmit=async e=>{
     e.preventDefault();const values=Object.fromEntries(new FormData(inviteForm).entries());
     try{const out=await call("invite",values);await refresh();state.tab="equipe";draw();message("Vínculo criado sem envio de e-mail. A pessoa pode entrar na conta existente e aceitar o convite.")}catch(err){message(err.message,"error")}
   };
   document.querySelectorAll("[data-setrole]").forEach(b=>b.onclick=async()=>{
      const id=b.dataset.setrole,role=document.querySelector('[data-role="'+id+'"]')?.value;
      try{await call("set_role",{user_id:id,role});await refresh();state.tab="equipe";draw();message("Função atualizada.")}catch(err){message(err.message,"error")}
   });
   document.querySelectorAll("[data-revoke]").forEach(b=>b.onclick=async()=>{
      if(!confirm("Revogar o vínculo deste funcionário com este restaurante?"))return;
      try{await call("revoke",{user_id:b.dataset.revoke});await refresh();state.tab="equipe";draw();message("Acesso revogado.")}catch(err){message(err.message,"error")}
   });
   document.querySelectorAll("[data-perm]").forEach(b=>b.onclick=async()=>{
      try{await call("set_access",{user_id:b.dataset.perm,module:b.dataset.mod,allowed:b.dataset.allowed==="true"});await refresh();state.tab="acessos";draw();message("Permissão atualizada.")}catch(err){message(err.message,"error")}
   });
 }
 box(sty+'<h1>Gestão do restaurante</h1><p class="muted">Carregando permissões e equipe...</p>');
 try{await refresh();}catch(e){box(sty+'<section class="panel"><h1>Não foi possível carregar a gestão</h1><p class="error">'+esc(e.message)+'</p><a href="'+link("/inicio")+'">Voltar aos restaurantes</a></section>')}
}
