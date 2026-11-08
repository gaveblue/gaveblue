// GB+ 2.8.2: categorias adicionais. Não apaga nem renomeia categorias existentes.
export const CATEGORY_SUGGESTIONS = Object.freeze([
  ['Condomínio','expense','house'],['Gás de cozinha','expense','zap'],
  ['Supermercado','expense','shopping-cart'],['Restaurantes','expense','utensils'],
  ['Delivery','expense','bike'],['Farmácia','expense','pill'],
  ['Consultas médicas','expense','stethoscope'],['Plano de saúde','expense','shield-check'],
  ['Seguro de veículos','expense','shield-check'],['IPVA e licenciamento','expense','car'],
  ['Pedágios','expense','route'],['Estacionamento','expense','circle-parking'],
  ['Transporte público','expense','bus'],['Aplicativos de transporte','expense','car'],
  ['Assinaturas digitais','expense','monitor-play'],['Streaming','expense','tv'],
  ['Mensalidade escolar','expense','book-open'],['Cursos e capacitações','expense','graduation-cap'],
  ['Academia','expense','dumbbell'],['Lazer e entretenimento','expense','gamepad-2'],
  ['Viagens','expense','plane'],['Hospedagem','expense','bed-double'],
  ['Animais de estimação','expense','paw-print'],['Doações','expense','gift'],
  ['Empréstimos e financiamentos','expense','landmark'],['Tarifas bancárias','expense','landmark'],
  ['Juros e multas','expense','percent'],['Aplicações financeiras','expense','chart-no-axes-combined'],
  ['Publicidade e marketing','expense','megaphone'],['Honorários contábeis','expense','calculator'],
  ['Material de escritório','expense','notebook-pen'],['Equipamentos','expense','package'],
  ['Produtos de limpeza','expense','spray-can'],['Fretes e entregas','expense','package'],
  ['Cuidados pessoais','expense','scissors'],['Cafeteria','expense','coffee'],
  ['Pensão alimentícia','expense','users'],['Presentes e lembranças','expense','gift'],
  ['Comissões recebidas','income','badge-dollar-sign'],['Aluguéis recebidos','income','house'],
  ['Rendimentos financeiros','income','chart-no-axes-combined'],['Juros recebidos','income','percent'],
  ['Cashback','income','coins'],['Prêmios e bonificações','income','trophy'],
  ['Venda de produtos','income','shopping-bag'],['Trabalhos autônomos','income','laptop'],
  ['Dividendos','income','badge-dollar-sign'],['Restituição de impostos','income','receipt'],
  ['Doações recebidas','income','gift'],['Receita de assinaturas','income','monitor-play']
]);
const normalized = name => String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
export function missingCategorySuggestions(categories=[]){
  const existing=new Set(categories.map(c=>c.type+'|'+normalized(c.name)));
  return CATEGORY_SUGGESTIONS.filter(([name,type])=>!existing.has(type+'|'+normalized(name)));
}
export function appendCategorySuggestions(categories,generateId){
  const missing=missingCategorySuggestions(categories);
  for(const [name,type,icon] of missing)categories.push({id:generateId(),name,type,icon});
  return missing.length;
}
