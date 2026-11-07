// GB+ 2.5.1 — One financial page, two contextual tabs.
// Navigation only: account/card calculation and financial forms remain unchanged.
import {heading,accountsView} from './views.js?v=20261106-2511';
import {cardsView} from './finance-24-ui.js?v=20261106-2511';
import {button,icon} from './ui.js?v=20261105-72';

export function accountsCardsView(db,selected='accounts'){
 const tab=selected==='cards'?'cards':'accounts';
 const isCard=tab==='cards';
 const title=isCard?'Cartões':'Contas';
 const subtitle=isCard?'Acompanhe limite, compras, parcelas e faturas no Contas a pagar.':'Saldos reais. Todas as contas sob seu controle.';
 const actions=isCard?
  button(icon('plus')+'Novo cartão','new-card','primary'):
  button('Bancos e ícones','open-banks','small')+
  button(icon('transfer')+'Transferir','new-transfer')+
  button(icon('plus')+'Nova conta','new-account','primary');
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
  heading(title,subtitle,actions)+switcher+
  '<section id="gb-finance-tab-panel" role="tabpanel" aria-labelledby="gb-finance-tab-'+tab+'">'+body+'</section></div>';
}
