// Intervalo 1.1.0-rc.14 · Formulários brasileiros, entrada monetária e teclado móvel.
// Formatação no próprio input: as APIs existentes continuam recebendo "24,90" (sem R$ e sem milhar).
const digits=(value)=>String(value??'').replace(/\D/g,'');
export function formatMoneyInput(value){
 const raw=digits(value).slice(0,10); // Oito inteiros e dois centavos; limite de segurança.
 if(!raw)return '';
 const adjusted=raw.replace(/^0+(?=\d)/,'')||'0';
 const whole=(adjusted.length>2?adjusted.slice(0,-2):'0').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
 return whole+','+adjusted.slice(-2).padStart(2,'0');
}
export function formatCPF(value){
 const d=digits(value).slice(0,11);
 if(d.length<=3)return d;
 if(d.length<=6)return d.slice(0,3)+'.'+d.slice(3);
 if(d.length<=9)return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6);
 return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6,9)+'-'+d.slice(9);
}
export function formatCNPJ(value){
 const d=digits(value).slice(0,14);
 if(d.length<=2)return d;
 if(d.length<=5)return d.slice(0,2)+'.'+d.slice(2);
 if(d.length<=8)return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5);
 if(d.length<=12)return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8);
 return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8,12)+'-'+d.slice(12);
}
export function formatCEP(value){
 const d=digits(value).slice(0,8);
 return d.length>5?d.slice(0,5)+'-'+d.slice(5):d;
}
export function formatPhone(value){
 let d=digits(value);
 if(d.length>11&&d.startsWith('55'))d=d.slice(2);
 d=d.slice(0,11);
 if(!d)return '';
 if(d.length<=2)return '('+d+(d.length===2?')':'');
 const area='('+d.slice(0,2)+') ';
 const number=d.slice(2);
 const split=d.length>10?5:4;
 return area+(number.length>split?number.slice(0,split)+'-'+number.slice(split):number);
}
const inputTypes=new Set(['text','tel','search','']);
function typeFor(el){
 if(!el||el.tagName!=='INPUT'||!inputTypes.has((el.type||'text').toLowerCase())||el.disabled||el.readOnly||el.dataset.ivNoMask!==undefined)return null;
 const name=(el.getAttribute('name')||'').toLowerCase(),id=(el.id||'').toLowerCase();
 const explicit=el.dataset.ivMask;
 if(explicit==='none')return null;
 if(['money','cpf','cnpj','cep','phone','identity'].includes(explicit))return explicit;
 if(name==='identifier'&&id==='login-id')return 'identity';
 if(/^(cpf|taxpayer_cpf|document_cpf)$/.test(name)||/(^|[-_])cpf($|[-_])/.test(id))return 'cpf';
 if(/^(cnpj|taxpayer_cnpj|document_cnpj)$/.test(name)||/(^|[-_])cnpj($|[-_])/.test(id))return 'cnpj';
 if(/^(postal_code|postal_code_from|postal_code_to|cep|zip_code)$/.test(name)||/(^|[-_])(cep|postal_code)($|[-_])/.test(id))return 'cep';
 if(/^(phone|telefone|mobile|celular|whatsapp|phone_number|customer_phone)$/.test(name)||/(^|[-_])(phone|mobile|celular|telefone)($|[-_])/.test(id))return 'phone';
 // A chave Pix aceita e-mail, EVP, CPF e CNPJ. NUNCA mascarar o campo genérico.
 if(/^(pix_key|quantity|delta|seats|eta|estimated_prep_minutes|price_cents|stock_item_id)$/.test(name))return null;
 const label=el.labels?.[0]?.textContent||'';
 if(!/%|percentual|porcentagem/i.test(label)&&(/^(amount|price|fee|minimum|minimum_order|starting_cash|cash_amount|sale_price|cost_price|unit_price|total_amount|discount_amount)$/i.test(name)||/R\s*\$/.test(label)))return 'money';
 return null;
}
function setupField(el,type){
 if(!type||el.dataset.ivMaskPrepared===type)return;
 el.dataset.ivMaskPrepared=type;
 if(type==='money'){
  el.inputMode='decimal';
  el.setAttribute('autocomplete','off');
  if(!el.getAttribute('placeholder'))el.setAttribute('placeholder','0,00');
 }else if(type==='phone'){
  el.inputMode='tel';el.setAttribute('autocomplete','tel');
  if(el.maxLength>0&&el.maxLength<15)el.maxLength=15;
 }else if(type!=='identity'){
  el.inputMode='numeric';
  if(type==='cep'){
   if(el.maxLength>0&&el.maxLength<9)el.maxLength=9;
   el.setAttribute('autocomplete','postal-code');
  }else if(type==='cpf'){
   if(el.maxLength>0&&el.maxLength<14)el.maxLength=14;
  }else if(type==='cnpj'){
   if(el.maxLength>0&&el.maxLength<18)el.maxLength=18;
  }
 }
}
function formatValue(type,value,el){
 if(type==='money')return formatMoneyInput(value);
 if(type==='cpf')return formatCPF(value);
 if(type==='cnpj')return formatCNPJ(value);
 if(type==='cep')return formatCEP(value);
 if(type==='phone')return formatPhone(value);
 if(type==='identity'){
  if(/[a-z@]/i.test(value)){
   // Caso um login iniciado como CPF vire e-mail, retire apenas a pontuação da máscara.
   return el.dataset.ivIdentityNumeric==='yes'?value.replace(/[.-]/g,''):value;
  }
  if(/^[\d\s.-]+$/.test(value)&&digits(value).length>0){
   el.dataset.ivIdentityNumeric='yes';
   return formatCPF(value);
  }
  delete el.dataset.ivIdentityNumeric;
 }
 return value;
}
function caretAfterDigits(s,count){
 if(count<=0)return 0;
 let found=0;
 for(let i=0;i<s.length;i++)if(/\d/.test(s[i])&&++found>=count)return i+1;
 return s.length;
}
function apply(el,type){
 const before=el.value;
 const pos=el.selectionStart??before.length;
 const atEnd=pos===before.length;
 const n=digits(before.slice(0,pos)).length;
 const formatted=formatValue(type,before,el);
 if(formatted===before)return;
 el.value=formatted;
 const caret=atEnd?formatted.length:caretAfterDigits(formatted,n);
 try{el.setSelectionRange(caret,caret)}catch{}
}
function isEditableField(el){
 return !!el&&(el.matches?.('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, select'))&&!el.disabled&&!el.readOnly;
}
export function initIntervaloFormUX(){
 if(document.documentElement.dataset.ivFormUx==='ready')return;
 document.documentElement.dataset.ivFormUx='ready';
 let focused=null,baseHeight=0,lastScroll=0;
 const viewport=window.visualViewport;
 function visibleHeight(){return viewport?.height||window.innerHeight}
 function considerBase(){
  if(!focused)baseHeight=Math.max(window.innerHeight,visibleHeight(),baseHeight);
 }
 baseHeight=Math.max(window.innerHeight,visibleHeight());
 function scrollFocus(){
  if(!focused||!focused.isConnected||!isEditableField(focused))return;
  const visTop=viewport?.offsetTop??0,visBottom=visTop+visibleHeight();
  const rect=focused.getBoundingClientRect();
  if(rect.top<visTop+65||rect.bottom>visBottom-65){
   // Retarda a rolagem apenas quando o foco ficou oculto pelo teclado.
   focused.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'});
  }
 }
 function refreshKeyboard(){
  const occlusion=Math.max(0,baseHeight-visibleHeight()-(viewport?.offsetTop??0));
  const opened=!!focused&&window.matchMedia('(max-width:900px)').matches&&occlusion>=110;
  document.body.classList.toggle('iv-ux-keyboard',opened);
  document.documentElement.style.setProperty('--iv-ux-keyboard-height',opened?Math.round(occlusion)+'px':'0px');
  if(opened&&Date.now()-lastScroll>110){lastScroll=Date.now();window.requestAnimationFrame(scrollFocus)}
 }
 document.addEventListener('focusin',event=>{
  const el=event.target;
  if(!isEditableField(el))return;
  focused=el;
  const type=typeFor(el);
  if(type){setupField(el,type);apply(el,type)}
  if(el.tagName==='INPUT'&&el.type!=='password'&&el.type!=='search'){
   const form=el.closest('form');
   const fields=form?[...form.querySelectorAll('input,select,textarea')].filter(isEditableField):[];
   el.enterKeyHint=fields.indexOf(el)>=0&&fields.indexOf(el)<fields.length-1?'next':'done';
  }
  window.requestAnimationFrame(()=>{refreshKeyboard();scrollFocus()});
 },true);
 document.addEventListener('input',event=>{
  const el=event.target,type=typeFor(el);
  if(!type||event.isComposing||el.dataset.ivComposing==='true')return;
  setupField(el,type);apply(el,type);
 },true);
 document.addEventListener('beforeinput',event=>{
  const el=event.target;
  if(typeFor(el)!=='money')return;
  // Permite apagar o valor zero completo; sem isso, o backspace recria "0,00" indefinidamente.
  if(event.inputType==='deleteContentBackward'&&el.value==='0,00'&&el.selectionStart===el.selectionEnd){
   event.preventDefault();el.value='';
   el.dispatchEvent(new Event('input',{bubbles:true}));
  }
 },true);
 document.addEventListener('compositionstart',event=>{
  if(event.target?.tagName==='INPUT')event.target.dataset.ivComposing='true';
 },true);
 document.addEventListener('compositionend',event=>{
  const el=event.target;if(el?.tagName!=='INPUT')return;
  delete el.dataset.ivComposing;
  const type=typeFor(el);if(type)apply(el,type);
 },true);
 document.addEventListener('keydown',event=>{
  const el=event.target;
  if(event.key!=='Enter'||event.shiftKey||event.isComposing||!el||el.tagName!=='INPUT')return;
  if(['password','search','submit','email','url','number','date','time'].includes(el.type))return;
  if(!el.closest('form')||el.closest('form').id==='loginForm')return;
  const fields=[...el.form.querySelectorAll('input,textarea,select')].filter(isEditableField);
  const next=fields.slice(fields.indexOf(el)+1).find(e=>e.offsetParent!==null||e.closest('dialog[open]'));
  if(next){event.preventDefault();next.focus({preventScroll:true});window.requestAnimationFrame(scrollFocus)}
 },true);
 document.addEventListener('focusout',event=>{
  if(event.target!==focused)return;
  focused=null;
  window.requestAnimationFrame(()=>{considerBase();refreshKeyboard()});
 },true);
 viewport?.addEventListener('resize',refreshKeyboard);
 viewport?.addEventListener('scroll',refreshKeyboard);
 window.addEventListener('resize',()=>{if(!focused)baseHeight=Math.max(window.innerHeight,visibleHeight());refreshKeyboard()});
 window.addEventListener('pageshow',()=>{baseHeight=Math.max(window.innerHeight,visibleHeight());refreshKeyboard()});
}
