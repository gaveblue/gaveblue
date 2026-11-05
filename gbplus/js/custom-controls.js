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
 list.innerHTML=selectOptions(select).map(({value,title,disabled,selected})=>
  '<button type="button" role="option" class="gb-custom-select-option'+(selected?' is-active':'')+'" aria-selected="'+String(selected)+'" data-value="'+escapeHtml(value)+'"'+(disabled?' disabled':'')+'><span>'+escapeHtml(title)+'</span>'+(selected?'<span class="gb-custom-check" aria-hidden="true">✓</span>':'')+'</button>'
 ).join('');
}
function enhanceSelect(select){
 if(select.closest('.gb-entry-select,.gb-custom-select')||select.classList.contains('gb-entry-source')||select.dataset.gbNative==='true'||select.multiple||select.size>1)return;
 const wrapper=document.createElement('span');wrapper.className='gb-custom-select';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='gb-custom-select-trigger';
 const id='gb-custom-list-'+(++sequence);
 trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',id);
 trigger.setAttribute('aria-label',select.getAttribute('aria-label')||select.name||'Seleção');
 trigger.innerHTML='<span class="gb-custom-select-value"></span><span class="gb-custom-chevron" aria-hidden="true">⌄</span>';
 const list=document.createElement('span');list.id=id;list.className='gb-custom-select-list';list.setAttribute('role','listbox');list.hidden=true;
 select.parentNode.insertBefore(wrapper,select);wrapper.append(select,trigger,list);
 select.classList.add('gb-custom-native-select');select.tabIndex=-1;
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
 trigger.innerHTML='<span class="gb-custom-date-value"></span><span class="gb-custom-date-icon" aria-hidden="true">▦</span>';
 input.parentNode.insertBefore(wrapper,input);wrapper.append(input,trigger);
 input.classList.add('gb-custom-native-date');input.tabIndex=-1;
 refreshDate(input);
}
export function enhanceGbControls(root=document){
 root.querySelectorAll?.('select').forEach(enhanceSelect);
 root.querySelectorAll?.('input[type="date"]').forEach(enhanceDate);
}
function closeMenu(){if(!openMenu)return;const {list,button}=openMenu;list.hidden=true;button.setAttribute('aria-expanded','false');openMenu=null;}
function showMenu(button){
 if(openCalendar)closeCalendar();
 const wrapper=button.closest('.gb-custom-select');
 const list=wrapper?.querySelector('.gb-custom-select-list');
 if(!list)return;
 const same=openMenu?.button===button;
 closeMenu();if(same)return;
 refreshSelect(wrapper.querySelector('select'));list.hidden=false;button.setAttribute('aria-expanded','true');openMenu={button,list};
 list.querySelector('[aria-selected="true"]')?.focus({preventScroll:true});
}
function closeCalendar(){
 if(!openCalendar)return;
 const {backdrop,button}=openCalendar;
 backdrop.remove();openCalendar=null;
 button?.focus({preventScroll:true});
}
function parts(date){
 const [y,m,d]=(date||'').split('-').map(Number);
 return Number.isInteger(y)&&Number.isInteger(m)&&Number.isInteger(d)?{y,m,d}:null;
}
function dateISO(y,m,d){return [String(y).padStart(4,'0'),String(m).padStart(2,'0'),String(d).padStart(2,'0')].join('-');}
function renderCalendar(){
 if(!openCalendar)return;
 const {panel,input}=openCalendar;const y=openCalendar.year,m=openCalendar.month;
 const start=new Date(Date.UTC(y,m-1,1)).getUTCDay();
 const days=new Date(Date.UTC(y,m,0)).getUTCDate();
 const min=input.min||'0001-01-01',max=input.max||'9999-12-31';
 const title=ptMonth.format(new Date(Date.UTC(y,m-1,1)));
 const cells=[...Array(start)].map(()=>'<span class="gb-calendar-empty" aria-hidden="true"></span>');
 for(let day=1;day<=days;day++){
  const iso=dateISO(y,m,day);
  const disabled=iso<min||iso>max;
  cells.push('<button type="button" class="gb-calendar-day'+(input.value===iso?' selected':'')+'" data-calendar-day="'+iso+'"'+
   (disabled?' disabled':'')+' aria-label="'+day+' de '+title+'" aria-pressed="'+String(input.value===iso)+'">'+day+'</button>');
 }
 panel.innerHTML='<header class="gb-calendar-header"><strong>Selecionar data</strong><button class="gb-calendar-close" type="button" data-calendar-close aria-label="Fechar">×</button></header>'+
 '<div class="gb-calendar-month"><button type="button" data-calendar-shift="-12" aria-label="Ano anterior">«</button><button type="button" data-calendar-shift="-1" aria-label="Mês anterior">‹</button><strong>'+escapeHtml(title)+'</strong><button type="button" data-calendar-shift="1" aria-label="Próximo mês">›</button><button type="button" data-calendar-shift="12" aria-label="Próximo ano">»</button></div>'+
 '<div class="gb-calendar-grid">'+ptWeek.map(d=>'<span class="gb-calendar-week">'+d+'</span>').join('')+cells.join('')+'</div>'+
 '<div class="gb-calendar-footer"><button type="button" data-calendar-today>Hoje</button><button type="button" data-calendar-close>Cancelar</button></div>';
}
function showCalendar(button){
 closeMenu();closeCalendar();
 const input=button.closest('.gb-custom-date')?.querySelector('input[type="date"]');
 if(!input)return;
 const now=new Date();
 const current=parts(input.value)||{y:now.getFullYear(),m:now.getMonth()+1,d:now.getDate()};
 const backdrop=document.createElement('div');backdrop.className='gb-calendar-backdrop';
 const panel=document.createElement('section');panel.className='gb-calendar-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Calendário do GB+');
 backdrop.append(panel);(input.closest('dialog[open]')||document.body).append(backdrop);
 openCalendar={backdrop,panel,button,input,year:current.y,month:current.m};
 renderCalendar();panel.querySelector('[data-calendar-close]')?.focus({preventScroll:true});
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
  const shift=element.closest?.('[data-calendar-shift]');
  if(shift){changeMonth(Number(shift.dataset.calendarShift));return;}
  const day=element.closest?.('[data-calendar-day]');
  if(day){setCalendarDate(day.dataset.calendarDay);return;}
  if(element.closest?.('[data-calendar-today]')){
   const now=new Date();setCalendarDate(dateISO(now.getFullYear(),now.getMonth()+1,now.getDate()));return;
  }
  if(openCalendar&&element===openCalendar.backdrop){closeCalendar();return;}
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
