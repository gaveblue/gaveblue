import {gbIcon,gbOptionIcon} from './gb-icons.js?v=20261104-41';
/* GB+ Custom Controls · visual selectors and calendar without native popovers.
   The original form controls remain as data sources for FormData and validation. */
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ptMonth=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'});
const ptWeek=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
let openMenu=null,openCalendar=null,sequence=0;
const isISO=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'');
function readableDate(v){
 if(!isISO(v))return 'Selecionar data';
 const [y,m,d]=v.split('-');
 return d+'/'+m+'/'+y;
}
function selectOptions(select){
 return [...select.options].map(o=>({value:o.value,title:o.textContent||'',disabled:o.disabled,selected:o.selected}));
}
function refreshSelect(select){
 const wrapper=select?.closest('.gb-custom-select');
 if(!wrapper)return;
 const button=wrapper.querySelector('.gb-custom-select-trigger');
 const list=wrapper.querySelector('.gb-custom-select-list');
 const selected=select.selectedOptions[0];
 const count=select.options.length;
 button.querySelector('.gb-custom-select-value').textContent=selected?.textContent||'Selecione';
 button.disabled=select.disabled||count===0;
 const name=select.name||select.id||'';
 list.innerHTML=selectOptions(select).map(({value,title,disabled,selected})=>
  '<button type="button" role="option" class="gb-custom-select-option'+(selected?' is-active':'')+'" aria-selected="'+String(selected)+'" data-value="'+escapeHtml(value)+'"'+(disabled?' disabled':'')+'>'+
  '<span class="gb-custom-option-icon">'+gbIcon(gbOptionIcon(name,value,title))+'</span>'+
  '<span class="gb-custom-option-title">'+escapeHtml(title)+'</span>'+
  (selected?'<span class="gb-custom-check" aria-hidden="true">'+gbIcon('check')+'</span>':'')+'</button>'
 ).join('');
}
function enhanceSelect(select){
 if(select.closest('.gb-entry-select,.gb-custom-select')||select.classList.contains('gb-entry-source')||select.dataset.gbNative==='true'||select.multiple||select.size>1)return;
 const wrapper=document.createElement('span');wrapper.className='gb-custom-select';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='gb-custom-select-trigger';
 const id='gb-custom-list-'+(++sequence);
 trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',id);
 trigger.setAttribute('aria-label',select.getAttribute('aria-label')||select.name||'Seleção');
 trigger.innerHTML='<span class="gb-custom-select-value"></span>';
 const list=document.createElement('span');list.id=id;list.className='gb-custom-select-list';list.setAttribute('role','listbox');list.hidden=true;
 select.parentNode.insertBefore(wrapper,select);wrapper.append(select,trigger,list);
 select.classList.add('gb-custom-native-select');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
 refreshSelect(select);
}
function refreshDate(input){
 const wrap=input.closest('.gb-custom-date');
 const button=wrap?.querySelector('.gb-custom-date-trigger');
 if(!button)return;
 button.querySelector('.gb-custom-date-value').textContent=readableDate(input.value);
 button.disabled=input.disabled;
}
function enhanceDate(input){
 if(input.closest('.gb-custom-date')||input.dataset.gbNative==='true')return;
 const wrapper=document.createElement('span');wrapper.className='gb-custom-date';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='gb-custom-date-trigger';
 trigger.setAttribute('aria-label','Selecionar data');
 trigger.setAttribute('aria-haspopup','dialog');
 trigger.innerHTML='<span class="gb-custom-date-value"></span><span class="gb-custom-date-icon" aria-hidden="true">'+gbIcon('calendar-days')+'</span>';
 input.parentNode.insertBefore(wrapper,input);wrapper.append(input,trigger);
 input.classList.add('gb-custom-native-date');input.tabIndex=-1;input.setAttribute('aria-hidden','true');
 refreshDate(input);
}
export function enhanceGbControls(root=document){
 root.querySelectorAll?.('select').forEach(enhanceSelect);
 root.querySelectorAll?.('input[type="date"]').forEach(enhanceDate);
}
function closeMenu(){if(!openMenu)return;const {list,button}=openMenu;list.hidden=true;list.removeAttribute('style');button.setAttribute('aria-expanded','false');openMenu=null;}
function showMenu(button){
 if(openCalendar)closeCalendar();
 const wrapper=button.closest('.gb-custom-select');
 const list=wrapper?.querySelector('.gb-custom-select-list');
 if(!list)return;
 const same=openMenu?.button===button;
 closeMenu();if(same)return;
 refreshSelect(wrapper.querySelector('select'));list.hidden=false;button.setAttribute('aria-expanded','true');openMenu={button,list};
 const rect=button.getBoundingClientRect();
 const availableBelow=window.innerHeight-rect.bottom-12;
 const availableAbove=rect.top-12;
 const desired=Math.min(list.scrollHeight||260,290);
 const useAbove=availableBelow<Math.min(desired,125)&&availableAbove>availableBelow;
 const room=Math.max(70,useAbove?availableAbove:availableBelow);
 const height=Math.min(desired,room);
 const width=Math.min(Math.max(rect.width,220),Math.max(220,window.innerWidth-18));
 const left=Math.max(8,Math.min(rect.left,window.innerWidth-width-8));
 list.style.left=left+'px';
 list.style.right='auto';
 list.style.width=width+'px';
 list.style.top=(useAbove?Math.max(8,rect.top-height-5):rect.bottom+5)+'px';
 list.style.maxHeight=height+'px';
 list.querySelector('[aria-selected="true"]')?.focus({preventScroll:true});
}
function closeCalendar(){
 if(!openCalendar)return;
 const {backdrop,button}=openCalendar;
 if(backdrop.open)backdrop.close();
 backdrop.remove();openCalendar=null;
 button?.focus({preventScroll:true});
}
function parts(date){
 const [y,m,d]=(date||'').split('-').map(Number);
 return Number.isInteger(y)&&Number.isInteger(m)&&Number.isInteger(d)?{y,m,d}:null;
}
function dateISO(y,m,d){return [String(y).padStart(4,'0'),String(m).padStart(2,'0'),String(d).padStart(2,'0')].join('-');}
function monthHasDates(input,year,month){
 const first=dateISO(year,month,1);
 const endDay=new Date(Date.UTC(year,month,0)).getUTCDate();
 const last=dateISO(year,month,endDay);
 return (!input.min||last>=input.min)&&(!input.max||first<=input.max);
}
function yearHasDates(input,year){
 return (!input.min||dateISO(year,12,31)>=input.min)&&(!input.max||dateISO(year,1,1)<=input.max);
}
const monthNames=Array.from({length:12},(_,i)=>
 new Intl.DateTimeFormat('pt-BR',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2020,i,1))).replace('.',''));
