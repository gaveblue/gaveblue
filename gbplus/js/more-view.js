// GB+ 2.8.1 — a área Mais é uma rota de página, nunca um modal.
import {esc,icon} from './ui.js?v=20261105-72';

const groups=[
  {label:'VISÃO GERAL E LANÇAMENTOS',entries:[
    ['dashboard','Início','home','Resumo do seu financeiro'],
    ['titles','Lançamentos','transfer','Todos os seus registros'],
    ['payable','Contas a pagar','down','Despesas e vencimentos'],
    ['receivable','Contas a receber','up','Receitas e recebimentos'],
    ['accounts','Contas e cartões','wallet','Saldos e contas bancárias'],
    ['cards','Cartões de crédito','credit-card','Faturas, limites e compras']
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
  {label:'CONTA E APLICATIVO',entries:[
    ['notifications','Notificações','bell','Avisos e vencimentos'],
    ['profile','Minha conta','user','Dados pessoais e acesso'],
    ['settings','Configurações','settings','Tema, atalhos, ajuda e atualizações']
  ]}
];
const link=(route,label,glyph,description)=>
  '<a class="gb-more-row" href="#'+esc(route)+'" aria-label="'+esc(label)+'">'+
  '<span class="gb-more-row-icon">'+icon(glyph)+'</span>'+
  '<span class="gb-more-row-label"><strong>'+esc(label)+'</strong><small>'+esc(description)+'</small></span>'+
  '<span class="gb-more-row-chevron" aria-hidden="true">'+icon('chevron')+'</span></a>';
export function moreView(online=false){
  return '<div class="gb-more-page">'+
    '<header class="gb-more-heading"><span class="gb-more-eyebrow">SEU FINANCEIRO</span><h1>Mais</h1><p>Todas as funcionalidades do GB+, em um só lugar.</p></header>'+
    groups.map(group=>'<section class="gb-more-section" aria-label="'+esc(group.label)+'">'+
      '<h2>'+esc(group.label)+'</h2><div class="gb-more-list">'+group.entries.map(entry=>link(...entry)).join('')+'</div></section>').join('')+
    '<p class="gb-more-connection" role="status">'+(online?'Conta online · dados vinculados ao seu acesso.':'Dados locais neste navegador.')+'</p>'+
  '</div>';
}
