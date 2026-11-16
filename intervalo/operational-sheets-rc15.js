// Intervalo · Bottom Sheet de formulários operacionais · RC15
// Reutiliza o formulário e seus listeners originais; não faz alterações de negócio.
export function sheetifyForms(specs=[],root=document){
 const installed=[];
 for(const spec of specs){
  const form=root.getElementById(spec.id);
  if(!form||form.dataset.sheetified==='true')continue;
  const parent=form.parentElement;
  if(!parent)continue;
  const target=(spec.replaceDetails?form.closest('details'):null)||form;
  const trigger=document.createElement('button');
  trigger.type='button';trigger.className='iv-op-open';
  trigger.innerHTML='<span aria-hidden="true">＋</span><span>'+escapeHTML(spec.label||'Abrir formulário')+'</span><span class="iv-op-arrow" aria-hidden="true">›</span>';
  trigger.setAttribute('aria-haspopup','dialog');
  trigger.setAttribute('aria-label',spec.label||'Abrir formulário');
  target.replaceWith(trigger);
  const dialog=document.createElement('dialog');
  dialog.className='iv-op-sheet '+(spec.extraClass||'');
  // Anexa classes de contexto ao sheet para preservar estilos existentes dos campos.
  if(spec.context)dialog.classList.add(spec.context);
  dialog.setAttribute('aria-label',spec.title||spec.label||'Formulário');
  const head=document.createElement('div');head.className='iv-op-head';
  const handle=document.createElement('button');handle.type='button';handle.className='iv-op-grip';handle.setAttribute('aria-label','Arraste para expandir ou fechar');
  const heading=document.createElement('div');heading.className='iv-op-heading';
  heading.innerHTML='<h2>'+escapeHTML(spec.title||spec.label||'Formulário')+'</h2><p>'+escapeHTML(spec.description||'Confira os dados antes de salvar.')+'</p>';
  const close=document.createElement('button');close.type='button';close.className='iv-op-close';close.setAttribute('aria-label','Fechar painel');close.textContent='×';
  head.append(handle,heading,close);
  const body=document.createElement('div');body.className='iv-op-body';
  body.append(form);
  const error=document.createElement('p');error.className='iv-op-error';error.setAttribute('role','alert');error.setAttribute('aria-live','assertive');
  body.append(error);
  const footer=document.createElement('div');footer.className='iv-op-footer';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='iv-op-cancel';cancel.textContent='Cancelar';footer.append(cancel);
  // Botão original permanece no formulário e mantém onsubmit, sem duplicar operação.
  const originalSubmit=form.querySelector('[type="submit"],button:not([type])');
  if(originalSubmit)originalSubmit.classList.add('iv-op-submit');
  const content=document.createElement('div');content.className='iv-op-content';content.append(head,body,footer);dialog.append(content);
  document.body.append(dialog);
  const closeSheet=()=>{if(!dialog.open)return;if(originalSubmit?.disabled)return;dialog.close()};
  const align=()=>{
   if(!dialog.isConnected||!dialog.open)return;
   const vv=window.visualViewport;const height=vv?.height??window.innerHeight;
   const keyboard=Math.max(0,window.innerHeight-(height+(vv?.offsetTop??0)));
   dialog.style.bottom=keyboard+'px';
   dialog.style.setProperty('--iv-op-viewheight',Math.max(250,Math.floor(height-8))+'px');
  };
  const clear=()=>{
   error.textContent='';
   form.querySelectorAll('.iv-op-inline-error').forEach(el=>el.remove());
   form.querySelectorAll('[aria-invalid="true"]').forEach(el=>el.removeAttribute('aria-invalid'));
  };
  // Sempre valida localmente, sem popups nativos do navegador.
  form.noValidate=true;
  form.addEventListener('input',clear);
  form.addEventListener('change',clear);
  form.addEventListener('submit',e=>{
   clear();
   const invalid=[...form.querySelectorAll('input,select,textarea')].find(el=>!el.disabled&&!el.checkValidity());
   if(!invalid)return;
   e.preventDefault();e.stopImmediatePropagation();
   invalid.setAttribute('aria-invalid','true');
   const message=document.createElement('p');message.className='iv-op-inline-error';
   message.textContent=invalid.validity.valueMissing?'Preencha este campo.':
    invalid.validity.rangeUnderflow||invalid.validity.rangeOverflow?'Informe um valor dentro do intervalo permitido.':
    invalid.validity.patternMismatch?'Revise o formato informado.':
    invalid.validity.typeMismatch?'Informe um valor válido.':
    invalid.validity.tooShort?'O texto é menor que o mínimo permitido.':'Confira o valor informado.';
   invalid.insertAdjacentElement('afterend',message);
   error.textContent='Confira o campo destacado para continuar.';
  },true);
  const attemptClose=()=>closeSheet();
  close.addEventListener('click',attemptClose);
  cancel.addEventListener('click',attemptClose);
  dialog.addEventListener('cancel',e=>{if(originalSubmit?.disabled)e.preventDefault()});
  dialog.addEventListener('click',e=>{if(e.target===dialog)attemptClose()});
  let dragStart=null,dy=0;
  handle.addEventListener('pointerdown',e=>{dragStart=e.clientY;dy=0;handle.setPointerCapture?.(e.pointerId)});
  handle.addEventListener('pointermove',e=>{if(dragStart===null)return;dy=e.clientY-dragStart;if(dy>0)content.style.transform='translateY('+Math.min(dy,120)+'px)'});
  const release=()=>{if(dragStart===null)return;dragStart=null;content.style.transform='';if(dy>80)closeSheet();else if(dy< -45)dialog.classList.add('iv-op-expanded');dy=0};
  handle.addEventListener('pointerup',release);handle.addEventListener('pointercancel',release);
  const onOpen=()=>{clear();dialog.showModal();align();close.focus({preventScroll:true})};
  trigger.addEventListener('click',onOpen);
  window.visualViewport?.addEventListener('resize',align);
  window.visualViewport?.addEventListener('scroll',align);
  window.addEventListener('resize',align);
  const detach=()=>{
   if(dialog.open)dialog.close();
   dialog.remove();
   observer?.disconnect();
   window.visualViewport?.removeEventListener('resize',align);
   window.visualViewport?.removeEventListener('scroll',align);
   window.removeEventListener('resize',align);
  };
  const observer=typeof MutationObserver!=='undefined'?new MutationObserver(()=>{if(!trigger.isConnected)detach()}):null;
  observer?.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  installed.push({trigger,dialog,form,close:closeSheet,dispose:detach});
 }
 return installed;
}
function escapeHTML(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}

/** Exibe o erro na própria folha sem perder os valores preenchidos. */
export function showFormSheetError(form,message){
 const dialog=form?.closest?.('dialog.iv-op-sheet');
 const target=dialog?.querySelector?.('.iv-op-error');
 if(!target)return false;
 target.textContent=String(message??'Não foi possível concluir. Tente novamente.');
 return true;
}
