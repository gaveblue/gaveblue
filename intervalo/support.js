import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {menuButtonMarkup} from './global-navigation-rc7.js?v=1.2.0-rc.7';
import {sheetifyForms,showFormSheetError} from './operational-sheets-rc15.js?v=1.0.0-rc.15';
import {mountPrintSettings} from './print-settings-rc2.js?v=1.2.0-rc.12';
import {initProductPhotoForm,resolveProductPhoto} from './product-photo-rc19.js?v=1.1.0-rc.20';
// Intervalo — cadastros operacionais auxiliares (mesas, estoque, dispositivos, relatórios).
export async function renderPage({supabase,restaurant,module,box,esc,link}){
 document.body.classList.add('iv-fullwidth','iv-support');
 const css='<link rel="stylesheet" href="/intervalo/product-photo-rc19.css?v=1.1.0-rc.20"><style>.x-panel{padding:19px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;margin:13px 0}.x-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:14px}.x-form{display:flex;flex-wrap:wrap;gap:12px;align-items:end}.x-form label{flex:1 1 180px;font-size:12px;font-weight:700}.x-form input,.x-form select{display:block;width:100%;margin-top:7px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a}.x-form button,.x-btn{padding:11px 14px;background:#0f766e;color:#fff;border:0;border-radius:9px;cursor:pointer;font-size:12px;font-weight:700}.x-muted{font-size:12px;color:#64748b}.x-note{font-size:12px;line-height:1.55;background:#fff7ed;border:1px solid #fdba74;border-radius:10px;color:#9a3412;padding:13px}.x-panel h3{margin:2px 0 11px}</style>';
 const productArea=module==='estoque'&&new URLSearchParams(location.search).get('aba')==='produtos';
 const names={mesas:'Mesas e salões',estoque:productArea?'Produtos':'Estoque',impressao:'Impressão',relatorios:'Relatórios operacionais'};
 const title=css+'<div class="iv-header"><div><div class="iv-global-title">'+menuButtonMarkup()+'<div><span class="iv-section-caption">OPERAÇÃO DO RESTAURANTE</span><h1>'+esc(names[module]??'Operação')+'</h1></div></div><p>'+esc(restaurant.name)+'</p></div><a class="iv-btn secondary" href="'+link('/'+restaurant.slug+'/gestao'+(module==='estoque'?(productArea?'?tab=produtos':'?tab=estoque'):''))+'">'+icon('arrowLeft',16)+' Voltar</a></div>';
 const fmt=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const call=async(action,params={})=>{const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...params}});if(r.error||r.data?.error){let message=r.data?.error??r.error?.message??'Falha';try{const x=await r.error?.context?.json?.();if(x?.error)message=x.error}catch{}throw Error(message)}return r.data};
 const form=(id,callback)=>{const f=document.getElementById(id);if(!f)return;f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button[type=submit]');b.disabled=true;try{await callback(Object.fromEntries(new FormData(f).entries()),f);await load()}catch(err){if(!showFormSheetError(f,err.message))alert(err.message);b.disabled=false}}};
 const stockTabsAllowed=["insumos","produtos","fichas","historico"];
 let stockTab=stockTabsAllowed.includes(new URLSearchParams(location.search).get("aba"))?new URLSearchParams(location.search).get("aba"):"insumos";
 const moneyInput=n=>(Number(n??0)/100).toFixed(2).replace(".",",");
 const cents=value=>{const raw=String(value??"").trim().replace(/\s/g,"");const text=raw.includes(",")?raw.replace(/\./g,"").replace(",","."):raw;if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(text))throw Error("Informe um preço válido, como 24,90");const [a,b=""]=text.split(".");return Number(a)*100+Number((b+"00").slice(0,2))};
 async function load({quiet=false}={}){
  if(!quiet)box(title+'<div class="iv-loading-inline" role="status" aria-live="polite" aria-busy="true"><div class="iv-loading-inline-label"><span class="iv-load-dot" aria-hidden="true"></span><span>Buscando as informações...</span></div><div class="iv-loading-inline-lines" aria-hidden="true"><span class="iv-load-skeleton"></span><span class="iv-load-skeleton"></span></div></div>');
  try{
  if(module==='mesas'){
    document.body.classList.add('iv-tables');
    const {tables=[]}=await call('tables');
    const tableStyle='<link rel="stylesheet" href="/intervalo/tables-design-rc14.css?v=1.0.0-rc.14">';
    const activeCount=tables.filter(t=>t.active).length;
    let tableFilter='all';
    const tableIcon=icon('table',20);
    const filters=[['all','Todas'],['active','Ativas'],['inactive','Inativas']];
    function openTableSheet(table){
      const editing=!!table;
      const dialog=document.createElement('dialog');dialog.className='iv-table-sheet';
      dialog.setAttribute('aria-label',editing?'Editar mesa '+table.label:'Cadastrar nova mesa');
      const form=document.createElement('form');form.noValidate=true;form.autocomplete='off';
      const safe=(v)=>esc(String(v??''));
      form.innerHTML='<div class="iv-table-sheet-top"><button type="button" class="iv-table-sheet-grip" aria-label="Arraste para expandir ou fechar o painel"></button>'
       +'<div class="iv-table-sheet-heading"><div><h2 id="iv-table-sheet-title">'+(editing?'Editar mesa':'Nova mesa')+'</h2><p>'+(editing?'Altere os dados e a disponibilidade da mesa.':'Preencha as informações para adicionar a mesa ao salão.')+'</p></div>'
       +'<button type="button" class="iv-table-sheet-close" aria-label="Fechar painel">'+icon('x',20)+'</button></div></div>'
       +'<div class="iv-table-sheet-body">'
       +'<div class="iv-table-field"><label for="iv-table-name">Nome da mesa</label><input id="iv-table-name" name="label" type="text" maxlength="45" placeholder="Ex.: Mesa 4" value="'+safe(table?.label??'')+'" aria-describedby="iv-table-err-name"><p id="iv-table-err-name" class="iv-table-error" aria-live="polite"></p></div>'
       +'<div class="iv-table-field"><label for="iv-table-area">Salão / ambiente</label><input id="iv-table-area" name="area" type="text" maxlength="60" placeholder="Ex.: Salão principal" value="'+safe(table?.area??'Salão')+'" aria-describedby="iv-table-err-area"><p id="iv-table-err-area" class="iv-table-error" aria-live="polite"></p></div>'
       +'<div class="iv-table-field"><label for="iv-table-seats">Capacidade (pessoas)</label><input id="iv-table-seats" name="seats" type="text" inputmode="numeric" maxlength="2" placeholder="4" value="'+safe(table?.seats??4)+'" aria-describedby="iv-table-err-seats"><p id="iv-table-err-seats" class="iv-table-error" aria-live="polite"></p></div>'
       +(editing?'<label class="iv-table-toggle"><span>Mesa ativa<small>Desative se não quiser disponibilizá-la para novos atendimentos.</small></span><input type="checkbox" name="active" '+(table.active?'checked':'')+' aria-label="Mesa ativa"></label>'
        +'<p class="iv-table-sheet-note">Se houver comanda em andamento, o sistema poderá impedir a desativação até o atendimento terminar.</p>':'')
       +'<p class="iv-table-sheet-feedback" id="iv-table-sheet-error" role="alert" aria-live="assertive"></p></div>'
       +'<div class="iv-table-sheet-actions"><button type="button" class="iv-table-sheet-cancel">Cancelar</button><button type="submit" class="iv-table-sheet-save">'+(editing?'Salvar alterações':'Cadastrar mesa')+'</button></div>';
      dialog.append(form);document.body.append(dialog);
      const close=dialog.querySelector('.iv-table-sheet-close'),cancel=dialog.querySelector('.iv-table-sheet-cancel'),grip=dialog.querySelector('.iv-table-sheet-grip');
      const submit=form.querySelector('.iv-table-sheet-save'),error=form.querySelector('#iv-table-sheet-error');
      const fields={label:form.elements.namedItem('label'),area:form.elements.namedItem('area'),seats:form.elements.namedItem('seats')};
      let saving=false,dragStart=null,dragMove=0;
      const clearErrors=()=>{
        error.textContent='';
        for(const [key,field] of Object.entries(fields)){
          field.removeAttribute('aria-invalid');
          const errorLabel=form.querySelector('#iv-table-err-'+({label:'name',area:'area',seats:'seats'}[key]));
          if(errorLabel)errorLabel.textContent='';
        }
      };
      const fieldError=(fieldKey,message)=>{
        const field=fields[fieldKey];field?.setAttribute('aria-invalid','true');
        const key=fieldKey==='label'?'name':fieldKey;
        const target=form.querySelector('#iv-table-err-'+key);
        if(target)target.textContent=message;
      };
      const setSaving=(busy)=>{
        saving=busy;submit.disabled=busy;cancel.disabled=busy;close.disabled=busy;
        submit.textContent=busy?'Salvando...':editing?'Salvar alterações':'Cadastrar mesa';
        form.setAttribute('aria-busy',String(busy));
      };
      form.addEventListener('input',()=>{clearErrors()});
      form.onsubmit=async event=>{
        event.preventDefault();if(saving)return;
        clearErrors();
        const label=fields.label.value.trim(),area=fields.area.value.trim(),seatText=fields.seats.value.trim(),seats=Number(seatText);
        let invalid=false;
        if(!label||label.length>45){fieldError('label','Informe o nome da mesa (até 45 caracteres).');invalid=true}
        if(!area||area.length>60){fieldError('area','Informe o salão ou ambiente (até 60 caracteres).');invalid=true}
        if(!/^[0-9]{1,2}$/.test(seatText)||!Number.isInteger(seats)||seats<1||seats>50){fieldError('seats','Informe uma capacidade entre 1 e 50 pessoas.');invalid=true}
        if(invalid)return;
        const payload={label,area,seats,active:editing?!!form.elements.namedItem('active').checked:true};
        setSaving(true);
        try{
          await call(editing?'table_update':'table_create',editing?{id:table.id,...payload}:payload);
          await load({quiet:true});
          dialog.close();
        }catch(e){
          error.textContent=e.message??'Não foi possível salvar. Tente novamente.';
          setSaving(false);
        }
      };
      const requestClose=()=>{if(!saving)dialog.close()};
      close.onclick=requestClose;cancel.onclick=requestClose;
      dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault()});
      dialog.addEventListener('close',()=>{window.visualViewport?.removeEventListener('resize',alignKeyboard);window.visualViewport?.removeEventListener('scroll',alignKeyboard);window.removeEventListener('resize',alignKeyboard);dialog.remove()},{once:true});
      dialog.addEventListener('click',e=>{if(e.target===dialog)requestClose()});
      grip.addEventListener('pointerdown',e=>{if(saving)return;dragStart=e.clientY;dragMove=0;grip.setPointerCapture?.(e.pointerId)});
      grip.addEventListener('pointermove',e=>{if(dragStart===null)return;dragMove=e.clientY-dragStart;if(dragMove>0)dialog.style.transform='translateY('+Math.min(dragMove,200)+'px)'});
      const finishDrag=()=>{
        if(dragStart===null)return;
        const delta=dragMove;dragStart=null;dragMove=0;dialog.style.transform='';
        if(delta>85)requestClose();else if(delta< -45)dialog.classList.add('is-expanded');
      };
      grip.addEventListener('pointerup',finishDrag);grip.addEventListener('pointercancel',finishDrag);
      function alignKeyboard(){
        if(!dialog.isConnected)return;
        const viewport=window.visualViewport,viewHeight=viewport?.height??window.innerHeight;
        const keyboard=Math.max(0,window.innerHeight-(viewHeight+(viewport?.offsetTop??0)));
        dialog.style.bottom=keyboard?Math.round(keyboard)+'px':(window.matchMedia('(min-width:701px)').matches?'12px':'0px');
        dialog.style.setProperty('--table-vh',Math.max(210,Math.round(viewHeight-8))+'px');
      }
      window.visualViewport?.addEventListener('resize',alignKeyboard);
      window.visualViewport?.addEventListener('scroll',alignKeyboard);
      window.addEventListener('resize',alignKeyboard);
      dialog.showModal();alignKeyboard();
      // O foco começa no botão Fechar: o teclado só abre após um toque intencional no campo.
      close.focus({preventScroll:true});
    }
    function paintTables(){
      const visible=tables.filter(t=>tableFilter==='all'||(tableFilter==='active'?!!t.active:!t.active));
      let out=title+tableStyle
       +'<section class="iv-tables-toolbar"><div><h2>Mesas e salões</h2><p>Gerencie os espaços de atendimento sem sair desta tela.</p></div>'
       +'<button type="button" class="iv-tables-create" id="iv-tables-create">'+icon('plus',18)+' Nova mesa</button></section>'
       +'<div class="iv-tables-summary"><span class="iv-tables-stat">'+icon('table',15)+' <b>'+tables.length+'</b> mesas</span>'
       +'<span class="iv-tables-stat"><b>'+activeCount+'</b> ativas</span>'
       +'<span class="iv-tables-stat"><b>'+(tables.length-activeCount)+'</b> inativas</span></div>'
       +'<div class="iv-tables-filters" role="group" aria-label="Filtro de mesas">'
       +filters.map(([key,label])=>'<button type="button" data-table-filter="'+key+'" aria-pressed="'+(tableFilter===key)+'">'+label+'</button>').join('')+'</div>'
       +'<div class="iv-tables-list">';
      for(const t of visible){
        out+='<button type="button" class="iv-table-card '+(t.active?'':'inactive')+'" data-table-edit="'+esc(t.id)+'" aria-label="Editar mesa '+esc(t.label)+'">'
          +'<span class="iv-table-card-head"><span class="iv-table-card-symbol">'+tableIcon+'</span>'+icon('chevronRight',16)+'</span>'
          +'<span class="iv-table-card-name">'+esc(t.label)+'</span>'
          +'<span class="iv-table-card-meta">'+esc(t.area)+' · '+esc(t.seats)+' lugar(es)</span>'
          +'<span class="iv-table-card-foot"><span class="iv-table-status">'+(t.active?'Ativa':'Inativa')+'</span><span class="iv-table-card-edit">Editar '+icon('chevronRight',12)+'</span></span></button>';
      }
      if(!visible.length)out+='<div class="iv-table-empty">'+icon('table',24)+'<strong>'+(tables.length?'Nenhuma mesa neste filtro':'Nenhuma mesa cadastrada')+'</strong>'
       +(tables.length?'Selecione outro filtro para visualizar suas mesas.':'Toque em Nova mesa para cadastrar o primeiro espaço.')+'</div>';
      out+='</div>';
      box(out);
      document.getElementById('iv-tables-create')?.addEventListener('click',()=>openTableSheet(null));
      document.querySelectorAll('[data-table-edit]').forEach(button=>button.addEventListener('click',()=>{
        const table=tables.find(t=>String(t.id)===button.dataset.tableEdit);
        if(table)openTableSheet(table);
      }));
      document.querySelectorAll('[data-table-filter]').forEach(button=>button.addEventListener('click',()=>{
        tableFilter=button.dataset.tableFilter;paintTables();
      }));
    }
    paintTables();
  }else if(module==='estoque'){
    document.body.classList.add('iv-inventory');
    const [stocks,commercial]=await Promise.all([call('stock_list'),call('catalog')]);
    const items=stocks.items??[],recipes=stocks.recipes??[],movements=stocks.movements??[];
    const products=commercial.products??[],categories=commercial.categories??[],activeCats=categories.filter(c=>c.active);
    const active=items.filter(i=>i.active),opts=(rows,id,label)=>rows.map(x=>'<option value="'+esc(x[id])+'">'+esc(x[label])+'</option>').join('');
    const low=active.filter(i=>Number(i.quantity)<=Number(i.min_quantity));
    const exposed=products.filter(p=>p.show_on_menu&&p.available&&activeCats.some(c=>c.id===p.category_id));
    const validTab=stockTabsAllowed.includes(stockTab)?stockTab:"insumos";
    const style='<style>'+ "\n/* Intervalo Produtos: controles compactos e layout de aplicativo móvel */\n.iv-inventory .x-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;max-width:640px;background:#fff;border:1px solid #e9edf3;border-radius:16px;padding:5px;margin:17px 0 21px;box-shadow:0 3px 14px #202c4010;overflow:hidden}\n.iv-inventory .x-tabs button{display:flex;align-items:center;justify-content:center;gap:8px;min-width:0;width:100%;padding:12px 8px;background:transparent;border:1px solid transparent;border-radius:12px;color:#66758a;font-size:12px;font-weight:750;cursor:pointer;white-space:nowrap;transition:background-color .15s,color .15s}\n.iv-inventory .x-tabs button[aria-pressed=true]{background:#fff0e4;border-color:#ffdcc1;color:#d75c00}\n.iv-inventory .x-tabs .iv-icon{width:19px;height:19px;flex:none}\n.iv-inventory .x-mini-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:8px 0 13px}\n.iv-inventory .x-mini-stats .x-panel{margin:0;min-width:0;box-shadow:none}\n.iv-inventory .x-mini-stats b{font-size:26px;display:block;letter-spacing:-.7px}\n.iv-inventory .x-mini-stats span{font-size:11px;color:#718095;line-height:1.3;display:block}\n.iv-inventory .x-product-card{display:flex;flex-direction:column;gap:3px;padding:16px!important}\n.iv-inventory .x-product-head{display:flex;gap:12px;align-items:center;padding-bottom:10px;min-width:0}\n.iv-inventory .x-product-head>div{min-width:0;flex:1}\n.iv-inventory .x-product-photo{width:64px;height:64px;object-fit:cover;border-radius:13px;background:#fff1e5;border:1px solid #ffead5;flex:none}\n.iv-inventory .x-product-placeholder{width:64px;height:64px;display:grid;place-items:center;background:#fff3e8;color:#eb7100;border-radius:13px;flex:none}\n.iv-inventory .x-product-head h3{margin:0 0 4px;font-size:16px;line-height:1.25;overflow-wrap:anywhere}\n.iv-inventory .x-product-head strong{font-size:17px;color:#d85e00}\n.iv-inventory .x-switch-row{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:62px;width:100%;min-width:0;border-top:1px solid #f0f2f6;padding:10px 0;margin:0;font-size:12px;cursor:pointer}\n.iv-inventory .x-switch-row>span{display:flex;align-items:center;gap:9px;min-width:0;flex:1}\n.iv-inventory .x-switch-copy>.iv-icon{width:19px;height:19px;color:#eb7100;flex:none}\n.iv-inventory .x-switch-copy>span{min-width:0;display:block}\n.iv-inventory .x-switch-copy strong{display:block;font-size:12px;color:#26354b;font-weight:800;line-height:1.3}\n.iv-inventory .x-switch-copy small{display:block;margin-top:3px;font-size:11px;color:#8a96a6;line-height:1.3;font-weight:500}\n/* Explicitly override the generic .x-form input {width:100%; padding:10px 12px}. */\n.iv-inventory input[type=\"checkbox\"].x-toggle,\n.iv-inventory .x-form input[type=\"checkbox\"].x-toggle{\n  -webkit-appearance:none!important;appearance:none!important;display:block!important;\n  flex:0 0 46px!important;width:46px!important;min-width:46px!important;max-width:46px!important;\n  height:26px!important;min-height:26px!important;max-height:26px!important;\n  padding:0!important;margin:0 2px 0 8px!important;box-sizing:border-box!important;\n  border:1px solid #cbd2dd!important;border-radius:999px!important;background:#cbd2dd!important;\n  position:relative;vertical-align:middle;box-shadow:inset 0 1px 2px #27354b15;\n  cursor:pointer;transition:background-color .18s,border-color .18s,box-shadow .18s;\n}\n.iv-inventory input[type=\"checkbox\"].x-toggle:before{content:\"\";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #202b3d30;transition:transform .18s}\n.iv-inventory input[type=\"checkbox\"].x-toggle:checked,\n.iv-inventory .x-form input[type=\"checkbox\"].x-toggle:checked{background:#ff7600!important;border-color:#ff7600!important}\n.iv-inventory input[type=\"checkbox\"].x-toggle:checked:before{transform:translateX(20px)}\n.iv-inventory input[type=\"checkbox\"].x-toggle:focus-visible{outline:3px solid #ffb067!important;outline-offset:3px}\n.iv-inventory input[type=\"checkbox\"].x-toggle:disabled{opacity:.65;cursor:wait}\n.iv-inventory .x-form label.x-switch-row{flex:1 1 100%!important;width:100%;min-width:0;max-width:none;display:flex;align-items:center;justify-content:space-between}\n.iv-inventory .x-product-card details{border-top:1px solid #edf0f4;padding-top:13px;margin-top:6px}\n.iv-inventory .x-product-card summary{display:flex;align-items:center;gap:8px;color:#e26700;font-size:12px;font-weight:850;cursor:pointer;list-style:none;min-height:38px}\n.iv-inventory .x-product-card summary::-webkit-details-marker{display:none}\n.iv-inventory .x-product-card .x-form{margin-top:14px}\n.iv-inventory .x-product-note{color:#8390a1;font-size:11px;line-height:1.5}\n.iv-inventory .x-product-card .x-panel{margin:0}\n.iv-inventory .x-create-panel{padding:0!important;overflow:hidden}\n.iv-inventory .x-create-panel>summary{display:flex;align-items:center;gap:12px;padding:16px;min-height:58px;cursor:pointer;list-style:none;color:#192a40;font-size:14px;font-weight:850}\n.iv-inventory .x-create-panel>summary::-webkit-details-marker{display:none}\n.iv-inventory .x-create-panel>summary .x-create-icon{width:35px;height:35px;display:grid;place-items:center;border-radius:11px;background:#fff1e5;color:#ed6c00;flex:none}\n.iv-inventory .x-create-panel>summary .x-create-desc{display:block;font-size:11px;color:#8a96a6;font-weight:500;margin-top:2px}\n.iv-inventory .x-create-panel>summary .x-create-arrow{margin-left:auto;color:#de6800}\n.iv-inventory .x-create-panel[open]>summary .x-create-arrow{transform:rotate(90deg)}\n.iv-inventory .x-create-panel .x-form{padding:16px;border-top:1px solid #eff1f5;margin:0}\n.iv-inventory .x-create-panel .x-form>button{margin-top:6px}\n.iv-inventory .x-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,255px),1fr))}\n.iv-inventory .x-form label:not(.x-switch-row){min-width:0}\n@media(max-width:700px){\n body.iv-inventory #app .wrap{max-width:600px!important;padding:18px 14px calc(108px + env(safe-area-inset-bottom))!important}\n .iv-inventory .iv-header{align-items:center;gap:10px;margin-bottom:17px}\n .iv-inventory .iv-header h1{font-size:24px!important;letter-spacing:-.6px}\n .iv-inventory .iv-header .iv-btn{font-size:11px;padding:9px 12px}\n .iv-inventory .x-mini-stats{gap:7px}\n .iv-inventory .x-mini-stats .x-panel{padding:11px 10px!important;border-radius:13px}\n .iv-inventory .x-mini-stats b{font-size:22px}\n .iv-inventory .x-mini-stats span{font-size:10px}\n .iv-inventory .x-tabs{position:fixed;bottom:0;left:0;right:0;z-index:30;width:100%;max-width:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:0;padding:8px 7px max(10px,env(safe-area-inset-bottom));border-radius:18px 18px 0 0;border-left:0;border-right:0;border-bottom:0;box-shadow:0 -7px 28px #24334b20;background:#fff}\n .iv-inventory .x-tabs button{flex-direction:column;gap:4px;padding:8px 2px;min-height:55px;font-size:10px;font-weight:750;line-height:1.2}\n .iv-inventory .x-tabs .iv-icon{width:21px;height:21px}\n .iv-inventory .x-grid{display:block}\n .iv-inventory .x-grid>.x-panel{margin:0 0 11px}\n .iv-inventory .x-product-card{border-radius:17px!important;padding:15px!important}\n .iv-inventory .x-switch-row{min-height:62px}\n .iv-inventory .x-form{display:grid;grid-template-columns:minmax(0,1fr);gap:13px}\n .iv-inventory .x-form label:not(.x-switch-row){display:block;width:100%}\n .iv-inventory .x-form label:not(.x-switch-row) input,\n .iv-inventory .x-form label:not(.x-switch-row) select{width:100%;box-sizing:border-box}\n .iv-inventory .x-form>button{width:100%;min-height:46px}\n .iv-inventory .iv-toolbar{gap:9px}\n .iv-inventory .iv-toolbar h2{font-size:17px}\n .iv-inventory .iv-toolbar .iv-btn{font-size:11px}\n .iv-inventory .x-note{font-size:11px;line-height:1.6}\n}\n@media(prefers-reduced-motion:reduce){.iv-inventory .x-toggle,.iv-inventory .x-toggle:before,.iv-inventory .x-tabs button{transition:none!important}}\n" +'</style>';
    let out=title+style
     +'<style>.iv-inventory .x-tabs{grid-template-columns:repeat(3,minmax(0,1fr))!important}.iv-inventory .x-tabs a{display:flex;align-items:center;justify-content:center;gap:5px;padding:10px 4px;font-size:12px;font-weight:650;color:#64748b;text-decoration:none}.iv-inventory .x-tabs a[aria-current=page]{background:#fff0e4;color:#dc6b00;border-radius:10px}</style>'
     +(productArea?'<div class="x-mini-stats"><div class="x-panel"><b>'+products.length+'</b><span>Produtos</span></div><div class="x-panel"><b>'+exposed.length+'</b><span>No cardápio</span></div></div>':'<div class="x-mini-stats"><div class="x-panel"><b>'+items.length+'</b><span>Insumos</span></div><div class="x-panel"><b>'+low.length+'</b><span>Em alerta</span></div></div>')
     +'<nav class="x-tabs" aria-label="'+(productArea?'Produtos':'Estoque')+'">'
     +(productArea?'<a aria-current="page" href="'+link('/'+restaurant.slug+'/estoque?aba=produtos')+'">Produtos</a><a href="'+link('/'+restaurant.slug+'/catalogo?aba=categorias')+'">Categorias</a><a href="'+link('/'+restaurant.slug+'/catalogo?aba=adicionais')+'">Adicionais</a>':[['insumos','package','Insumos'],['fichas','clipboard','Fichas técnicas'],['historico','clock','Movimentações']].map(([id,ic,label])=>'<button type="button" data-stock-tab="'+id+'" aria-pressed="'+(validTab===id)+'">'+icon(ic,17)+label+'</button>').join(''))
     +'</nav>';

    if(validTab==='insumos'){
      out+='<p class="x-note">Insumos representam ingredientes e materiais controlados em quantidade. Eles <b>não aparecem automaticamente no cardápio</b>; a venda acontece pelos Produtos.</p>'
       +'<section class="x-panel"><h2>'+icon('plus',19)+' Novo insumo</h2>'
       +'<form id="newstock" class="x-form"><label>Nome<input name="name" required minlength="2" maxlength="120" placeholder="Ex.: Carne bovina"></label>'
       +'<label>Unidade<select name="unit"><option value="un">Unidades</option><option value="kg">Kg</option><option value="g">Gramas</option><option value="l">Litros</option><option value="ml">mL</option></select></label>'
       +'<label>Saldo inicial<input name="quantity" type="number" min="0" step=".001" value="0" required></label>'
       +'<label>Estoque mínimo<input name="min_quantity" type="number" min="0" step=".001" value="0" required></label>'
       +'<button type="submit">'+icon('plus',16)+' Cadastrar insumo</button></form></section>'
       +'<div class="iv-toolbar"><h2>Insumos ('+items.length+')</h2><span class="iv-chip '+(low.length?'danger':'success')+'">'+low.length+' abaixo do mínimo</span></div><div class="x-grid">';
      for(const item of items){
        const isLow=Number(item.quantity)<=Number(item.min_quantity);
        const unitOptions=[['un','Unidades'],['kg','Kg'],['g','Gramas'],['l','Litros'],['ml','mL']]
          .map(([id,label])=>'<option value="'+id+'" '+(id===item.unit?'selected':'')+'>'+label+'</option>').join('');
        out+='<article class="x-panel"><h3>'+icon('package',18)+' '+esc(item.name)+'</h3><p>Saldo atual: <b>'+esc(item.quantity)+' '+esc(item.unit)+'</b></p>'
          +'<p class="x-muted">Estoque mínimo: '+esc(item.min_quantity)+' · <span class="iv-chip '+(!item.active?'':isLow?'danger':'success')+'">'+(!item.active?'Arquivado':isLow?'Repor':'Regular')+'</span></p>'
          +'<form class="x-form" data-edit-stock="'+esc(item.id)+'"><label>Nome<input name="name" required minlength="2" maxlength="120" value="'+esc(item.name)+'"></label>'
          +'<label>Unidade<select name="unit">'+unitOptions+'</select></label>'
          +'<label>Estoque mínimo<input name="min_quantity" type="number" min="0" max="10000000" step=".001" required value="'+esc(item.min_quantity)+'"></label>'
          +'<p class="x-muted">Para corrigir o saldo, use uma movimentação; o histórico não é alterado aqui.</p>'
          +'<button type="submit">'+icon('checkCircle',16)+' Salvar insumo</button></form>'
          +'<button type="button" class="iv-btn secondary" data-stock-archive="'+esc(item.id)+'" data-archive="'+(item.active?'true':'false')+'">'
          +icon(item.active?'x':'checkCircle',16)+(item.active?' Excluir / arquivar':' Restaurar insumo')+'</button></article>';
      }
      if(!items.length)out+='<div class="iv-empty">Nenhum insumo cadastrado.</div>';
      out+='</div>';
      if(active.length)out+='<section class="x-panel"><h2>'+icon('refresh',19)+' Entrada, perda ou ajuste</h2>'
       +'<form id="adjuststock" class="x-form"><label>Insumo<select name="stock_item_id" required>'+opts(active,'id','name')+'</select></label>'
       +'<label>Movimentação<select name="reason"><option value="receive">Entrada (+)</option><option value="waste">Perda (-)</option><option value="adjustment">Ajuste (+ ou -)</option></select></label>'
       +'<label>Quantidade<input name="delta" type="number" step=".001" required placeholder="Ex.: 2 ou -0.5"></label>'
       +'<button type="submit">'+icon('checkCircle',17)+' Registrar movimento</button></form></section>';
    }
    if(validTab==='produtos'){
      out+='<p class="x-note"><b>Cadastro central de produtos e preços.</b> A chave <b>Exibir no cardápio</b> controla a vitrine pública. A chave <b>Disponível para venda</b> controla o que o garçom consegue vender. São controles independentes.</p>'
       +'<div class="iv-toolbar"><h2>'+icon('store',20)+' Produtos e precificação</h2><a class="iv-btn secondary" href="'+link('/'+restaurant.slug+'/catalogo?aba=categorias')+'">'+icon('layers',16)+' Categorias</a></div>';
      out+='<section class="x-panel"><details><summary>'+icon('layers',17)+' Categorias de produtos</summary><p class="x-muted">Cadastre aqui a categoria e depois selecione-a no produto. Ativar ou ocultar categorias continua disponível na tela de Cardápio.</p>'
        +'<form id="newcatstock" class="x-form"><label>Nome da nova categoria<input name="name" minlength="2" maxlength="90" required placeholder="Ex.: Lanches"></label>'
        +'<button type="submit">'+icon('plus',16)+' Criar categoria</button></form></details></section>';
      if(!activeCats.length)out+='<section class="x-panel"><p class="x-note">Antes de criar um produto, cadastre uma categoria ativa no módulo Cardápio.</p>'
        +'<a href="'+link('/'+restaurant.slug+'/catalogo')+'" class="iv-btn">'+icon('plus',16)+' Criar categoria</a></section>';
      else out+='<details class="x-panel x-create-panel"><summary><span class="x-create-icon">'+icon('plus',20)+'</span><span>Cadastrar produto<small class="x-create-desc">Nome, foto, preço e exibição</small></span><span class="x-create-arrow">'+icon('chevronRight',19)+'</span></summary>'
       +'<form class="x-form" id="newprodstock"><label>Nome do produto<input name="name" required minlength="2" maxlength="150" placeholder="Ex.: Fritas com bacon e cheddar"></label><label>Variação (opcional)<input name="variant_label" maxlength="45" placeholder="Ex.: Pequena, 300 g"></label><p class="x-muted">Para criar outros tamanhos, cadastre o mesmo nome e categoria com outra variação e preço.</p>'
       +'<label>Categoria<select name="category_id" required>'+opts(activeCats,'id','name')+'</select></label>'
       +'<label>Preço de venda (R$)<input name="price" required inputmode="decimal" placeholder="24,90"></label>'
       +'<label>Descrição<input name="description" maxlength="1000" placeholder="Descrição curta"></label>'
       +'<label>URL da foto (HTTPS, opcional)<input type="url" name="image_url" maxlength="1200" placeholder="https://..."></label>'
       +'<label class="x-switch-row"><span class="x-switch-copy">'+icon('receipt',18)+'<span><strong>Exibir no cardápio</strong><small>Vitrine pública</small></span></span><input class="x-toggle" type="checkbox" name="show_on_menu" checked></label>'
       +'<label class="x-switch-row"><span class="x-switch-copy">'+icon('checkCircle',18)+'<span><strong>Disponível para venda</strong><small>Garçom e pedidos</small></span></span><input class="x-toggle" type="checkbox" name="available" checked></label>'
       +'<button type="submit">'+icon('plus',16)+' Salvar novo produto</button></form></details>';
      out+='<div class="iv-toolbar"><h2>Produtos ('+products.length+')</h2><span class="iv-chip orange">'+exposed.length+' prontos para cardápio*</span></div><div class="x-grid">';
      for(const p of products){
        const cat=categories.find(c=>c.id===p.category_id),visible=!!p.show_on_menu,selling=!!p.available;
        const photo=typeof p.image_url==='string'&&/^https:\/\/[^\s<>"']+$/.test(p.image_url)?p.image_url:null;
        out+='<article class="x-panel x-product-card"><div class="x-product-head">'
          +(photo?'<img class="x-product-photo" src="'+esc(photo)+'" alt="Foto de '+esc(p.name)+'" loading="lazy" referrerpolicy="no-referrer">':'<span class="x-product-placeholder">'+icon('store',28)+'</span>')
          +'<div><h3>'+esc(p.name)+'</h3><strong>'+fmt(p.price_cents)+'</strong><div class="x-product-note">'+esc(cat?.name??'Sem categoria')+'</div></div></div>'
          +'<label class="x-switch-row"><span class="x-switch-copy">'+icon('receipt',18)+'<span><strong>Exibir no cardápio</strong><small>Vitrine pública</small></span></span><input type="checkbox" class="x-toggle" data-product-flag="'+esc(p.id)+'" data-flag="show_on_menu" aria-label="Exibir '+esc(p.name)+' no cardápio público" '+(visible?'checked':'')+'></label>'
          +'<label class="x-switch-row"><span class="x-switch-copy">'+icon('checkCircle',18)+'<span><strong>Disponível para venda</strong><small>Garçom e pedidos</small></span></span><input type="checkbox" class="x-toggle" data-product-flag="'+esc(p.id)+'" data-flag="available" aria-label="Disponibilizar '+esc(p.name)+' para venda" '+(selling?'checked':'')+'></label>'
          +'<details><summary>'+icon('settings',16)+' Editar produto e preço</summary><form class="x-form" data-edit-product="'+esc(p.id)+'">'
          +'<label>Nome<input name="name" required minlength="2" maxlength="150" value="'+esc(p.variant_group_name??p.name)+'"></label><label>Variação (opcional)<input name="variant_label" maxlength="45" value="'+esc(p.variant_label??'')+'" placeholder="Ex.: Grande, 700 g"></label>'
          +'<label>Categoria<select name="category_id" required>'+categories.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===p.category_id?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'
          +'<label>Preço (R$)<input name="price" required inputmode="decimal" value="'+moneyInput(p.price_cents)+'"></label>'
          +'<label>Descrição<input name="description" maxlength="1000" value="'+esc(p.description??'')+'"></label>'
          +'<label>URL da foto<input type="url" name="image_url" maxlength="1200" value="'+esc(p.image_url??'')+'" placeholder="https://..."></label>'
          +'<button type="submit">'+icon('checkCircle',16)+' Salvar alterações</button></form></details>'
          +'<button type="button" class="iv-btn secondary" data-new-variant="'+esc(p.id)+'">'+icon('plus',16)+' Adicionar variação</button><p class="x-product-note">Ocultar do cardápio não apaga o produto nem sua ficha técnica.</p></article>';
      }
      if(!products.length)out+='<div class="iv-empty">Cadastre seu primeiro produto para começar.</div>';
      out+='</div><p class="x-product-note">* A vitrine pública também depende da publicação geral do cardápio, da categoria ativa e do produto disponível.</p>';
    }
    if(validTab==='fichas'){
      const missing=products.filter(p=>p.available&&!recipes.some(r=>r.product_id===p.id));
      out+='<p class="x-note"><b>Ficha técnica:</b> configure quanto de cada insumo uma unidade do produto consome. Ao enviar o pedido à cozinha, o sistema baixa o estoque na mesma transação. Produtos sem ficha não têm baixa automática.</p>'
       +(missing.length?'<section class="x-panel"><strong>'+missing.length+' produto(s) disponível(is) sem ficha técnica</strong><p class="x-muted">'+missing.map(p=>esc(p.name)).join(', ')+'</p></section>':'');
      if(active.length&&products.length){
        out+='<section class="x-panel"><h2>'+icon('clipboard',19)+' Vincular ingrediente ao produto</h2>'
          +'<form id="recipeset" class="x-form"><label>Produto<select name="product_id" required>'+opts(products,'id','name')+'</select></label>'
          +'<label>Ingrediente<select name="stock_item_id" required>'+opts(active,'id','name')+'</select></label>'
          +'<label>Quantidade por unidade<input name="quantity" type="number" min="0" max="10000000" step=".001" required placeholder="Ex.: 0.150"></label>'
          +'<button type="submit">'+icon('checkCircle',16)+' Salvar ficha</button></form><p class="x-muted">Use quantidade zero para remover um ingrediente da ficha.</p></section>';
      }else out+='<section class="x-panel"><p>Cadastre ao menos um produto e um insumo ativo para montar fichas técnicas.</p></section>';
      out+='<section class="x-panel"><h2>Ingredientes vinculados ('+recipes.length+')</h2>';
      if(!recipes.length)out+='<p class="x-muted">Nenhuma ficha técnica foi cadastrada.</p>';
      for(const r of recipes){
        const p=products.find(p=>p.id===r.product_id),i=items.find(i=>i.id===r.stock_item_id);
        out+='<p class="x-muted"><b>'+esc(p?.name??'Produto')+'</b> · '+esc(r.quantity)+' '+esc(i?.unit??'')+' de '+esc(i?.name??'Insumo')+'</p>';
      }
      out+='</section>';
    }
    if(validTab==='historico'){
      out+='<section class="x-panel"><h2>'+icon('clock',20)+' Últimas movimentações</h2>';
      if(!movements.length)out+='<p class="x-muted">Nenhuma movimentação registrada.</p>';
      for(const m of movements.slice(0,60)){
        const item=items.find(i=>i.id===m.stock_item_id);
        out+='<div class="x-switch-row"><span>'+esc(item?.name??'Insumo')+' · '+esc(m.reason)+'<small class="x-muted">'+esc(new Date(m.created_at).toLocaleString('pt-BR'))+'</small></span><b>'+esc(m.quantity_delta)+'</b></div>';
      }
      out+='</section>';
    }
    box(out);
    document.querySelectorAll('.x-product-photo').forEach(img=>img.addEventListener('error',()=>{
     const fallback=document.createElement('span');
     fallback.className='x-product-placeholder';fallback.textContent='Imagem indisponível';
     img.replaceWith(fallback);
    },{once:true}));
    document.querySelectorAll('[data-stock-tab]').forEach(button=>button.onclick=()=>{
      stockTab=button.dataset.stockTab;
      try{const url=new URL(location.href);url.searchParams.set('aba',stockTab);history.replaceState(null,'',url.pathname+url.search)}catch{}
      load();
    });
    form('newstock',v=>call('stock_create',{name:v.name,unit:v.unit,quantity:Number(v.quantity),min_quantity:Number(v.min_quantity)}));
    const stockEditForms=[...document.querySelectorAll('[data-edit-stock]')];
    stockEditForms.forEach((editForm,index)=>{
      editForm.id='iv-edit-stock-'+index;
      form(editForm.id,v=>call('stock_update',{
        id:editForm.dataset.editStock,name:v.name,unit:v.unit,min_quantity:Number(v.min_quantity)
      }));
    });
    document.querySelectorAll('[data-stock-archive]').forEach(button=>button.onclick=async()=>{
      const item=items.find(row=>row.id===button.dataset.stockArchive);
      if(!item)return;
      const archive=button.dataset.archive==='true';
      if(archive&&!confirm('Arquivar o insumo "'+item.name+'"? O histórico ficará preservado.'))return;
      button.disabled=true;
      try{await call(archive?'stock_delete':'stock_restore',{id:item.id});await load()}
      catch(e){alert(e.message);button.disabled=false}
    });
    form('adjuststock',v=>call('stock_adjust',{stock_item_id:v.stock_item_id,reason:v.reason,delta:Number(v.delta)}));
    form('recipeset',v=>call('recipe_set',{product_id:v.product_id,stock_item_id:v.stock_item_id,quantity:Number(v.quantity)}));
    form('newcatstock',v=>call('category_create',{name:v.name,sort_order:0}));
    form('newprodstock',async (v,f)=>{
      const image_url=await resolveProductPhoto(f);
      return call('product_create',{
       name:v.name,variant_label:v.variant_label??'',category_id:v.category_id,price_cents:cents(v.price),description:v.description??'',
       image_url,sort_order:0,available:v.available==='on',show_on_menu:v.show_on_menu==='on'
      });
    });
    document.querySelectorAll('[data-product-flag]').forEach(t=>t.onchange=async()=>{
      t.disabled=true;
      const previous=!t.checked;
      try{await call('product_flags',{id:t.dataset.productFlag,[t.dataset.flag]:t.checked});const y=window.scrollY;await load({quiet:true});window.scrollTo(0,y)}
      catch(e){t.checked=previous;t.disabled=false;alert(e.message)}
    });
    document.querySelectorAll('[data-edit-product]').forEach(f=>f.onsubmit=async e=>{
      e.preventDefault();
      const button=f.querySelector('button[type=submit]');button.disabled=true;
      try{
        const p=products.find(p=>p.id===f.dataset.editProduct);if(!p)throw Error('Produto não encontrado');
        const v=Object.fromEntries(new FormData(f).entries());
        const image_url=await resolveProductPhoto(f);
        await call('product_update',{
          id:p.id,name:v.name,variant_label:v.variant_label??'',category_id:v.category_id,price_cents:cents(v.price),description:v.description??'',
          image_url,sort_order:p.sort_order??0,available:p.available,show_on_menu:p.show_on_menu
        });
        await load();
      }catch(err){if(!showFormSheetError(f,err.message))alert(err.message);button.disabled=false}
    });
     const productEditForms=[...document.querySelectorAll('[data-edit-product]')];
     const editSpecs=productEditForms.map((form,index)=>{
       form.id='iv-edit-product-'+index;
       const p=products.find(p=>p.id===form.dataset.editProduct);
       return {id:form.id,label:'Editar produto',title:'Editar '+(p?.name??'produto'),context:'iv-inventory',replaceDetails:true};
     });
     const productSheets=sheetifyForms([
       {id:'newstock',label:'Novo insumo',title:'Cadastrar insumo',description:'Dados, unidade e saldos iniciais.',context:'iv-inventory'},
       ...stockEditForms.map(f=>({id:f.id,label:'Editar insumo',title:'Editar insumo',description:'Altere nome, unidade e estoque mínimo. Saldo via movimentação.',context:'iv-inventory'})),
       {id:'adjuststock',label:'Registrar movimentação',title:'Movimentar estoque',description:'Registre entrada, perda ou ajuste.',context:'iv-inventory'},
       {id:'recipeset',label:'Vincular ingrediente',title:'Ficha técnica',description:'Defina a quantidade usada por produto.',context:'iv-inventory'},
       {id:'newcatstock',label:'Nova categoria',title:'Cadastrar categoria',context:'iv-inventory',replaceDetails:true},
       {id:'newprodstock',label:'Novo produto',title:'Cadastrar produto',description:'Dados, preço, foto e disponibilidade.',context:'iv-inventory',replaceDetails:true},
       ...editSpecs
     ]);
     initProductPhotoForm({form:document.getElementById('newprodstock'),supabase,restaurant});
     document.querySelectorAll('[data-new-variant]').forEach(b=>b.onclick=()=>{
      const p=products.find(x=>x.id===b.dataset.newVariant),sheet=productSheets.find(x=>x.form.id==='newprodstock');
      if(!p||!sheet)return;
      const fields=sheet.form.elements;
      fields.name.value=p.variant_group_name??p.name;fields.category_id.value=p.category_id;fields.variant_label.value='';fields.price.value='';fields.description.value=p.description??'';
      // Reutilizar foto existente pela URL (sem novo upload); não copiar ficha técnica.
      const url=fields.image_url;if(url){url.value=p.image_url??'';url.dispatchEvent(new Event('input',{bubbles:true}))}
      fields.available.checked=!!p.available;fields.show_on_menu.checked=!!p.show_on_menu;
      sheet.trigger.click();
     });
     for(const f of productEditForms){
      const p=products.find(p=>p.id===f.dataset.editProduct);
      initProductPhotoForm({form:f,existingUrl:p?.image_url??'',supabase,restaurant});
     }
  }else if(module==='impressao'){
    await mountPrintSettings({supabase,restaurant,box,title,esc,link});
  }else if(module==='relatorios'){
    const d=await call('report');
    let out=title+'<div class="iv-report-controls"><span class="iv-chip orange">'+icon('chart',15)+' Indicadores reais</span><span class="iv-report-status">Últimas movimentações consultadas. Filtro por período ainda não disponível na API.</span></div><p class="x-note">Relatório gerencial preliminar. Não é relatório fiscal, nem conciliação bancária. O processamento está limitado às últimas movimentações consultadas.</p><h2>Comandas por status</h2><div class="x-grid">';
    for(const [status,count] of Object.entries(d.orders_by_status??{}))out+='<div class="x-panel"><h3>'+esc(status)+'</h3><b>'+esc(count)+'</b></div>';
    out+='</div><h2>Valores registrados por método</h2><div class="x-grid">';
    for(const [method,value] of Object.entries(d.recorded_receipts_cents??{}))out+='<div class="x-panel"><h3>'+esc(method)+'</h3><b>'+fmt(value)+'</b></div>';
    out+='</div>';box(out);
  }else box(title+'<p class="x-note">Esta área ainda não está habilitada.</p>');
  }catch(e){box(title+'<div class="x-panel"><p class="error">'+esc(e.message)+'</p></div>')}
 }
 return load();
}