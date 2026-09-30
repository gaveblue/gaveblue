// Check for a newer release without clearing local data or interrupting a form.
(() => {
  'use strict';
  const current=document.querySelector('meta[name="app-release"]')?.content;
  let checking=false,notice;
  async function check(){
    if(checking||notice||document.hidden||!current||current==='development')return;
    checking=true;
    try{
      const response=await fetch('./release.json?check='+Date.now(),{cache:'no-store'});
      if(!response.ok)return;
      const release=await response.json();
      if(!/^[a-f0-9]{16}$/.test(release.version)||release.version===current)return;
      notice=document.createElement('aside');notice.className='release-notice';notice.setAttribute('role','status');
      notice.innerHTML='<span>Uma nova versão está disponível.</span><button type="button">Atualizar agora</button>';
      notice.querySelector('button').onclick=()=>{
        if(document.querySelector('dialog[open]')){notice.querySelector('span').textContent='Salve ou cancele o formulário aberto antes de atualizar.';return;}
        location.reload();
      };
      document.body.append(notice);
    }catch{/* Keep the current page usable while offline. */}
    finally{checking=false;}
  }
  check();setInterval(check,300000);document.addEventListener('visibilitychange',check);
})();
