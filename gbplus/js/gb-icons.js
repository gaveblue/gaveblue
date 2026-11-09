/* GB+ inline SVG icons, using Lucide-style open-source glyph paths.
   Icon source: https://lucide.dev/icons
   Licenses: https://lucide.dev/license (ISC / Feather-derived MIT).
   SVGs are bundled locally, no external network or fonts. */
const shapes={
 'bike':'<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="m5 17 4-8 4 8h6l-4-8H9M14 5h3"/>',
 'pill':'<path d="M4.5 19.5a6 6 0 0 1 0-8.5l6.5-6.5a6 6 0 0 1 8.5 8.5L13 19.5a6 6 0 0 1-8.5 0ZM8 8l8 8"/>',
 'stethoscope':'<path d="M6 3v5a6 6 0 0 0 12 0V3M3 3h6M15 3h6M12 14v3a4 4 0 0 0 8 0"/><circle cx="20" cy="15" r="2"/>',
 'shield-check':'<path d="M12 2 21 6v6c0 5-3 8-9 10-6-2-9-5-9-10V6l9-4ZM8 12l3 3 5-6"/>',
 'route':'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 16V9a3 3 0 0 1 3-3h7M9 18h7a3 3 0 0 0 3-3v-2"/>',
 'circle-parking':'<circle cx="12" cy="12" r="9"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
 'bus':'<rect x="5" y="3" width="14" height="16" rx="3"/><path d="M5 11h14M8 19v2M16 19v2M8 15h.01M16 15h.01"/>',
 'monitor-play':'<rect x="2" y="3" width="20" height="15" rx="2"/><path d="M9 22h6M12 18v4M10 7l5 3-5 3V7Z"/>',
 'tv':'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="m8 2 4 4 4-4M7 16h.01M10 16h6"/>',
 'book-open':'<path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1m0-14c3-2 6-2 9-1v14c-3-1-6-1-9 1V6Z"/>',
 'laptop':'<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20l-2-4H4l-2 4Z"/>',
 'dumbbell':'<path d="m6 6 12 12M4 9l5-5M2 7l5-5M15 20l5-5M17 22l5-5"/>',
 'gamepad-2':'<path d="M6 7h12a4 4 0 0 1 4 4v6a3 3 0 0 1-5 2l-2-2H9l-2 2a3 3 0 0 1-5-2v-6a4 4 0 0 1 4-4Z M6 12h5M8.5 9.5v5 M16 12h.01 M19 14h.01"/>',
 'plane':'<path d="m21 3-8 8M2 14l8 1 7 7 2-2-4-8 7-7a2 2 0 0 0-3-3l-7 7-8-4-2 2 7 7-1 8Z"/>',
 'bed-double':'<rect x="2" y="10" width="20" height="9" rx="1"/><path d="M2 19v3M22 19v3M4 10V5h16v5M4 10h8V7H4M12 10h8V7h-8"/>',
 'paw-print':'<circle cx="6" cy="9" r="1"/><circle cx="10" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="19" cy="9" r="1"/><path d="M12 11c-3 0-7 4-7 7a3 3 0 0 0 4 2c2-.7 4-.7 6 0a3 3 0 0 0 4-2c0-3-4-7-7-7Z"/>',
 'landmark':'<path d="m2 9 10-6 10 6H2ZM4 9v10M9 9v10M15 9v10M20 9v10M2 21h20"/>',
 'percent':'<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
 'chart-no-axes-combined':'<path d="M3 20h18M5 16l5-6 4 3 5-8M17 5h2v2M5 8v8M10 14v4M15 12v6M20 9v9"/>',
 'megaphone':'<path d="m3 10 15-6v12L3 14v-4ZM18 7a4 4 0 0 1 0 6M7 15l2 6h3l-2-7"/>',
 'calculator':'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 6h10v4H7zM7 14h.01M12 14h.01M17 14h.01M7 18h.01M12 18h.01M17 18h.01"/>',
 'notebook-pen':'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 3v18M11 8h5M11 12h4M11 16h2"/>',
 'package':'<path d="m3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
 'spray-can':'<path d="M9 5h6v3H9zM7 8h10v14H7V8ZM8 3h8M11 2h2M20 4h.01M21 8h.01"/>',
 'scissors':'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8 8 12 12M8 16 20 4"/>',
 'coffee':'<path d="M4 8h14v7a7 7 0 0 1-14 0V8ZM18 9h2a3 3 0 0 1 0 6h-2M2 22h18"/>',
 'users':'<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M16 3a4 4 0 0 1 0 8M18 15a6 6 0 0 1 4 6"/>',
 'badge-dollar-sign':'<circle cx="12" cy="12" r="9"/><path d="M15 8c-1-1-5-1-5 1.5S15 11 15 14s-4 3-6 1.5M12 5v14"/>',
 'coins':'<ellipse cx="9" cy="8" rx="6" ry="3"/><path d="M3 8v8c0 2 3 3 6 3M3 12c0 2 3 3 6 3M13 8v4"/><ellipse cx="17" cy="15" rx="5" ry="3"/><path d="M12 15v5c0 2 2 3 5 3s5-1 5-3v-5"/>',
 'trophy':'<path d="M6 3h12v8a6 6 0 0 1-12 0V3ZM6 5H3v3a4 4 0 0 0 4 4M18 5h3v3a4 4 0 0 1-4 4M12 17v4M8 21h8"/>',
 'music':'<path d="M9 18V5l12-3v13M9 5l12-3M9 18a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3ZM21 15a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z"/>',
 'baby':'<circle cx="12" cy="8" r="5"/><path d="M4 21c2-5 14-5 16 0M9 8h.01M15 8h.01M10 12c1 1 3 1 4 0"/>',
 'ticket':'<path d="M3 6h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V6ZM12 7v2M12 12v2M12 17v2"/>',
 'flower-2':'<circle cx="12" cy="12" r="2"/><path d="M12 10c-7-7-1-11 0-4 1-7 7-3 0 4Zm2 2c7-7 11-1 4 0 7 1 3 7-4 0Zm-2 2c7 7 1 11 0 4-1 7-7 3 0-4Zm-2-2c-7 7-11 1-4 0-7-1-3-7 4 0Z"/>',
 'calendar':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
 'calendar-days':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01"/>',
 'calendar-range':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h3M13 18h3"/>',
 'history':'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
 'layers':'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
 'sliders-horizontal':'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
 'chevron-down':'<path d="m6 9 6 6 6-6"/>',
 'chevron-left':'<path d="m15 18-6-6 6-6"/>',
 'chevron-right':'<path d="m9 18 6-6-6-6"/>',
 'chevrons-left':'<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>',
 'chevrons-right':'<path d="m6 17 5-5-5-5M13 17l5-5-5-5"/>',
 'check':'<path d="m5 12 4 4L19 6"/>',
 'x':'<path d="M18 6 6 18M6 6l12 12"/>',
 'arrow-up':'<path d="m5 12 7-7 7 7M12 19V5"/>',
 'arrow-down':'<path d="m5 12 7 7 7-7M12 5v14"/>',
 'droplets':'<path d="M12 22a7 7 0 0 0 7-7c0-4-7-12-7-12S5 11 5 15a7 7 0 0 0 7 7Z"/>',
 'zap':'<path d="m13 2-3 8h8L11 22l2-9H5l8-11Z"/>',
 'wifi':'<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01"/>',
 'shopping-cart':'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.5 14h12L22 5H6"/>',
 'shopping-bag':'<path d="M5 8h14l1 13H4L5 8ZM9 9V6a3 3 0 0 1 6 0v3"/>',
 'utensils':'<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v19M16 3c-2 2-3 4-3 7v3h5V3M18 13v9"/>',
 'fuel':'<path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M2 22h14M6 8h6M15 10h2l3 3v6a2 2 0 0 1-4 0v-4"/>',
 'house':'<path d="m3 10 9-7 9 7v11H3V10ZM9 21v-8h6v8"/>',
 'car':'<path d="m5 17-1 3H2v-6l3-7h14l3 7v6h-2l-1-3H5ZM2 14h20M7 17h.01M17 17h.01"/>',
 'heart-pulse':'<path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8ZM3.5 12h5l2-3 3 6 2-3h5"/>',
 'graduation-cap':'<path d="m2 10 10-5 10 5-10 5-10-5ZM6 12v5a8 8 0 0 0 12 0v-5M22 10v7"/>',
 'briefcase-business':'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
 'receipt':'<path d="M4 3h16v19l-4-2-4 2-4-2-4 2V3ZM8 8h8M8 12h8M8 16h4"/>',
 'credit-card':'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20M6 15h5"/>',
 'phone':'<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7l.6 3a2 2 0 0 1-.6 1.8l-1.4 1.4a16 16 0 0 0 6.5 6.5l1.4-1.4a2 2 0 0 1 1.8-.6l3 .6a2 2 0 0 1 1.7 1.9Z"/>',
 'shirt':'<path d="m16 4 3-2 4 5-3 3v12H4V10L1 7l4-5 3 2a4 4 0 0 0 8 0Z"/>',
 'gift':'<rect x="3" y="8" width="18" height="14" rx="2"/><path d="M12 8v14M3 12h18M12 8H7a3 3 0 1 1 3-3c0 2 2 3 2 3ZM12 8h5a3 3 0 1 0-3-3c0 2-2 3-2 3Z"/>',
 'wrench':'<path d="M14.5 6.3a6 6 0 0 0-7.8 7.8L2 19l3 3 4.9-4.7a6 6 0 0 0 7.8-7.8L14 13l-3-3 3.5-3.7Z"/>',
 'tag':'<path d="M2 3v8l10 10a2 2 0 0 0 3 0l6-6a2 2 0 0 0 0-3L11 2H3a1 1 0 0 0-1 1ZM7 7h.01"/>',
 'piggy-bank':'<path d="M5 11c-1-1-2-1-3-1v5h3a8 8 0 0 0 6 5v2h3v-2h3v2h3v-5a7 7 0 0 0 1-8h-3a7 7 0 0 0-4-3V4h-4v2a8 8 0 0 0-5 5Z M14 10h.01 M5 16l-2 1"/>',
 'heart':'<path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/>',
 'wallet':'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M16 12h6v5h-6a2.5 2.5 0 0 1 0-5ZM3 9h18"/>',
 'infinity':'<path d="M6 16c-3 0-4-2-4-4s1-4 4-4c4 0 8 8 12 8 3 0 4-2 4-4s-1-4-4-4c-4 0-8 8-12 8Z"/>',
 'key-round':'<path d="M2.6 17.4A2 2 0 0 0 2 18.8V20a2 2 0 0 0 2 2h1.2a2 2 0 0 0 1.4-.6L15 13a6 6 0 1 0-4-4l-8.4 8.4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor" stroke="none"/>'
};
export function gbIcon(name,klass=''){
 const safe=shapes[name]||shapes.tag;
 return '<svg class="gb-symbol '+klass+'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+safe+'</svg>';
}
export function normalizeSymbol(text){
 return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
export function gbCategoryIcon(label){
 const name=normalizeSymbol(label);
 if(/agua|hidric|saneamento/.test(name))return 'droplets';
 if(/energia|eletric|luz|gas|eletr/.test(name))return 'zap';
 if(/internet|wifi|conexao/.test(name))return 'wifi';
 if(/mercado|compra|supermercado|loja/.test(name))return 'shopping-cart';
 if(/aliment|refeic|restaurante|comida/.test(name))return 'utensils';
 if(/combust|posto|abastec/.test(name))return 'fuel';
 if(/aluguel|moradia|casa|condominio|imovel/.test(name))return 'house';
 if(/carro|veiculo|transporte|motorista/.test(name))return 'car';
 if(/saude|medic|hospital|plano/.test(name))return 'heart-pulse';
 if(/educa|ensino|escola|faculdade|curso/.test(name))return 'graduation-cap';
 if(/salario|folha|trabalho|servico/.test(name))return 'briefcase-business';
 if(/imposto|tributo|taxa|boleto/.test(name))return 'receipt';
 if(/cartao|credito|banco/.test(name))return 'credit-card';
 if(/telefone|celular|telefonia/.test(name))return 'phone';
 if(/vestuario|roupa/.test(name))return 'shirt';
 if(/presente|bonus|doacao/.test(name))return 'gift';
 if(/manutencao|reparo|conserto/.test(name))return 'wrench';
 if(/venda|faturamento|receita/.test(name))return 'shopping-bag';
 return 'tag';
}
export function gbOptionIcon(name,value,label){
 const nameKey=normalizeSymbol(name),v=normalizeSymbol(value),title=normalizeSymbol(label);
 if(nameKey.includes('period'))return ({month:'calendar-days',last:'history',year:'calendar-range',all:'infinity',custom:'sliders-horizontal'})[v]||'calendar';
 if(nameKey.includes('categor'))return gbCategoryIcon(title);
 if(nameKey.includes('type')||nameKey.includes('tipo'))return v==='income'?'arrow-up':v==='expense'?'arrow-down':'tag';
 if(nameKey.includes('account')||nameKey.includes('conta'))return 'wallet';
 if(nameKey.includes('partner')||nameKey.includes('parceiro'))return 'briefcase-business';
 if(nameKey.includes('status'))return v==='settled'?'check':v==='open'?'history':'tag';
 return 'tag';
}

/* Curated, explicit choices stored on category records. */
export const CATEGORY_ICON_OPTIONS=[
 ['tag','Geral'],['droplets','Água'],['zap','Energia'],['wifi','Internet'],
 ['house','Moradia'],['shopping-cart','Compras'],['shopping-bag','Vendas'],
 ['utensils','Alimentação'],['fuel','Combustível'],['car','Transporte'],
 ['heart-pulse','Saúde'],['graduation-cap','Educação'],['briefcase-business','Trabalho'],
 ['receipt','Impostos'],['wallet','Finanças'],['credit-card','Cartão'],
 ['phone','Telefone'],['shirt','Vestuário'],['gift','Presentes'],
 ['wrench','Manutenção'],['layers','Outros'],
 ['bike','Bicicleta'],
 ['pill','Medicamentos'],
 ['stethoscope','Consultas'],
 ['shield-check','Seguro'],
 ['route','Viagem terrestre'],
 ['circle-parking','Estacionamento'],
 ['bus','Ônibus'],
 ['monitor-play','Digital'],
 ['tv','Streaming'],
 ['book-open','Livros'],
 ['laptop','Computador'],
 ['dumbbell','Academia'],
 ['gamepad-2','Jogos'],
 ['plane','Viagem aérea'],
 ['bed-double','Hospedagem'],
 ['paw-print','Pet'],
 ['landmark','Bancos'],
 ['percent','Percentual'],
 ['chart-no-axes-combined','Investimentos'],
 ['megaphone','Publicidade'],
 ['calculator','Contabilidade'],
 ['notebook-pen','Escritório'],
 ['package','Produtos'],
 ['spray-can','Limpeza'],
 ['scissors','Estética'],
 ['coffee','Café'],
 ['users','Família'],
 ['badge-dollar-sign','Ganhos'],
 ['coins','Moedas'],
 ['trophy','Prêmios'],
 ['music','Música'],
 ['baby','Crianças'],
 ['ticket','Eventos'],
 ['flower-2','Jardinagem']
];
export function categoryIconFor(category){
 const stored=category?.icon;
 return CATEGORY_ICON_OPTIONS.some(([name])=>name===stored)?stored:gbCategoryIcon(category?.name||'');
}
