import {uid,validDate,paid,today} from './domain.js';
export const KEY='gb-plus:data:v1';
export const INDICATORS={balance:'Saldo disponível',receivable:'A receber',payable:'A pagar',provisions:'Provisões líquidas',received:'Receitas recebidas',spent:'Despesas pagas',result:'Resultado financeiro',overdue:'Títulos vencidos',chart:'Fluxo de caixa',upcoming:'Próximos vencimentos'};
export const defaultPanel=()=>({desktop:Object.fromEntries(Object.keys(INDICATORS).map(k=>[k,true])),mobile:Object.fromEntries(Object.keys(INDICATORS).map(k=>[k,true]))});
// The first and middle shortcuts (Início and Novo) are permanent. The three other slots are user-defined.
export const MOBILE_SHORTCUTS=[
 ['titles','Lançamentos','transfer'],['payable','A pagar','down'],['receivable','A receber','up'],
 ['provisions','Provisões','layers'],['flow','Fluxo de caixa','chart'],
 ['partners','Parceiros','people'],['accounts','Contas','wallet'],
 ['categories','Categorias','category'],['reports','Relatórios','chart'],
 ['notifications','Notificações','bell'],['settings','Configurações','settings'],
 ['profile','Meu perfil','user'],['menu','Mais','more']
];
export const defaultMobileNav=()=>['titles','partners','menu'];
export const validMobileNav=values=>Array.isArray(values)&&values.length===3&&new Set(values).size===3&&values.every(value=>MOBILE_SHORTCUTS.some(([key])=>key===value));
export const effectiveMobileNav=settings=>validMobileNav(settings?.mobileNav)?settings.mobileNav:defaultMobileNav();
export function shouldOfferSetup(db){
 if(db?.settings?.setupCompleted===true)return false;
 if(db?.settings?.setupCompleted===false)return true;
 // Backward-compatible: do not trigger first-run wizard on existing edited finances.
 return db?.revision===0&&['accounts','titles','payments','transfers','partners'].every(k=>Array.isArray(db[k])&&!db[k].length);
}
export function emptyDatabase(){return {schemaVersion:1,revision:0,titles:[],payments:[],partners:[],accounts:[],transfers:[],categories:[...['Água','Energia elétrica','Internet','Aluguel','Salários','Impostos','Combustíveis','Manutenção','Fretes','Serviços','Compras','Outras despesas'].map(name=>({id:uid(),name,type:'expense'})),...['Vendas','Prestação de serviços','Recebimento de clientes','Reembolsos','Outras receitas'].map(name=>({id:uid(),name,type:'income'}))],settings:{theme:'light',panel:defaultPanel(),mobileNav:defaultMobileNav(),setupCompleted:false}};}
const assert=(ok,message)=>{if(!ok)throw Error(`Backup inválido: ${message}`);};
const str=(s,max=2000)=>typeof s==='string'&&s.length<=max;
const amount=n=>Number.isSafeInteger(n)&&Math.abs(n)<=1e12;
export function validateDatabase(db){
  assert(db&&db.schemaVersion===1,'versão não suportada.');
  for(const key of ['titles','payments','partners','accounts','transfers','categories']) {assert(Array.isArray(db[key])&&db[key].length<=100000,`lista ${key}.`); const ids=new Set(); for(const row of db[key]){assert(row&&str(row.id,100)&&/^[A-Za-z0-9_-]+$/.test(row.id)&&!ids.has(row.id),`identificador em ${key}.`);ids.add(row.id);}}
  const has=(key,id)=>db[key].some(x=>x.id===id);
  for(const c of db.categories)assert(str(c.name,100)&&c.name.trim()&&['income','expense'].includes(c.type),'categoria.');
  for(const a of db.accounts)assert(str(a.name,120)&&a.name.trim()&&str(a.bank,120)&&str(a.branch,80)&&str(a.number,80)&&amount(a.initial)&&typeof a.active==='boolean','conta.');
  for(const p of db.partners)assert(str(p.name,200)&&p.name.trim()&&['tradeName','document','phone','email','address','notes'].every(k=>str(p[k]))&&typeof p.active==='boolean'&&Array.isArray(p.roles)&&p.roles.length>0&&p.roles.every(r=>['Cliente','Fornecedor','Transportadora','Funcionário','Outros'].includes(r)),'parceiro.');
  for(const t of db.titles){assert(str(t.description,300)&&t.description.trim()&&str(t.document,100)&&str(t.notes)&&['income','expense'].includes(t.type)&&amount(t.amount)&&t.amount>0&&validDate(t.issue)&&validDate(t.due)&&typeof t.cancelled==='boolean','título.');assert((!t.partnerId||has('partners',t.partnerId))&&(!t.accountId||has('accounts',t.accountId))&&db.categories.some(c=>c.id===t.categoryId&&c.type===t.type),'referência do título.');assert(['single','installment','recurring'].includes(t.mode)&&Number.isInteger(t.sequence)&&Number.isInteger(t.count)&&t.sequence>=1&&t.sequence<=t.count&&t.count<=120&&(t.groupId===null||str(t.groupId,100)),'série do título.');}
  for(const p of db.payments)assert(has('titles',p.titleId)&&has('accounts',p.accountId)&&validDate(p.date)&&p.date<=today()&&amount(p.amount)&&p.amount>0,'baixa.');
  for(const t of db.titles)assert(paid(db,t.id)<=t.amount&&(!t.cancelled||paid(db,t.id)===0),'baixas maiores que o título ou título cancelado com baixa.');
  for(const t of db.transfers)assert(has('accounts',t.from)&&has('accounts',t.to)&&t.from!==t.to&&validDate(t.date)&&t.date<=today()&&amount(t.amount)&&t.amount>0,'transferência.');
  assert(db.settings&&['light','dark'].includes(db.settings.theme),'tema.');for(const device of ['desktop','mobile']){assert(db.settings.panel?.[device],'painel.');for(const k of Object.keys(INDICATORS))assert(typeof db.settings.panel[device][k]==='boolean','indicador.');}
  // Optional on older backups: unchanged data can be loaded without migration.
  if(db.settings.mobileNav!==undefined)assert(validMobileNav(db.settings.mobileNav),'atalhos da barra inferior.');
  if(db.settings.setupCompleted!==undefined)assert(typeof db.settings.setupCompleted==='boolean','configuração inicial.');
  assert(Number.isSafeInteger(db.revision)&&db.revision>=0,'revisão.');return db;
}
// Repository boundary: replace this adapter to migrate persistence without changing financial rules.
export class LocalRepository {
  constructor(storage=localStorage){this.storage=storage;this.raw=null;}
  async read(){const raw=this.storage.getItem(KEY);this.raw=raw;return raw?validateDatabase(JSON.parse(raw)):emptyDatabase();}
  async save(db){if(this.storage.getItem(KEY)!==this.raw)throw Error('Os dados foram alterados em outra aba. Atualize a página antes de salvar.'); const next=structuredClone(db);next.revision++;validateDatabase(next);const raw=JSON.stringify(next);try{this.storage.setItem(KEY,raw);}catch{throw Error('Não foi possível salvar. Verifique o espaço e a permissão de armazenamento do navegador.');}this.raw=raw;return next;}
  async restore(db){validateDatabase(db);return this.save(db);}
}
export function parseBackup(text){let obj;try{obj=JSON.parse(text);}catch{throw Error('O arquivo não é um JSON válido.');}assert(obj?.application==='GB+'&&obj?.data,'arquivo não pertence ao GB+.');return validateDatabase(obj.data);}
export const backupText = db => JSON.stringify({application:'GB+',exportedAt:new Date().toISOString(),data:db},null,2);
