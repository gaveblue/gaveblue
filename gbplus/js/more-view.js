// GB+ 2.8.1 — a área Mais é uma rota de página, nunca um modal.
import {esc,icon} from './ui.js?v=20261105-72';
import {settingsView} from './views.js?v=20261108-2866';

const groups=[
  {label:'VISÃO GERAL E LANÇAMENTOS',entries:[
    ['dashboard','Início','home','Resumo do seu financeiro'],
    ['titles','Lançamentos','transfer','Todos os seus registros'],
    ['payable','Contas a pagar','down','Despesas e vencimentos'],
    ['receivable','Contas a receber','up','Receitas e recebimentos'],
    ['accounts','Contas e cartões','wallet','Saldos e contas bancárias'],
    ['cards','Carteira','wallet','Cartões, faturas e limites']
  ]},
  {label:'PLANEJAMENTO E RELATÓRIOS',entries:[
    ['provisions','Provisões','layers','Entradas e saídas previstas'],
    ['flow','Fluxo de caixa','chart','Movimentação por período'],
    ['forecast','Previsão financeira','chart','Seu futuro financeiro'],
    ['reports','Relatórios','chart','Análises e detalhamentos']
  ]},
  {label:'CADASTROS',entries:[
    ['partners','Parceiros','people','Clientes e fornecedores'],
    ['banks','Bancos e instituições','building-2','Instituições financeiras'],
    ['categories','Categorias','category','Organização dos lançamentos']
  ]},
  {label:'AVISOS',entries:[
    ['notifications','Notificações','bell','Vencimentos e lembretes']
  ]}
];
const link=(route,label,glyph,description)=>
  '<a class="gb-more-row" href="#'+esc(route)+'" aria-label="'+esc(label)+'">'+
  '<span class="gb-more-row-icon">'+icon(glyph)+'</span>'+
  '<span class="gb-more-row-label"><strong>'+esc(label)+'</strong><small>'+esc(description)+'</small></span>'+
  '<span class="gb-more-row-chevron" aria-hidden="true">'+icon('chevron')+'</span></a>';
export function moreView(online=false,db=null,user=null,installed=false){
  return '<div class="gb-more-page">'+
    '<header class="gb-more-heading"><span class="gb-more-eyebrow">SEU FINANCEIRO</span><h1>Mais</h1><p>Todas as funcionalidades do GB+, em um só lugar.</p></header>'+ 
    '<a href="#profile" class="gb-more-profile"><span class="gb-more-profile-symbol">'+icon('user')+'</span><span><strong>Minha Conta</strong><small>Perfil, dados pessoais e segurança</small></span>'+icon('chevron')+'</a>'+
    groups.map(group=>'<section class="gb-more-section" aria-label="'+esc(group.label)+'">'+
      '<h2>'+esc(group.label)+'</h2><div class="gb-more-list">'+group.entries.map(entry=>link(...entry)).join('')+'</div></section>').join('')+
    (db?'<section class="gb-more-section gb-more-integrated" aria-label="Configurações integradas"><h2>CONFIGURAÇÕES</h2>'+settingsView(db,!installed,online,user,installed,true)+'</section>':'')+
    '<p class="gb-more-connection" role="status">'+(online?'Conta online · dados vinculados ao seu acesso.':'Dados locais neste navegador.')+'</p>'+
  '</div>';
}