const fullMonthNames=Array.from({length:12},(_,i)=>
 new Intl.DateTimeFormat('pt-BR',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2020,i,1))));
function renderCalendar(){
 if(!openCalendar)return;
 const {panel,input}=openCalendar,year=openCalendar.year,month=openCalendar.month;
 const mode=openCalendar.mode||'days';
 // Restrict both the day grid and the quick month/year selection.
 const min=input.min||'0001-01-01',max=input.max||'9999-12-31';
 const yearStart=openCalendar.yearPage;
 let navigation='',grid='';
 if(mode==='years'){
  navigation='<div class="gb-calendar-month"><button type="button" data-calendar-year-page="-12" aria-label="Anos anteriores">'+gbIcon('chevrons-left')+'</button>'+
   '<strong class="gb-calendar-year-range">'+yearStart+' – '+(yearStart+11)+'</strong>'+
   '<button type="button" data-calendar-year-page="12" aria-label="Próximos anos">'+gbIcon('chevrons-right')+'</button></div>';
  grid='<div class="gb-calendar-pick-grid gb-calendar-year-grid">'+
    Array.from({length:12},(_,i)=>{
     const y=yearStart+i,ok=yearHasDates(input,y);
     return '<button type="button" class="gb-calendar-pick'+(y===year?' selected':'')+'" data-calendar-year="'+y+'"'+(ok?'':' disabled')+' aria-label="Ano '+y+'">'+y+'</button>';
    }).join('')+'</div>';
 }else{
  const title=ptMonth.format(new Date(Date.UTC(year,month-1,1)));
  navigation='<div class="gb-calendar-month"><button type="button" data-calendar-shift="-1" aria-label="Mês anterior">'+gbIcon('chevron-left')+'</button>'+
   '<div class="gb-calendar-jump"><button type="button" data-calendar-month-view aria-label="Escolher mês" aria-expanded="'+(mode==='months')+'">'+escapeHtml(fullMonthNames[month-1])+' '+gbIcon('chevron-down')+'</button>'+
   '<button type="button" data-calendar-year-view aria-label="Escolher ano">'+year+' '+gbIcon('chevron-down')+'</button></div>'+
   '<button type="button" data-calendar-shift="1" aria-label="Próximo mês">'+gbIcon('chevron-right')+'</button></div>';
  if(mode==='months'){
   grid='<div class="gb-calendar-pick-grid gb-calendar-month-grid">'+monthNames.map((label,i)=>{
    const value=i+1,ok=monthHasDates(input,year,value);
    return '<button type="button" class="gb-calendar-pick'+(value===month?' selected':'')+'" data-calendar-month="'+value+'"'+(ok?'':' disabled')+' aria-label="'+escapeHtml(fullMonthNames[i])+'">'+escapeHtml(label)+'</button>';
   }).join('')+'</div>';
  }else{
   const start=new Date(Date.UTC(year,month-1,1)).getUTCDay();
   const days=new Date(Date.UTC(year,month,0)).getUTCDate();
   const cells=[...Array(start)].map(()=>'<span class="gb-calendar-empty" aria-hidden="true"></span>');
   for(let day=1;day<=days;day++){
    const iso=dateISO(year,month,day),disabled=iso<min||iso>max;
    cells.push('<button type="button" class="gb-calendar-day'+(input.value===iso?' selected':'')+'" data-calendar-day="'+iso+'"'+
     (disabled?' disabled':'')+' aria-label="'+day+' de '+title+'" aria-pressed="'+String(input.value===iso)+'">'+day+'</button>');
   }
   grid='<div class="gb-calendar-grid">'+ptWeek.map(d=>'<span class="gb-calendar-week">'+d+'</span>').join('')+cells.join('')+'</div>';
  }
 }
 panel.innerHTML='<header class="gb-calendar-header"><strong>Selecionar data</strong><button class="gb-calendar-close" type="button" data-calendar-close aria-label="Fechar">'+gbIcon('x')+'</button></header>'+
  navigation+grid+
  '<div class="gb-calendar-footer"><button type="button" data-calendar-today>Hoje</button><button type="button" data-calendar-close>Cancelar</button></div>';
}
function showCalendar(button){
 closeMenu();closeCalendar();
 const input=button.closest('.gb-custom-date')?.querySelector('input[type="date"]');
 if(!input)return;
 const now=new Date();
 const current=parts(input.value)||{y:now.getFullYear(),m:now.getMonth()+1,d:now.getDate()};
 const backdrop=document.createElement('dialog');backdrop.className='gb-calendar-backdrop';
 const panel=document.createElement('section');panel.className='gb-calendar-panel';
 panel.setAttribute('role','document');panel.setAttribute('aria-label','Calendário do GB+');
 backdrop.setAttribute('aria-label','Selecionar data');
 backdrop.append(panel);document.body.append(backdrop);
 openCalendar={backdrop,panel,button,input,year:current.y,month:current.m,yearPage:Math.floor(current.y/12)*12,mode:'days'};
 renderCalendar();
 try{backdrop.showModal();}catch(error){backdrop.remove();openCalendar=null;return;}
 panel.querySelector('[data-calendar-close]')?.focus({preventScroll:true});
}
function setCalendarDate(date){
 if(!openCalendar)return;
 const {input}=openCalendar;
 if(!isISO(date)||(input.min&&date<input.min)||(input.max&&date>input.max))return;
 input.value=date;refreshDate(input);
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.dispatchEvent(new Event('change',{bubbles:true}));
 closeCalendar();
}
function changeMonth(steps){
 if(!openCalendar)return;
 const next=new Date(Date.UTC(openCalendar.year,openCalendar.month-1+steps,1));
 openCalendar.year=next.getUTCFullYear();openCalendar.month=next.getUTCMonth()+1;
 renderCalendar();
}
export function installGbControls(){
 document.addEventListener('click',event=>{
  const element=event.target;
  const dropdown=element.closest?.('.gb-custom-select-trigger');
  if(dropdown){event.preventDefault();event.stopPropagation();showMenu(dropdown);return;}
  const option=element.closest?.('.gb-custom-select-option');
  if(option){
   event.preventDefault();event.stopPropagation();
   const select=option.closest('.gb-custom-select')?.querySelector('select');
   if(!select)return;
   select.value=option.dataset.value;
   refreshSelect(select);closeMenu();
   select.dispatchEvent(new Event('change',{bubbles:true}));
   option.closest('.gb-custom-select')?.querySelector('.gb-custom-select-trigger')?.focus({preventScroll:true});
   return;
  }
  const dateButton=element.closest?.('.gb-custom-date-trigger');
  if(dateButton){event.preventDefault();event.stopPropagation();showCalendar(dateButton);return;}
  if(element.closest?.('[data-calendar-close]')){closeCalendar();return;}
  const pickMonthView=element.closest?.('[data-calendar-month-view]');
  if(pickMonthView&&openCalendar){openCalendar.mode='months';renderCalendar();return;}
  const pickYearView=element.closest?.('[data-calendar-year-view]');
  if(pickYearView&&openCalendar){openCalendar.mode='years';openCalendar.yearPage=Math.floor(openCalendar.year/12)*12;renderCalendar();return;}
  const chooseYear=element.closest?.('[data-calendar-year]');
  if(chooseYear&&openCalendar&&!chooseYear.disabled){openCalendar.year=Number(chooseYear.dataset.calendarYear);openCalendar.mode='months';renderCalendar();return;}
  const chooseMonth=element.closest?.('[data-calendar-month]');
  if(chooseMonth&&openCalendar&&!chooseMonth.disabled){openCalendar.month=Number(chooseMonth.dataset.calendarMonth);openCalendar.mode='days';renderCalendar();return;}
  const shiftYear=element.closest?.('[data-calendar-year-page]');
  if(shiftYear&&openCalendar){openCalendar.yearPage+=Number(shiftYear.dataset.calendarYearPage);renderCalendar();return;}
  const shift=element.closest?.('[data-calendar-shift]');
  if(shift){changeMonth(Number(shift.dataset.calendarShift));return;}
  const day=element.closest?.('[data-calendar-day]');
  if(day){setCalendarDate(day.dataset.calendarDay);return;}
  if(element.closest?.('[data-calendar-today]')){
   const now=new Date();setCalendarDate(dateISO(now.getFullYear(),now.getMonth()+1,now.getDate()));return;
  }
  if(openCalendar&&element===openCalendar.backdrop){closeCalendar();return;}
  // Clicking the caption of a labelled date/select must not activate the
  // invisible browser control and accidentally open a native OS picker.
  const label=element.closest?.('label.field');
  if(label&&!element.closest?.('.gb-custom-select,.gb-custom-date')){
   const customDate=label.querySelector('.gb-custom-date-trigger');
   const customSelect=label.querySelector('.gb-custom-select-trigger');
   if(customDate){event.preventDefault();event.stopPropagation();showCalendar(customDate);return;}
   if(customSelect){event.preventDefault();event.stopPropagation();showMenu(customSelect);return;}
  }
  if(openMenu&&!element.closest?.('.gb-custom-select'))closeMenu();
 },true);
 document.addEventListener('keydown',event=>{
  if(openCalendar){
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeCalendar();return;}
   // Trap Tab within the date dialog instead of sending focus behind the overlay.
   if(event.key==='Tab'){
    const controls=[...openCalendar.panel.querySelectorAll('button:not([disabled])')];
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  }
  const source=event.target.closest?.('.gb-custom-select-trigger');
  if(source&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
   event.preventDefault();const wrap=source.closest('.gb-custom-select');
   if(!openMenu||openMenu.button!==source)showMenu(source);
   const all=[...wrap.querySelectorAll('.gb-custom-select-option:not([disabled])')];
   if(!all.length)return;
   if(event.key==='Home')all[0].focus();
   else if(event.key==='End')all[all.length-1].focus();
   else if(event.key==='ArrowUp')all[Math.max(0,all.findIndex(x=>x.getAttribute('aria-selected')==='true')-1)].focus();
   else all[Math.min(all.length-1,Math.max(0,all.findIndex(x=>x.getAttribute('aria-selected')==='true'))+1)].focus();
  }
  const option=event.target.closest?.('.gb-custom-select-option');
  if(option&&(event.key==='Enter'||event.key===' ')){event.preventDefault();option.click();}
  if(event.key==='Escape'&&openMenu){event.preventDefault();closeMenu();}
 },true);
 window.addEventListener('resize',closeMenu);
 document.addEventListener('scroll',event=>{if(openMenu&&!event.target.closest?.('.gb-custom-select-list'))closeMenu();},true);
 document.addEventListener('change',event=>{
  if(event.target.matches?.('select.gb-custom-native-select'))refreshSelect(event.target);
  if(event.target.matches?.('input.gb-custom-native-date'))refreshDate(event.target);
 });
 // Dynamic filter options and modal content can change without a route redraw.
 const observer=new MutationObserver(records=>{
  const roots=new Set();
  for(const record of records){
   if(record.target?.closest?.('.gb-custom-select-list,.gb-calendar-backdrop'))continue;
   if(record.target?.matches?.('select.gb-custom-native-select')){refreshSelect(record.target);continue;}
   for(const node of record.addedNodes||[])if(node.nodeType===1)roots.add(node);
  }
  for(const root of roots){
   if(root.matches?.('select'))enhanceSelect(root);
   if(root.matches?.('input[type="date"]'))enhanceDate(root);
   enhanceGbControls(root);
  }
 });
 for(const node of [document.getElementById('main'),document.getElementById('modal'),document.getElementById('mobile-navigation')].filter(Boolean)){
  observer.observe(node,{subtree:true,childList:true});
 }
 enhanceGbControls(document);
}
