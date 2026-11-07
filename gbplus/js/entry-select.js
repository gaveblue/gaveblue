import {esc,icon} from './ui.js?v=20261104-42';
import {gbIcon,gbOptionIcon} from './gb-icons.js?v=20261104-42';
import {serviceCategoryPreviewMarkup} from './service-ui.js?v=20261107-2720';

// A11y-friendly visual dropdown. An actual form select remains out of sight
// only as the data carrier, so existing FormData and change handlers stay intact.
const typeMarkup=(value)=>value==='income'
 ? '<span class="gb-entry-direction income">'+icon('up')+'</span>'
 : value==='expense'
 ? '<span class="gb-entry-direction expense">'+icon('down')+'</span>'
 : '';
function decoratedText(option,isType){
 return (isType?typeMarkup(option.value):'')+'<span>'+esc(option.textContent||'')+'</span>';
}
function menuOptionLabel(name,option){
 const type=name==='type',text=String(option.textContent??option.text??'');
 return (type?typeMarkup(option.value):'<span class="gb-entry-option-symbol">'+gbIcon(option.icon||option.dataset?.icon||gbOptionIcon(name,option.value,text))+'</span>')+
  '<span class="gb-entry-option-title">'+esc(text)+'</span>';
}
export function entrySelect(label,name,options,value='',id='',required=false){
 const type=name==='type';
 const optionRows=options.map(([key,text,symbol,service])=>({value:String(key),text:String(text),icon:String(symbol||''),service:Boolean(service)}));
 const chosen=optionRows.find(o=>o.value===String(value??''))||optionRows[0];
 const selected=chosen?.value||'';
 const source='<select class="gb-entry-source" aria-hidden="true" tabindex="-1" name="'+esc(name)+'"'+(id?' id="'+esc(id)+'"':'')+'>'+
  optionRows.map(o=>'<option value="'+esc(o.value)+'" data-icon="'+esc(o.icon)+'" data-service-preview="'+o.service+'"'+(o.value===selected?' selected':'')+'>'+esc(o.text)+'</option>').join('')+'</select>';
 const renderValue=(o)=>type
  ? (o.value==='income'?'<span class="gb-entry-direction income">'+icon('up')+'</span>':'<span class="gb-entry-direction expense">'+icon('down')+'</span>')+'<span>'+esc(o.text)+'</span>'
   :(name==='categoryId'?'<span class="gb-entry-chosen-icon">'+gbIcon(o.icon||gbOptionIcon(name,o.value,o.text))+'</span>':'')+'<span>'+esc(o?.text||'Selecione')+'</span>'+(name==='categoryId'&&o.service?serviceCategoryPreviewMarkup():'');
 const optionsHtml=(name==='categoryId'?[]:optionRows).map(o=>'<button type="button" role="option" class="gb-entry-option'+(o.value===selected?' is-selected':'')+'" data-action="entry-option" data-value="'+esc(o.value)+'" aria-selected="'+(o.value===selected)+'">'+menuOptionLabel(name,o)+
  (o.value===selected?icon('check','gb-entry-option-check'):'')+'</button>').join('');
 return '<div class="gb-entry-select'+(type?' gb-entry-type':'')+'" data-entry-name="'+esc(name)+'">'+
  '<span class="gb-entry-label" id="label-entry-'+esc(name)+'">'+esc(label)+(required?' <span class="gb-entry-required" aria-hidden="true"></span>':'')+'</span>'+source+
  '<button type="button" class="gb-entry-trigger" data-action="entry-toggle" role="combobox" aria-labelledby="label-entry-'+esc(name)+'" aria-label="'+esc(label+': '+(chosen?.text||'Selecione'))+'" aria-controls="'+(name==='categoryId'?'gb-picker-sheet':'entry-options-'+esc(name))+'" aria-haspopup="'+(name==='categoryId'?'dialog':'listbox')+'" aria-expanded="false">'+
   '<span class="gb-entry-current">'+renderValue(chosen||{value:'',text:'Selecione'})+'</span>'+icon('chevron')+
  '</button>'+
  '<div class="gb-entry-options" id="entry-options-'+esc(name)+'" role="listbox" aria-label="'+esc(label)+'" hidden>'+optionsHtml+'</div></div>';
}
export function syncEntrySelect(select){
 const wrap=select?.closest('.gb-entry-select');if(!wrap)return;
 const isType=wrap.dataset.entryName==='type',entryName=wrap.dataset.entryName||'';
 const chosen=select.selectedOptions[0];
 const options=[...select.options];
 const current=wrap.querySelector('.gb-entry-current');
 if(current)current.innerHTML=chosen?(isType?decoratedText(chosen,true):(entryName==='categoryId'?'<span class="gb-entry-chosen-icon">'+gbIcon(chosen.dataset.icon||gbOptionIcon(entryName,chosen.value,chosen.textContent))+'</span>':'')+'<span>'+esc(chosen.textContent||'Selecione')+'</span>'+(entryName==='categoryId'&&chosen.dataset.servicePreview==='true'?serviceCategoryPreviewMarkup():'')):'<span>Selecione</span>';
 const trigger=wrap.querySelector('.gb-entry-trigger');
 if(trigger)trigger.setAttribute('aria-label',(wrap.querySelector('.gb-entry-label')?.textContent||'Campo')+': '+(chosen?.textContent||'Selecione'));
 const optionsTarget=wrap.querySelector('.gb-entry-options');
 if(optionsTarget)optionsTarget.innerHTML=(entryName==='categoryId'?[]:options).map(o=>'<button type="button" role="option" class="gb-entry-option'+(o.selected?' is-selected':'')+'" data-action="entry-option" data-value="'+esc(o.value)+'" aria-selected="'+o.selected+'">'+menuOptionLabel(entryName,o)+(o.selected?icon('check','gb-entry-option-check'):'')+'</button>').join('');
}
export function closeEntryMenus(except=null){
 document.querySelectorAll('#modal .gb-entry-select').forEach(wrap=>{
  if(wrap===except)return;
  const list=wrap.querySelector('.gb-entry-options'),trigger=wrap.querySelector('.gb-entry-trigger');
  if(list){list.hidden=true;list.removeAttribute('style');}
  trigger?.setAttribute('aria-expanded','false');
 });
}
export function toggleEntryMenu(button){
 const wrap=button?.closest('.gb-entry-select');if(!wrap)return;
 const list=wrap.querySelector('.gb-entry-options');if(!list)return;
 const open=list.hidden;closeEntryMenus();
 list.hidden=!open;
 button.setAttribute('aria-expanded',String(open));
 if(open){
  const rect=button.getBoundingClientRect();
  const below=window.innerHeight-rect.bottom-9,above=rect.top-9;
  const desired=Math.min(list.scrollHeight||180,220);
  const goesUp=below<Math.min(125,desired)&&above>below;
  const height=Math.min(desired,Math.max(70,goesUp?above:below));
  list.style.left=Math.max(8,rect.left)+'px';
  list.style.right='auto';
  list.style.width=Math.min(rect.width,window.innerWidth-16)+'px';
  list.style.top=(goesUp?Math.max(8,rect.top-height-5):rect.bottom+5)+'px';
  list.style.maxHeight=height+'px';
  list.querySelector('[aria-selected="true"]')?.focus({preventScroll:true});
 }
}
export function chooseEntryOption(option){
 const wrap=option?.closest('.gb-entry-select');
 const source=wrap?.querySelector('.gb-entry-source');if(!source)return;
 const value=option.dataset.value;
 if(![...source.options].some(o=>o.value===value))return;
 source.value=value;
 syncEntrySelect(source);
 closeEntryMenus();
 wrap.querySelector('.gb-entry-trigger')?.focus({preventScroll:true});
 // Native-compatible event for the existing category/periodicity rules.
 source.dispatchEvent(new Event('change',{bubbles:true}));
}
