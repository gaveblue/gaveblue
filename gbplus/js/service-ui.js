// GB+ 2.6.0 — optional service identities for expense titles.
// The picker does not submit, subscribe, pay or reconcile anything.
import {SERVICE_CATALOG,SERVICE_GROUPS,serviceById,serviceSearchKey} from './service-catalog.js?v=20261106-2600';
import {SERVICE_BRAND_PATHS} from './service-brand-paths.js?v=20261106-2600';
import {esc} from './ui.js?v=20261105-72';

export function serviceIconMarkup(service,size='small'){
 const item=typeof service==='string'?serviceById(service):service;
 if(!item)return '<span class="gb-service-monogram" aria-hidden="true">+</span>';
 const path=SERVICE_BRAND_PATHS[item.id];
 if(path?.length)return '<span class="gb-service-logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor" focusable="false">'+
  path.map(d=>'<path d="'+d+'"/>').join('')+'</svg></span>';
 return '<span class="gb-service-monogram" aria-hidden="true">'+esc(item.fallback||item.name.slice(0,2))+'</span>';
}
export function serviceIdentityMarkup(id,name=''){
 if(!id)return '';
 const item=serviceById(id);
 const title=item?.name||(id==='custom'?String(name||'Outro serviço'):'');
 if(!title)return '';
 return '<span class="gb-service-identity">'+serviceIconMarkup(item)+
  '<span>'+esc(title)+'</span></span>';
}
export function servicePickerMarkup(title=null){
 const id=String(title?.serviceId||'');
 const item=serviceById(id),custom=id==='custom';
 const display=item?.name||(custom?title?.serviceName||'Outro serviço':'Nenhum serviço escolhido');
 return '<section class="gb-service-field" aria-label="Identificação opcional do serviço">'+
  '<div class="gb-service-heading"><div><strong>Serviço ou aplicativo</strong>'+
  '<p>Opcional · identifique assinaturas, delivery e outros gastos.</p></div></div>'+
  '<input type="hidden" name="serviceId" value="'+esc(item?.id||(custom?'custom':''))+'">'+
  '<div class="gb-service-selected">'+
   '<span class="gb-service-selected-content">'+(item?serviceIconMarkup(item):'<span class="gb-service-monogram" aria-hidden="true">+</span>')+
   '<span class="gb-service-selected-name">'+esc(display)+'</span></span>'+
   '<button type="button" class="button small" data-action="title-service-toggle" aria-expanded="false" aria-controls="gb-service-options">'+
   (id?'Alterar':'Escolher serviço')+'</button></div>'+
  '<label class="gb-service-custom" '+(custom?'':'hidden')+'><span>Nome do seu serviço</span>'+
  '<input type="text" maxlength="120" name="serviceName" value="'+esc(custom?title?.serviceName||'':'')+'" placeholder="Ex.: Serviço local" '+(custom?'required':'')+'></label>'+
  '<div class="gb-service-picker" id="gb-service-options" hidden>'+
   '<label class="gb-service-search-label">Buscar serviço<input type="search" id="gb-service-search" placeholder="Netflix, iFood, Spotify..." autocomplete="off"></label>'+
   '<label class="gb-service-group-label">Categoria<select id="gb-service-group"><option value="all">Todos os serviços</option>'+
    Object.entries(SERVICE_GROUPS).map(([key,value])=>'<option value="'+esc(key)+'">'+esc(value)+'</option>').join('')+'</select></label>'+
   '<div class="gb-service-options" role="group" aria-label="Serviços disponíveis">'+
    SERVICE_CATALOG.map(service=>
     '<button type="button" class="gb-service-option" data-action="title-service-pick" data-service-id="'+esc(service.id)+'" data-service-group="'+esc(service.group)+'" data-service-search="'+esc(serviceSearchKey(service.name))+'">'+
      serviceIconMarkup(service)+'<span>'+esc(service.name)+'</span></button>').join('')+
    '<button type="button" class="gb-service-option" data-action="title-service-pick" data-service-id="custom" data-service-group="custom" data-service-search="outro personalizado custom"> '+
     '<span class="gb-service-monogram" aria-hidden="true">+</span><span>Outro serviço</span></button>'+
   '</div><p class="gb-service-empty" hidden>Nenhum serviço encontrado. Você pode usar "Outro serviço".</p>'+
   '<button type="button" class="gb-service-clear" data-action="title-service-clear">Não identificar serviço</button>'+
  '</div>'+
  '<p class="gb-service-help">Selecionar um serviço não cria assinatura, cobrança, despesa ou baixa. Você decide os valores e vencimentos.</p>'+
 '</section>';
}
