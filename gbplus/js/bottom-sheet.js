// GB+ 2.7.0 — reusable native-dialog draggable picker.
// The existing title form stays mounted underneath: no FormData values are lost.
// Works with mouse, keyboard, touch and screen readers; no external libraries.
import {esc,icon} from './ui.js?v=20261105-72';
import {gbIcon,categoryIconFor} from './gb-icons.js?v=20261104-42';
import {SERVICE_CATALOG,SERVICE_GROUPS,serviceSearchKey,isServiceExpenseCategory} from './service-catalog.js?v=20261106-2630';
import {serviceIconMarkup,serviceCategoryPreviewMarkup} from './service-ui.js?v=20261107-2710';

const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const picker=()=>document.querySelector('#gb-picker-sheet');
const collator=new Intl.Collator('pt-BR',{sensitivity:'base'});
let active=null;
let drag=null;
let suppressGrabClick=false;

function closePicker(){
 const root=picker();
 if(root?.open)root.close();
}
function snap(root,position){
 root.dataset.snap=position==='expanded'?'expanded':'partial';
 const handle=root.querySelector('.gb-sheet-grab');
 if(handle){
  handle.setAttribute('aria-expanded',String(root.dataset.snap==='expanded'));
  handle.setAttribute('aria-label',root.dataset.snap==='expanded'?'Recolher painel':'Expandir painel');
 }
}
const badge=(kind,item,index)=>{
 if(kind==='service')return serviceIconMarkup(item.id);
 const tones=['lilac','blue','peach','mint','pink','amber'];
 return '<span class="gb-sheet-category-icon tone-'+tones[index%tones.length]+'" aria-hidden="true">'+gbIcon(categoryIconFor(item))+'</span>';
};
function optionMarkup(kind,item,index,selected){
 const id=String(item.id);
 const name=String(item.name);
 const group=kind==='service'?String(SERVICE_GROUPS[item.group]||''): '';
 const isSelected=id===selected;
 return '<button type="button" class="gb-sheet-choice'+(isSelected?' is-selected':'')+
  '" role="option" aria-selected="'+isSelected+'" data-sheet-choice="'+esc(id)+'" data-sheet-search="'+
  esc(normalize(name+' '+group))+'">'+badge(kind,item,index)+
  '<span class="gb-sheet-choice-label">'+esc(name)+'</span>'+
  (kind==='category'&&isServiceExpenseCategory(item)?serviceCategoryPreviewMarkup():'')+
  (isSelected?icon('check','gb-sheet-choice-check'):'')+'</button>';
}
function categorySections(categories,selected){
 const ordered=[...categories].sort((a,b)=>collator.compare(a.name,b.name));
 return [{title:'Categorias disponíveis',items:ordered.map((item,i)=>optionMarkup('category',item,i,selected))}];
}
function serviceSections(selected){
 const sections=Object.entries(SERVICE_GROUPS).map(([group,label])=>{
  const services=SERVICE_CATALOG.filter(s=>s.group===group);
  return {title:label,items:services.map((s,i)=>optionMarkup('service',s,i,selected))};
 });
 sections.push({title:'Outras opções',items:[
  '<button type="button" role="option" class="gb-sheet-choice" aria-selected="'+(selected==='custom')+
   '" data-sheet-choice="custom" data-sheet-search="outro personalizado custom novo serviço">'+
   '<span class="gb-sheet-category-icon tone-blue" aria-hidden="true">'+icon('plus')+'</span>'+
   '<span class="gb-sheet-choice-label">Outro serviço</span></button>',
  '<button type="button" role="option" class="gb-sheet-choice" aria-selected="'+(selected==='')+
   '" data-sheet-choice="" data-sheet-search="nenhum sem servico limpar">'+
   '<span class="gb-sheet-category-icon tone-lilac" aria-hidden="true">'+icon('close')+'</span>'+
   '<span class="gb-sheet-choice-label">Sem serviço</span></button>'
 ]});
 return sections;
}
export function sheetGroupsCount(groups){
 return groups.reduce((count,group)=>count+group.items.length,0);
}
export function openGbPickerSheet({kind,items=[],selected='',onPick}){
 const root=picker();
 if(!root||!['category','service'].includes(kind)||typeof onPick!=='function')return false;
 if(root.open)closePicker();
 const sections=kind==='category'?categorySections(items,selected):serviceSections(selected);
 const title=kind==='category'?'Selecione a categoria':'Qual serviço?';
 const searchHint=kind==='category'?'Busque por uma categoria':'Busque por um serviço';
 const count=sheetGroupsCount(sections);
 const groups=sections.map((section,i)=>
  '<section class="gb-sheet-group" data-sheet-group="'+i+'"><h3>'+esc(section.title)+
  '</h3><div class="gb-sheet-group-options" role="listbox" aria-label="'+esc(section.title)+'">'+
  section.items.join('')+'</div></section>').join('');
 root.innerHTML='<div class="gb-sheet-body">'+
  '<button type="button" class="gb-sheet-grab" data-sheet-grab aria-label="Expandir painel" aria-expanded="false"><span aria-hidden="true"></span></button>'+
  '<div class="gb-sheet-header"><div><h2 id="gb-sheet-title">'+title+'</h2>'+
    '<p>Arraste a barra para ver mais opções.</p></div>'+
   '<button type="button" class="gb-sheet-close" data-sheet-close aria-label="Fechar seleção">'+icon('close')+'</button></div>'+
  '<label class="gb-sheet-search">'+icon('search')+
   '<input type="search" data-sheet-search-input aria-label="'+esc(searchHint)+
    '" placeholder="'+esc(searchHint)+'" autocomplete="off"></label>'+
  '<span class="gb-sheet-count" role="status" aria-live="polite">'+count+' opções</span>'+
  '<div class="gb-sheet-results" tabindex="0">'+groups+
  '<p class="gb-sheet-empty" hidden>Nenhum resultado encontrado.</p></div></div>';
 active={onPick,returnFocus:document.activeElement};
 drag=null;suppressGrabClick=false;
 snap(root,'partial');
 root.showModal();
 root.querySelector('[data-sheet-grab]')?.focus({preventScroll:true});
 return true;
}
export function filterGbPickerSheet(root,query){
 if(!root)return 0;
 const term=normalize(query);
 let total=0;
 root.querySelectorAll('.gb-sheet-group').forEach(group=>{
  let groupTotal=0;
  group.querySelectorAll('[data-sheet-choice]').forEach(option=>{
   const visible=!term||String(option.dataset.sheetSearch||'').includes(term);
   option.hidden=!visible;
   if(visible){groupTotal++;total++;}
  });
  group.hidden=groupTotal===0;
 });
 const empty=root.querySelector('.gb-sheet-empty');if(empty)empty.hidden=total>0;
 const count=root.querySelector('.gb-sheet-count');
 if(count)count.textContent=total+' '+(total===1?'opção':'opções');
 return total;
}
export function installGbPickerSheet(){
 const root=picker();
 if(!root||root.dataset.gbReady)return;
 root.dataset.gbReady='true';
 root.addEventListener('click',event=>{
  if(event.target===root){closePicker();return;}
  const close=event.target.closest('[data-sheet-close]');
  if(close){closePicker();return;}
  const option=event.target.closest('[data-sheet-choice]');
  if(option){
   const value=option.dataset.sheetChoice;
   const callback=active?.onPick;
   closePicker();
   if(callback)callback(value);
   return;
  }
  if(event.target.closest('[data-sheet-grab]')){
   if(suppressGrabClick){suppressGrabClick=false;return;}
   snap(root,root.dataset.snap==='expanded'?'partial':'expanded');
  }
 });
 root.addEventListener('input',event=>{
  if(event.target.matches('[data-sheet-search-input]'))filterGbPickerSheet(root,event.target.value);
 });
 root.addEventListener('keydown',event=>{
  const selected=event.target.closest?.('[data-sheet-choice]');
  if(!selected||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const visible=[...root.querySelectorAll('[data-sheet-choice]')].filter(item=>!item.hidden&&
   !item.closest('.gb-sheet-group')?.hidden);
  const index=visible.indexOf(selected);
  if(index<0)return;
  const target=event.key==='Home'?0:event.key==='End'?visible.length-1:
   event.key==='ArrowDown'?Math.min(visible.length-1,index+1):Math.max(0,index-1);
  event.preventDefault();
  visible[target]?.focus({preventScroll:true});
 });
 root.addEventListener('cancel',event=>{event.preventDefault();closePicker();});
 root.addEventListener('close',()=>{
  const focus=active?.returnFocus;
  active=null;drag=null;
  if(focus?.isConnected){
   focus.setAttribute?.('aria-expanded','false');
   focus.focus({preventScroll:true});
  }
 });
 root.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('[data-sheet-grab]');
  if(!handle||event.button!==0)return;
  drag={pointerId:event.pointerId,startY:event.clientY,lastY:event.clientY};
  handle.setPointerCapture?.(event.pointerId);
 });
 root.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;
  drag.lastY=event.clientY;
 });
 root.addEventListener('pointerup',event=>{
  if(!drag||event.pointerId!==drag.pointerId)return;
  const delta=event.clientY-drag.startY;
  drag=null;
  if(Math.abs(delta)<48)return;
  suppressGrabClick=true;
  setTimeout(()=>{suppressGrabClick=false;},0);
  if(delta<0){snap(root,'expanded');return;}
  if(root.dataset.snap==='expanded')snap(root,'partial');
  else closePicker();
 });
 root.addEventListener('pointercancel',()=>{drag=null;});
}
/** The main launch form can expand and collapse without losing any fields. */
export function installEntryFormDrag(modal){
 if(!modal||modal.dataset.gbDragReady)return;
 modal.dataset.gbDragReady='true';
 let pointer=null,suppressClick=false;
 const setHeight=position=>{
  modal.dataset.gbSnap=position;
  const handle=modal.querySelector('[data-entry-sheet-grab]');
  if(handle)handle.setAttribute('aria-expanded',String(position==='expanded'));
 };
 modal.addEventListener('click',event=>{
  if(!event.target.closest('[data-entry-sheet-grab]'))return;
  if(suppressClick){suppressClick=false;return;}
  setHeight(modal.dataset.gbSnap==='expanded'?'partial':'expanded');
 });
 modal.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('[data-entry-sheet-grab]');
  if(!handle||event.button!==0||!modal.classList.contains('gb-entry-modal'))return;
  pointer={id:event.pointerId,start:event.clientY};
  handle.setPointerCapture?.(event.pointerId);
 });
 modal.addEventListener('pointerup',event=>{
  if(!pointer||pointer.id!==event.pointerId)return;
  const delta=event.clientY-pointer.start;pointer=null;
  if(Math.abs(delta)<48)return;
  suppressClick=true;
  setTimeout(()=>{suppressClick=false;},0);
  if(delta<0)setHeight('expanded');
  else setHeight(modal.dataset.gbSnap==='expanded'?'partial':'compact');
 });
 modal.addEventListener('pointercancel',()=>{pointer=null;});
}
