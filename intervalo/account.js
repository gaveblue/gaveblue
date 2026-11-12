// Intervalo 0.2.1 — CPF opcional vinculado à conta, nunca usado como senha.
export async function renderAccount({supabase,box,esc,link,user}){
 const style='<style>.account-layout{max-width:620px}.account-layout .panel{margin:18px 0}.account-layout label{display:block;margin:15px 0 7px;font-size:13px;font-weight:700}.account-layout input{width:100%}.account-layout .actionrow{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:18px}.account-layout .danger{background:white;color:#be123c;border:1px solid #fecdd3}.account-layout .securehint{background:#f0fdfa;border:1px solid #ccfbf1;padding:13px;border-radius:10px;color:#115e59;font-size:13px;line-height:1.55}.account-layout .status{font-size:13px;color:#64748b}</style>';
 const invoke=async(data)=>{
   const r=await supabase.functions.invoke("account-cpf",{body:data});
   if(r.error){
     let msg=r.error.message??"Falha de comunicação";
     try{const server=await r.error.context?.json?.();if(server?.error)msg=server.error;}catch{}
     throw new Error(msg);
   }
   if(r.data?.error)throw new Error(r.data.error);
   return r.data;
 };
 const render=(status,message="",error=false)=>{
   const linked=status?.linked;
   box(style+'<section class="account-layout"><a class="smallbtn" href="'+link("/inicio")+'">← Meus restaurantes</a><h1>Minha Conta</h1><p class="muted">Uma única conta para acessar todos os restaurantes onde você trabalha.</p><div class="panel"><h2>Identificação</h2><p class="status">E-mail da conta</p><p><strong>'+esc(user.email??"Não informado")+'</strong></p><p class="status">Login por CPF</p><p><strong>'+(linked?'Ativado · CPF final '+esc(status.last4):'Ainda não ativado')+'</strong></p><p class="securehint">Você continua podendo entrar por e-mail. Para usar o CPF no login, cadastre-o abaixo. Não divulgamos seu CPF completo a outros usuários ou restaurantes.</p></div><div class="panel"><h2>'+(linked?'Atualizar ou remover CPF':'Ativar login por CPF')+'</h2><form id="link-cpf">'+(linked?'<p class="muted">Para corrigir seu CPF, confirme sua senha e informe o novo número.</p>':'')+'<label for="account-cpf">CPF (11 números)</label><input id="account-cpf" name="cpf" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="000.000.000-00" required><label for="account-pass">Confirme sua senha atual</label><input id="account-pass" name="current_password" type="password" autocomplete="current-password" required><div class="actionrow"><button class="btn" type="submit">'+(linked?'Atualizar CPF':'Ativar CPF')+'</button>'+(linked?'<button type="button" id="unlink-cpf" class="btn danger">Remover login por CPF</button>':'')+'</div><p id="cpf-feedback" aria-live="polite" class="'+(error?'error':'notice')+'" '+(message?'':'style="display:none"')+'>'+esc(message)+'</p></form></div></section>');
   const form=document.getElementById("link-cpf");
   const show=(msg,bad)=>{const el=document.getElementById("cpf-feedback");el.style.display="block";el.className=bad?"error":"notice";el.textContent=msg;};
   form.onsubmit=async e=>{
     e.preventDefault();const cpf=form.elements.namedItem("cpf").value;
     const password=form.elements.namedItem("current_password").value;
     const submit=form.querySelector('[type="submit"]');submit.disabled=true;
     try{
       const out=await invoke({action:"link",cpf,current_password:password});
       const next={linked:true,last4:out.last4};
       render(next,"CPF vinculado. Agora você pode entrar usando CPF ou e-mail e sua senha.");
     }catch(err){show(err.message,true);submit.disabled=false;form.elements.namedItem("current_password").value="";}
   };
   const unlink=document.getElementById("unlink-cpf");
   if(unlink)unlink.onclick=async()=>{
     if(!confirm("Desativar o login por CPF nesta conta? Você continuará acessando por e-mail."))return;
     const pass=form.elements.namedItem("current_password").value;
     if(!pass){show("Informe sua senha atual antes de remover o CPF.",true);return}
     unlink.disabled=true;
     try{await invoke({action:"unlink",current_password:pass});render({linked:false},"Login por CPF desativado.");}
     catch(err){show(err.message,true);unlink.disabled=false;form.elements.namedItem("current_password").value="";}
   };
 };
 box(style+'<section class="account-layout"><h1>Minha Conta</h1><p class="muted">Carregando identificação...</p></section>');
 try{const status=await invoke({action:"status"});render(status);}
 catch(err){box(style+'<section class="account-layout"><h1>Minha Conta</h1><p class="error">'+esc(err.message)+'</p><a href="'+link("/inicio")+'">Voltar</a></section>');}
}
