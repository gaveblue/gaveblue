// GB+ 2.5.1 — A single, consistent header for accounts and cards.
// Presentation and navigation only. Financial data and forms stay untouched.
import {heading,accountsView} from './views.js?v=20261106-2511';
import {cardsView} from './finance-24-ui.js?v=20261106-2511';
import {button,icon} from './ui.js?v=20261105-72';

export function accountsCardsView(db,selected='accounts'){
 const tab=selected==='cards'?'cards':'accounts';
 const isCard=tab==='cards';
 const sectionTitle=isCard?'Meus cartões':'Minhas contas';
 const sectionDescription=isCard?'Limites, compras e faturas.':'Saldos e movimentações.';
 const primary=isCard?
  button(icon('plus')+'Novo cartão','new-card','primary'):
  button(icon('plus')+'Nova conta','new-account','primary');
 const secondary=isCard?
  button(icon('plus')+'Nova compra','new-card-purchase','small'):
  button('Bancos e ícones','open-banks','small')+
  button(icon('transfer')+'Transferir','new-transfer','small');
 const options=[['accounts','Contas','wallet'],['cards','Cartões','credit-card']];
 const switcher='<div class="gb-finance-tabs" role="tablist" aria-label="Contas e cartões">'+
  options.map(([id,label,ico])=>
   '<button type="button" role="tab" id="gb-finance-tab-'+id+'" '+
   'class="gb-finance-tab'+(tab===id?' is-selected':'')+'" '+
   'data-action="accounts-cards-tab" data-tab="'+id+'" '+
   'aria-selected="'+(tab===id?'true':'false')+'" aria-controls="gb-finance-tab-panel" tabindex="'+(tab===id?'0':'-1')+'">'+
   icon(ico)+'<span>'+label+'</span></button>'
  ).join('')+'</div>';
 const body=isCard?cardsView(db,{embedded:true}):accountsView(db,{embedded:true});
 return '<div class="gb-accounts-cards-page" data-finance-section="'+tab+'">'+
  heading('Contas e cartões','Gerencie suas contas e cartões em um só lugar.')+
  '<div class="gb-finance-switcher">'+switcher+'</div>'+
  '<div class="gb-finance-actionbar">'+
   '<div class="gb-finance-action-label"><h2>'+sectionTitle+'</h2><p>'+sectionDescription+'</p></div>'+
   '<div class="gb-finance-action-main">'+primary+'</div>'+
  '</div>'+
  '<div class="gb-finance-tools" aria-label="Ações de '+sectionTitle+'">'+secondary+'</div>'+
  '<section id="gb-finance-tab-panel" role="tabpanel" aria-labelledby="gb-finance-tab-'+tab+'">'+body+'</section></div>';
}
