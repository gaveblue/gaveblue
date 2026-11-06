import {uid,validDate,paid,today} from './domain.js?v=20261105-72';
import {CATEGORY_ICON_OPTIONS} from './gb-icons.js?v=20261104-42';
import {BANKS} from './banks.js?v=20261105-87';
export const KEY='gb-plus:data:v1';
export const INDICATORS={balance:'Saldo disponível',receivable:'A receber',payable:'A pagar',provisions:'Provisões líquidas',received:'Receitas recebidas',spent:'Despesas pagas',result:'Resultado financeiro',overdue:'Títulos vencidos',chart:'Fluxo de caixa',upcoming:'Próximos vencimentos'};
export const defaultPanel=()=>({desktop:Object.fromEntries(Object.keys(INDICATORS).map(k=>[k,true])),mobile:Object.fromEntries(Object.keys(INDICATORS).map(k=>[k,true]))});
// The first and middle shortcuts (Início and Novo) are permanent. The three other slots are user-defined.
export const MOBILE_SHORTCUTS=[
 ['titles','Lançamentos','transfer'],['payable','A pagar','down'],['receivable','A receber','up'],
 ['provisions','Provisões','layers'],['flow','Fluxo de caixa','chart'],
 ['partners','Parceiros','people'],['accounts','Contas','wallet'],
 ['cards','Cartões','credit-card'],['forecast','Previsão','chart'],['banks','Bancos','building-2'],
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
const entityId=id=>str(id,100)&&/^[A-Za-z0-9_-]+$/.test(id);
function validateCreditData(db){
 const banks=db.banks||[],cards=db.cards||[],purchases=db.cardPurchases||[];
 for(const key of ['banks','cards','cardPurchases'])assert(db[key]===undefined||Array.isArray(db[key])&&db[key].length<=100000,key+' inválido.');
 const ids=new Set(BANKS.map(b=>b.id));
 for(const bank of banks){
  assert(bank&&entityId(bank.id)&&!ids.has(bank.id)&&str(bank.name,120)&&bank.name.trim()&&/^#[0-9a-fA-F]{6}$/.test(bank.color),'instituição financeira personalizada.');
  ids.add(bank.id);
 }
 const cardIds=new Set();
 for(const card of cards){
  assert(card&&entityId(card.id)&&!cardIds.has(card.id)&&str(card.name,120)&&card.name.trim()&&
   str(card.bankId||'',100)&&(!card.bankId||ids.has(card.bankId))&&
   str(card.last4||'',4)&&(!card.last4||/^\d{4}$/.test(card.last4))&&
   str(card.payAccountId||'',100)&&(!card.payAccountId||db.accounts.some(a=>a.id===card.payAccountId))&&
   Number.isSafeInteger(card.limit)&&card.limit>0&&card.limit<=1e12&&
   Number.isInteger(card.closingDay)&&card.closingDay>=1&&card.closingDay<=28&&
   Number.isInteger(card.dueDay)&&card.dueDay>=1&&card.dueDay<=28&&
   typeof card.active==='boolean','cartão de crédito.');
  cardIds.add(card.id);
 }
 const invoiceTotals=new Map(),purchaseIds=new Set(),invoiceCodes=new Set();
 for(const t of db.titles){
  if(t.cardInvoice!==true)continue;
  assert(entityId(t.cardId)&&cardIds.has(t.cardId)&&/^\d{4}-(0[1-9]|1[0-2])$/.test(t.cardCycle||'')&&
   t.type==='expense'&&!t.cancelled&&t.mode==='single','fatura de cartão.');
  const key=t.cardId+'|'+t.cardCycle;
  assert(!invoiceCodes.has(key),'fatura duplicada.');
  invoiceCodes.add(key);invoiceTotals.set(t.id,0);
 }
 for(const p of purchases){
  assert(p&&entityId(p.id)&&!purchaseIds.has(p.id)&&cardIds.has(p.cardId)&&invoiceTotals.has(p.invoiceId)&&
   str(p.description,300)&&p.description.trim()&&validDate(p.date)&&amount(p.amount)&&p.amount>0&&
   db.categories.some(c=>c.id===p.categoryId&&c.type==='expense')&&
   (!p.partnerId||db.partners.some(x=>x.id===p.partnerId))&&
   Number.isInteger(p.sequence)&&Number.isInteger(p.count)&&p.count>=1&&p.count<=36&&p.sequence>=1&&p.sequence<=p.count&&
   (p.groupId===null||entityId(p.groupId)),'compra no cartão.');
  purchaseIds.add(p.id);
  const invoice=db.titles.find(t=>t.id===p.invoiceId);
  assert(invoice.cardId===p.cardId,'compra vinculada à fatura de outro cartão.');
  invoiceTotals.set(p.invoiceId,invoiceTotals.get(p.invoiceId)+p.amount);
 }
 for(const [invoiceId,sum] of invoiceTotals){
  assert(sum>0&&db.titles.find(t=>t.id===invoiceId)?.amount===sum,'fatura não corresponde às compras do cartão.');
 }
 for(const a of db.accounts)if(a.bankId!==undefined)assert(str(a.bankId,100)&&(!a.bankId||ids.has(a.bankId)),'instituição da conta.');
}
function validateReconciliationHistory(db){
 const batches=db.bankImportBatches||[];
 assert(Array.isArray(batches)&&batches.length<=100,'histórico de importações.');
 const batchIds=new Set(),linkKeys=new Set(),recordKeys=new Set();
 let total=0;
 for(const b of batches){
  assert(b&&entityId(b.id)&&!batchIds.has(b.id)&&
   db.accounts.some(a=>a.id===b.accountId)&&['ofx','csv'].includes(b.format)&&
   typeof b.createdAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(b.createdAt)&&
   ['active','reverted'].includes(b.status)&&
   (b.status==='active'||typeof b.revertedAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(b.revertedAt))&&
   Array.isArray(b.entries)&&b.entries.length>0&&b.entries.length<=200,'lote de conciliação.');
  batchIds.add(b.id);total+=b.entries.length;
  const keysThisBatch=new Set(),targetsThisBatch=new Set();
  for(const row of b.entries){
   assert(row&&str(row.key,800)&&row.key.length>0&&
    validDate(row.date)&&amount(row.amount)&&row.amount!==0&&
    str(row.description,300)&&row.description.trim()&&
    str(row.externalId,180)&&['link','ignore','pending','create'].includes(row.action),'movimento conciliado.');
   assert(!keysThisBatch.has(row.key),'duplicidade de movimento no lote.');
   keysThisBatch.add(row.key);
   if(b.status==='active'){
    const key=b.accountId+'|'+row.key;
    assert(!recordKeys.has(key),'movimento importado repetido.');
    recordKeys.add(key);
   }
   if(row.action==='create'){
    assert(entityId(row.categoryId)&&db.categories.some(c=>c.id===row.categoryId&&c.type===row.entryType)&&
     row.entryType===(row.amount>0?'income':'expense')&&
     entityId(row.createdTitleId)&&entityId(row.createdPaymentId)&&
     row.createdTitleId!==row.createdPaymentId&&
     (!row.targetType&&!row.targetId),'lançamento importado.');
    if(b.status==='active'){
     const t=db.titles.find(t=>t.id===row.createdTitleId);
     const p=db.payments.find(p=>p.id===row.createdPaymentId);
     // The user may later reverse the payment through the ordinary finance
     // screen; retain the audit even if that happens.
     if(t)assert(t.type===row.entryType&&t.accountId===b.accountId,'tipo/conta do título importado.');
     if(p)assert(p.accountId===b.accountId&&p.titleId===row.createdTitleId,'conta da baixa importada.');
    }
    continue;
   }
   if(row.action!=='link'){
    assert(row.targetType===undefined&&row.targetId===undefined,'movimento não vinculado.');
    continue;
   }
   assert(['payment','transfer'].includes(row.targetType)&&entityId(row.targetId),'vínculo de conciliação.');
   const target=row.targetType+':'+row.targetId;
   assert(!targetsThisBatch.has(target),'baixa duplicada no lote.');
   targetsThisBatch.add(target);
   if(b.status==='active'){
    const link=b.accountId+'|'+target;
    assert(!linkKeys.has(link),'baixa vinculada em mais de um lote.');
    linkKeys.add(link);
   }
   if(row.targetType==='payment'){
    const payment=db.payments.find(p=>p.id===row.targetId);
    const title=db.titles.find(t=>t.id===payment?.titleId);
    // A baixa pode ter sido estornada depois de conciliar. O vínculo permanece
    // como evidência histórica, mas não pode impedir a rotina de estorno.
    if(payment&&title)assert(payment.accountId===b.accountId&&
     row.amount===(title.type==='income'?payment.amount:-payment.amount),'baixa da conta importada.');
   }else{
    const transfer=db.transfers.find(t=>t.id===row.targetId);
    // Transferências também podem ser estornadas por suas próprias rotinas.
    if(transfer)assert(transfer.from===b.accountId&&row.amount===-transfer.amount||
     transfer.to===b.accountId&&row.amount===transfer.amount,'transferência da conta importada.');
   }
  }
 }
 assert(total<=10000,'histórico de importações excedeu limite.');
}
export function validateDatabase(db){
  assert(db&&db.schemaVersion===1,'versão não suportada.');
  for(const key of ['titles','payments','partners','accounts','transfers','categories']) {assert(Array.isArray(db[key])&&db[key].length<=100000,`lista ${key}.`); const ids=new Set(); for(const row of db[key]){assert(row&&str(row.id,100)&&/^[A-Za-z0-9_-]+$/.test(row.id)&&!ids.has(row.id),`identificador em ${key}.`);ids.add(row.id);}}
  const has=(key,id)=>db[key].some(x=>x.id===id);
  for(const c of db.categories)assert(str(c.name,100)&&c.name.trim()&&['income','expense'].includes(c.type)&&(c.icon===undefined||CATEGORY_ICON_OPTIONS.some(([key])=>key===c.icon)),'categoria.');
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
  validateCreditData(db);
  validateReconciliationHistory(db);
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
