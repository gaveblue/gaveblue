// GB+ 2.6.0 — optional service identities for expense titles.
// The picker does not submit, subscribe, pay or reconcile anything.
import {serviceById} from './service-catalog.js?v=20261108-2861';
import {SERVICE_BRAND_PATHS} from './service-brand-paths.js?v=20261106-2600';
import {SERVICE_EXTRA_BRAND_PATHS} from './service-extra-brand-paths.js?v=20261108-2861';
import {SERVICE_BRAND_COLORS} from './service-brand-colors.js?v=20261106-2620';
import {esc} from './ui.js?v=20261105-72';

// Only known fixed palette values are interpolated; no user provided CSS.
export function serviceIconMarkup(service,size='small'){
 const item=typeof service==='string'?serviceById(service):service;
 if(!item)return '<span class="gb-service-monogram" aria-hidden="true">+</span>';
 const hex=SERVICE_BRAND_COLORS[item.id]||'';
 const valid=/^[A-F0-9]{6}$/.test(hex);
 const rgb=valid?[0,2,4].map(n=>parseInt(hex.slice(n,n+2),16)):[];
 const bright=valid&&(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)>150;
 const style=valid?' style="--gb-service-color:#'+hex+';--gb-service-fg:'+(bright?'#151515':'#ffffff')+'"':'';
 const dark=hex==='000000'?' gb-service-logo-dark':'';
 const path=SERVICE_BRAND_PATHS[item.id];
 const extra=SERVICE_EXTRA_BRAND_PATHS[item.id];
 if(path?.length||extra?.length===3){
  // Both sources are vetted, locally bundled SVG-only data (no remote fetch).
  const viewBox=extra?'0 0 '+extra[0]+' '+extra[1]:'0 0 24 24';
  const vectors=extra?[extra[2]]:path;
  return '<span class="gb-service-logo gb-service-branded'+dark+'"'+style+' aria-hidden="true"><svg viewBox="'+viewBox+'" fill="currentColor" focusable="false">'+
   vectors.map(d=>'<path d="'+d+'"/>').join('')+'</svg></span>';
 }
 return '<span class="gb-service-monogram'+(hex?' gb-service-branded':'')+dark+'"'+style+' aria-hidden="true">'+
  esc(item.fallback||item.name.slice(0,2))+'</span>';
}
// Three overlapping, recognizable examples on the Serviços category.
// Render only existing local symbols, no external logo requests.
export function serviceCategoryPreviewMarkup(){
 const ids=['streaming-netflix','music-spotify','delivery-ifood'];
 return '<span class="gb-service-category-preview" aria-hidden="true">'+
  ids.map(id=>'<span class="gb-service-category-preview-item">'+serviceIconMarkup(id)+'</span>').join('')+
  '</span>';
}
export function serviceDisplayName(id,name='',fallback=''){
 const item=serviceById(id);
 if(item)return item.name;
 if(id==='custom')return String(name||fallback||'Outro serviço');
 return String(fallback||'');
}
export function serviceIdentityMarkup(id,name=''){
 if(!id)return '';
 const item=serviceById(id);
 const title=item?.name||(id==='custom'?String(name||'Outro serviço'):'');
 if(!title)return '';
 return '<span class="gb-service-identity">'+serviceIconMarkup(item)+
  '<span>'+esc(title)+'</span></span>';
}
// Compact field inside Categoria. The full service list is displayed only
// in the separate draggable sheet, keeping FormData and custom names intact.
// A selected service is displayed as one compact, tappable chip inside
// Categoria. The full catalog opens automatically when Categoria=Serviços
// is explicitly selected; the chip is a shortcut to change the choice.
export function servicePickerMarkup(title=null){
 const id=String(title?.serviceId||'');
 const item=serviceById(id),custom=id==='custom';
 const display=item?.name||(custom?(title?.serviceName||'Outro serviço'):'Selecionar aplicativo');
 return '<section class="gb-service-field gb-service-field-compact" aria-label="Aplicativo selecionado">'+
  '<input type="hidden" name="serviceId" value="'+esc(item?.id||(custom?'custom':''))+'">'+
  '<button type="button" class="gb-service-selected gb-service-compact'+(id?' is-chosen':' is-empty')+'"'+
   ' data-action="title-service-toggle" aria-haspopup="dialog" aria-controls="gb-picker-sheet"'+
   ' aria-expanded="false" aria-label="'+esc(id?'Alterar serviço: '+display:'Escolher serviço ou aplicativo')+'">'+
   '<span class="gb-service-selected-content">'+(item?serviceIconMarkup(item):
     '<span class="gb-service-monogram" aria-hidden="true">+</span>')+
     '<span class="gb-service-selected-name">'+esc(display)+'</span></span>'+
   '<span class="gb-service-compact-chevron" aria-hidden="true">⌄</span></button>'+
  '<label class="gb-service-custom" '+(custom?'':'hidden')+'><span>Nome do serviço personalizado</span>'+
   '<input type="text" maxlength="120" name="serviceName" value="'+esc(custom?title?.serviceName||'':'')+
   '" placeholder="Ex.: Aplicativo local" '+(custom?'required':'')+'></label>'+
  '<p class="gb-service-help gb-visually-hidden" id="gb-service-naming-hint">'+
   'O serviço selecionado define automaticamente o nome do lançamento.</p>'+
 '</section>';
}
