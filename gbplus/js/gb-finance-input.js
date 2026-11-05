/* Input formatting, shared with every money/phone/CPF/CNPJ form. */
export const onlyDigits=(value,max=32)=>String(value??'').replace(/\D/g,'').slice(0,max);
export function formatCentavos(value){
 const raw=onlyDigits(value,15);
 const amount=Number(raw||'0')/100;
 return amount.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
export function moneyFromStored(value){
 if(typeof value==='number')return formatCentavos(String(Math.round(Math.abs(value)*100)));
 const str=String(value??'').trim();
 if(!str)return '0,00';
 // Decimal dot from older HTML number inputs, before the GB+ mask existed.
 if(/^-?\d+(?:\.\d{1,2})?$/.test(str))return formatCentavos(String(Math.round(Math.abs(Number(str))*100)));
 if(/^-?[\d.]+,\d{1,2}$/.test(str))return formatCentavos(onlyDigits(str));
 return formatCentavos(str);
}
export function parseMoneyCentavos(value){
 const str=String(value??'').trim().replace(/\s/g,'');
 if(!str)throw Error('Informe um valor em reais.');
 const sign=str.startsWith('-')?-1:1,positive=str.replace(/^-/, '');
 if(/^\d+(?:\.\d{1,2})?$/.test(positive))return Math.round(Number(positive)*100)*sign;
 if(/^(?:\d{1,3}(?:\.\d{3})+|\d+),\d{1,2}$/.test(positive))return Number(onlyDigits(positive))*sign;
 if(/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(positive)){
  const [whole,frac='00']=positive.split(',');
  return (Number(whole.replace(/\./g,''))*100+Number(frac.padEnd(2,'0')))*sign;
 }
 throw Error('Informe um valor válido em reais.');
}
export function formatPhone(value){
 const d=onlyDigits(value,11);
 if(d.length<=2)return d.length===2?'('+d+')':d?'('+d:'';
 const area='('+d.slice(0,2)+') ';
 if(d.length<=6)return area+d.slice(2);
 if(d.length<=10)return area+d.slice(2,-4)+'-'+d.slice(-4);
 return area+d.slice(2,7)+'-'+d.slice(7);
}
export function formatCpf(value){
 const d=onlyDigits(value,11);
 if(d.length<=3)return d;
 if(d.length<=6)return d.slice(0,3)+'.'+d.slice(3);
 if(d.length<=9)return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6);
 return d.slice(0,3)+'.'+d.slice(3,6)+'.'+d.slice(6,9)+'-'+d.slice(9);
}
export function formatCnpj(value){
 const d=onlyDigits(value,14);
 if(d.length<=2)return d;
 if(d.length<=5)return d.slice(0,2)+'.'+d.slice(2);
 if(d.length<=8)return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5);
 if(d.length<=12)return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8);
 return d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8,12)+'-'+d.slice(12);
}
export function formatTaxId(value){
 const d=onlyDigits(value,14);
 return d.length>11?formatCnpj(d):formatCpf(d);
}
export function maskKind(input){
 if(input.closest('#partner-form')&&input.name==='document')return'tax-id';
 if(input.name==='cpf')return'cpf';
 if(input.name==='phone')return'phone';
 if(input.matches('input[name="amount"][type="number"],input[name="initial"][type="number"]'))return'money';
 if(input.dataset.mask==='money')return'money';
 return'';
}
export function enhanceFinancialMasks(root=document){
 const all=[...(root.matches?.('input')?[root]:[]),...(root.querySelectorAll?.('input')||[])];
 all.forEach(el=>{
  if(el.dataset.gbMaskReady)return;
  const kind=maskKind(el);
  if(!kind)return;
  el.dataset.gbMaskReady=kind;
  if(kind==='money'){
   const initial=el.value;
   el.type='text';el.inputMode='numeric';el.autocomplete='off';
   el.setAttribute('pattern','-?[0-9.]+,[0-9]{2}');
   el.value=moneyFromStored(initial);
   el.setAttribute('placeholder','0,00');
  }else{
   if(kind==='phone'){el.inputMode='tel';el.maxLength=15;el.value=formatPhone(el.value);}
   if(kind==='cpf'){el.inputMode='numeric';el.maxLength=14;el.value=formatCpf(el.value);}
   if(kind==='tax-id'){el.inputMode='numeric';el.maxLength=18;el.value=formatTaxId(el.value);}
  }
 });
}
export function processMaskInput(input){
 const kind=input?.dataset?.gbMaskReady;
 if(!kind)return false;
 const before=input.value,oldStart=input.selectionStart??before.length;
 const oldDigits=onlyDigits(before.slice(0,oldStart)).length;
 if(kind==='money')input.value=(before.startsWith('-')?'-':'')+formatCentavos(before);
 else if(kind==='phone')input.value=formatPhone(before);
 else if(kind==='cpf')input.value=formatCpf(before);
 else if(kind==='tax-id')input.value=formatTaxId(before);
 if(kind!=='money'&&input.selectionStart!==null){
  let start=0,seen=0;
  while(start<input.value.length&&seen<oldDigits){if(/\d/.test(input.value[start]))seen++;start++;}
  try{input.setSelectionRange(start,start);}catch{}
 }
 return true;
}
export function installFinancialMasks(){
 document.addEventListener('input',event=>processMaskInput(event.target),true);
 document.addEventListener('focusout',event=>{
  const input=event.target;
  if(input?.dataset?.gbMaskReady==='phone'&&input.value&&onlyDigits(input.value).length<10)input.setCustomValidity('Informe o DDD e um telefone válido.');
  else if(input?.dataset?.gbMaskReady==='tax-id'&&input.value&&!([11,14].includes(onlyDigits(input.value).length)))input.setCustomValidity('Informe um CPF ou CNPJ completo.');
  else if(input?.setCustomValidity&&input.dataset?.gbMaskReady)input.setCustomValidity('');
 });
 document.addEventListener('input',event=>{
  if(event.target?.dataset?.gbMaskReady)event.target.setCustomValidity('');
 });
}
