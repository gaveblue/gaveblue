import {esc,select} from './ui.js?v=20261105-72';

// Curated identities: ISPB maps to actual bank logos from public Open Finance sources.
// Logos are nominative identifiers only; GB+ is not affiliated with the banks.
export const BANKS=Object.freeze([
 {id:"99pay",name:"99Pay",ispb:"24313102",code:"769",logoIspb:"24313102",color:"#405b77"},
 {id:"abc-brasil",name:"ABC Brasil",ispb:"28195667",code:"246",logoIspb:"28195667",color:"#405b77"},
 {id:"agibank",name:"Agibank",ispb:"10664513",code:"121",logoIspb:"10664513",color:"#405b77"},
 {id:"arbi",name:"Arbi",ispb:"54403563",code:"213",logoIspb:"54403563",color:"#405b77"},
 {id:"banco-alfa",name:"Banco Alfa",ispb:"03323840",code:"025",logoIspb:"03323840",color:"#405b77"},
 {id:"banco-carrefour",name:"Banco Carrefour",ispb:"08357240",code:"368",logoIspb:"08357240",color:"#405b77"},
 {id:"banco-da-amazonia",name:"Banco da Amazônia",ispb:"04902979",code:"003",logoIspb:"04902979",color:"#405b77"},
 {id:"banco-de-la-nacion-argentina",name:"Banco de la Nación Argentina",ispb:"33042151",code:"300",logoIspb:"33042151",color:"#405b77"},
 {id:"bb",name:"Banco do Brasil",ispb:"00000000",code:"001",logoIspb:"00000000",color:"#f9cf00"},
 {id:"banco-do-nordeste",name:"Banco do Nordeste",ispb:"07237373",code:"004",logoIspb:"07237373",color:"#405b77",aliases:"BNB"},
 {id:"banco-original",name:"Banco Original",ispb:"92894922",code:"212",logoIspb:"92894922",color:"#405b77"},
 {id:"banco-pan",name:"Banco Pan",ispb:"59285411",code:"623",logoIspb:"59285411",color:"#405b77",aliases:"PAN"},
 {id:"banco-ribeirao-preto",name:"Banco Ribeirão Preto",ispb:"00517645",code:"741",logoIspb:"00517645",color:"#405b77"},
 {id:"banco-votorantim",name:"Banco Votorantim",ispb:"59588111",code:"655",logoIspb:"59588111",color:"#405b77"},
 {id:"banco-xp",name:"Banco XP",ispb:"33264668",code:"348",logoIspb:"33264668",color:"#405b77"},
 {id:"banese",name:"Banese",ispb:"13009717",code:"047",logoIspb:"13009717",color:"#405b77"},
 {id:"banestes",name:"Banestes",ispb:"28127603",code:"021",logoIspb:"28127603",color:"#405b77"},
 {id:"banpara",name:"Banpará",ispb:"04913711",code:"037",logoIspb:"04913711",color:"#405b77"},
 {id:"banrisul",name:"Banrisul",ispb:"92702067",code:"041",logoIspb:"92702067",color:"#405b77"},
 {id:"bmg",name:"BMG",ispb:"61186680",code:"318",logoIspb:"61186680",color:"#405b77"},
 {id:"bmg-consignado",name:"BMG Consignado",ispb:"50585090",code:"250",logoIspb:"50585090",color:"#405b77"},
 {id:"bmg-solucoes-financeiras",name:"BMG Soluções Financeiras",ispb:"62421979",code:"233",logoIspb:"62421979",color:"#405b77"},
 {id:"bndes",name:"BNDES",ispb:"33657248",code:"007",logoIspb:"33657248",color:"#405b77"},
 {id:"bnp-paribas",name:"BNP Paribas",ispb:"01522368",code:"752",logoIspb:"01522368",color:"#405b77"},
 {id:"bradescard",name:"Bradescard",ispb:"04184779",code:"063",logoIspb:"04184779",color:"#405b77"},
 {id:"bradesco",name:"Bradesco",ispb:"60746948",code:"237",logoIspb:"60746948",color:"#c91530"},
 {id:"bradesco-bbi",name:"Bradesco BBI",ispb:"06271464",code:"036",logoIspb:"06271464",color:"#405b77"},
 {id:"brb",name:"BRB",ispb:"00000208",code:"070",logoIspb:"00000208",color:"#405b77"},
 {id:"btg",name:"BTG Pactual",ispb:"30306294",code:"208",logoIspb:"30306294",color:"#002c62"},
 {id:"bv",name:"BV",ispb:"01858774",code:"413",logoIspb:"01858774",color:"#405b77"},
 {id:"c6",name:"C6 Bank",ispb:"31872495",code:"336",logoIspb:"31872495",color:"#171717"},
 {id:"c6-consignado",name:"C6 Consignado",ispb:"61348538",code:"626",logoIspb:"61348538",color:"#405b77"},
 {id:"caixa",name:"Caixa",ispb:"00360305",code:"104",logoIspb:"00360305",color:"#0068a0",aliases:"CEF Caixa Econômica Federal"},
 {id:"citibank",name:"Citibank",ispb:"33042953",code:"477",logoIspb:"33042953",color:"#405b77"},
 {id:"cora",name:"Cora",ispb:"37880206",code:"403",logoIspb:"37880206",color:"#405b77"},
 {id:"crefisa",name:"Crefisa",ispb:"61033106",code:"069",logoIspb:"61033106",color:"#405b77"},
 {id:"cresol",name:"Cresol",ispb:"10398952",code:"133",logoIspb:"10398952",color:"#405b77"},
 {id:"daycoval",name:"Daycoval",ispb:"62232889",code:"707",logoIspb:"62232889",color:"#405b77"},
 {id:"digimais",name:"Digimais",ispb:"92874270",code:"654",logoIspb:"92874270",color:"#405b77"},
 {id:"digio",name:"Digio",ispb:"27098060",code:"335",logoIspb:"27098060",color:"#405b77"},
 {id:"genial",name:"Genial",ispb:"45246410",code:"125",logoIspb:"45246410",color:"#405b77"},
 {id:"guanabara",name:"Guanabara",ispb:"31880826",code:"612",logoIspb:"31880826",color:"#405b77"},
 {id:"hsbc",name:"HSBC",ispb:"53518684",code:"269",logoIspb:"53518684",color:"#405b77"},
 {id:"infinitepay",name:"InfinitePay",ispb:"18189547",code:"542",logoIspb:"18189547",color:"#405b77"},
 {id:"inter",name:"Inter",ispb:"00416968",code:"077",logoIspb:"00416968",color:"#fa7400"},
 {id:"itau",name:"Itaú",ispb:"60701190",code:"341",logoIspb:"60701190",color:"#eb7200"},
 {id:"itaubank",name:"ItaúBank",ispb:"60394079",code:"479",logoIspb:"60394079",color:"#405b77"},
 {id:"j-safra",name:"J. Safra",ispb:"03017677",code:"074",logoIspb:"03017677",color:"#405b77"},
 {id:"mercado-pago",name:"Mercado Pago",ispb:"10573521",code:"323",logoIspb:"10573521",color:"#405b77"},
 {id:"mercantil",name:"Mercantil",ispb:"17184037",code:"389",logoIspb:"17184037",color:"#405b77"},
 {id:"mercantil-financeira",name:"Mercantil Financeira",ispb:"33040601",code:"567",logoIspb:"33040601",color:"#405b77"},
 {id:"midway",name:"Midway",ispb:"09464032",code:"358",logoIspb:"09464032",color:"#405b77"},
 {id:"neon",name:"Neon",ispb:"20855875",code:"536",logoIspb:"20855875",color:"#405b77"},
 {id:"neon-corretora",name:"Neon Corretora",ispb:"61723847",code:"113",logoIspb:"61723847",color:"#405b77"},
 {id:"neon-financeira",name:"Neon Financeira",ispb:"11285104",code:"426",logoIspb:"11285104",color:"#405b77"},
 {id:"nubank",name:"Nubank",ispb:"18236120",code:"260",logoIspb:"18236120",color:"#7a1ab9"},
 {id:"pagbank",name:"PagBank",ispb:"08561701",code:"290",logoIspb:"08561701",color:"#5bba4a"},
 {id:"pan-financeira",name:"Pan Financeira",ispb:"02682287",code:"555",logoIspb:"02682287",color:"#405b77"},
 {id:"picpay",name:"PicPay",ispb:"22896431",code:"380",logoIspb:"22896431",color:"#21b965"},
 {id:"picpay-bank",name:"PicPay Bank",ispb:"09516419",code:"079",logoIspb:"09516419",color:"#405b77"},
 {id:"picpay-invest",name:"PicPay Invest",ispb:"07138049",code:"469",logoIspb:"07138049",color:"#405b77"},
 {id:"pine",name:"Pine",ispb:"62144175",code:"643",logoIspb:"62144175",color:"#405b77"},
 {id:"rendimento",name:"Rendimento",ispb:"68900810",code:"633",logoIspb:"68900810",color:"#405b77"},
 {id:"safra",name:"Safra",ispb:"58160789",code:"422",logoIspb:"58160789",color:"#405b77"},
 {id:"santander",name:"Santander",ispb:"90400888",code:"033",logoIspb:"90400888",color:"#ed0000"},
 {id:"santander-corretora",name:"Santander Corretora",ispb:"29162769",code:"352",logoIspb:"29162769",color:"#405b77"},
 {id:"semear",name:"Semear",ispb:"00795423",code:"743",logoIspb:"00795423",color:"#405b77"},
 {id:"sicoob",name:"Sicoob",ispb:"02038232",code:"756",logoIspb:"02038232",color:"#405b77",aliases:"Sicobi Bancoob"},
 {id:"sicredi",name:"Sicredi",ispb:"01181521",code:"748",logoIspb:"01181521",color:"#3b9b35"},
 {id:"sofisa",name:"Sofisa",ispb:"60889128",code:"637",logoIspb:"60889128",color:"#405b77"},
 {id:"stone",name:"Stone",ispb:"16501555",code:"197",logoIspb:"16501555",color:"#405b77"},
 {id:"stone-financeira",name:"Stone Financeira",ispb:"53505601",code:"672",logoIspb:"53505601",color:"#405b77"},
 {id:"stonex",name:"StoneX",ispb:"28811341",code:"554",logoIspb:"28811341",color:"#405b77"},
 {id:"tribanco",name:"Tribanco",ispb:"17351180",code:"634",logoIspb:"17351180",color:"#405b77"},
 {id:"unicred",name:"Unicred",ispb:"00315557",code:"136",logoIspb:"00315557",color:"#405b77"},
 {id:"western-union",name:"Western Union",ispb:"13720915",code:"119",logoIspb:"13720915",color:"#405b77"},
 {id:"xp-investimentos",name:"XP Investimentos",ispb:"02332886",code:"102",logoIspb:"02332886",color:"#405b77"},
 {id:"yamaha",name:"Yamaha",ispb:"10371492",code:"475",logoIspb:"10371492",color:"#405b77"}
]);;
// Show these 20 familiar Brazilian institutions in the initial shortcuts.
// All 78 remain searchable and available through the full list.
export const FEATURED_BANK_IDS=Object.freeze(["bb","banco-do-nordeste","banco-pan","banrisul","bradesco","btg","bv","c6","caixa","inter","itau","mercado-pago","neon","nubank","pagbank","picpay","safra","santander","sicoob","sicredi"]);
const FEATURED_BANK_SET=new Set(FEATURED_BANK_IDS);
const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const collator=new Intl.Collator('pt-BR',{sensitivity:'base'});
export const bankCatalog=db=>[...BANKS,...(db?.banks||[])].sort((a,b)=>collator.compare(a.name,b.name));
export function matchesBank(bank,term){
 const query=normalize(term);
 if(!query)return true;
 if(/^\d{1,3}$/.test(query)){
  const code=String(bank.code||'');
  return query.length===3?code===query:code.startsWith(query)||code.replace(/^0+/,'').startsWith(query.replace(/^0+/,''));
 }
 if(/^0\d{3}$/.test(query))return String(bank.code||'')===query.slice(1);
 if(/^\d{8}$/.test(query))return String(bank.ispb||'')===query;
 return [bank.id,bank.name,bank.code,bank.ispb,bank.aliases].filter(Boolean)
  .some(value=>normalize(value).includes(query));
}
export function findBank(db,idOrName){
 const query=normalize(idOrName);
 if(!query)return null;
 return bankCatalog(db).find(b=>[b.id,b.name,b.code,b.ispb].some(s=>s&&normalize(s)===query)||
  (/^\d{1,3}$/.test(query)&&String(b.code||'').replace(/^0+/,'')===query.replace(/^0+/,'')))||null;
}
export function bankOptions(db){
 return [['','Selecione uma instituição'],...bankCatalog(db).map(b=>[b.id,b.name+(b.code?' · '+b.code:'')])];
}
export function bankBadge(bank,size=''){
 const name=String(bank?.name||'Instituição financeira');
 const initials=name.replace(/^banco\s+/i,'').split(/\s+/).filter(Boolean).map(v=>v[0]).join('').slice(0,2).toUpperCase()||'B';
 const color=/^#[0-9a-f]{6}$/i.test(bank?.color||'')?bank.color:'#535a6c';
 const logo=bank?.logoIspb&&/^\d{8}$/.test(bank.logoIspb)?
  '<img loading="lazy" decoding="async" alt="" src="./assets/banks/'+bank.logoIspb+'.svg" onerror="this.remove()" />':'';
 return '<span class="gb-bank-badge '+(size==='large'?'gb-bank-large':'')+'" style="--bank-color:'+color+'" title="'+esc(name)+'" aria-label="'+esc(name)+'">'+logo+
  '<span aria-hidden="true">'+esc(initials)+'</span></span>';
}
export function bankName(db,id,fallback=''){
 return findBank(db,id)?.name||String(fallback||'');
}
export function bankForAccount(db,account){
 return findBank(db,account?.bankId)||findBank(db,account?.bank);
}

/** Select remains a real HTML form field; visual shortcuts only choose its value. */
export function bankPicker(db,value='',label='Banco ou instituição'){
 const selected=findBank(db,value);
 const bankCards=bankCatalog(db);
 return '<div class="gb-bank-picker full"><div class="gb-bank-picker-heading"><strong>'+esc(label)+'</strong>'+
 '<span class="gb-bank-selected" data-bank-selected>'+(selected?bankBadge(selected):'<span class="gb-bank-placeholder" aria-hidden="true">B</span>')+
 '<small>'+esc(selected?.name||'Selecione um banco')+'</small></span></div>'+
 '<label class="gb-bank-search-label" for="gb-bank-search-'+esc(label.replace(/[^a-z]/gi,'').toLowerCase())+'">Buscar outros bancos por nome ou código</label>'+
 '<input id="gb-bank-search-'+esc(label.replace(/[^a-z]/gi,'').toLowerCase())+'" class="gb-bank-search" type="search" name="bankLookup" autocomplete="off" placeholder="Ex.: Sicoob, Nordeste, Pan, 623 ou 756" aria-label="Buscar banco por nome, COMPE ou ISPB">'+
 '<details class="gb-bank-native-select"><summary>Ver lista completa de bancos</summary>'+select(label,'bankId',bankOptions(db),value)+'</details>'+
 '<div class="gb-bank-search-summary" data-bank-count aria-live="polite">'+FEATURED_BANK_IDS.length+' bancos em destaque. Deslize ou pesquise no catálogo completo de '+bankCards.length+' instituições.</div>'+
 '<div class="gb-bank-shortcuts" role="group" aria-label="20 bancos em destaque, em ordem alfabética">'+bankCards.map(bank=>
  '<button type="button" class="gb-bank-shortcut" '+(FEATURED_BANK_SET.has(bank.id)?'':'hidden ')+'data-bank-featured="'+String(FEATURED_BANK_SET.has(bank.id))+'" data-action="choose-bank" data-bank-id="'+esc(bank.id)+'" data-bank-search="'+
  esc([bank.name,bank.code,bank.ispb,bank.aliases].filter(Boolean).map(normalize).join(' '))+
  '" data-bank-code="'+esc(bank.code||'')+'" data-bank-ispb="'+esc(bank.ispb||'')+'" aria-pressed="'+String(bank.id===value)+'" title="'+esc(bank.name+(bank.code?' · '+bank.code:''))+'">'+
  bankBadge(bank)+'<small>'+esc(bank.name)+'</small>'+(bank.code?'<span class="gb-bank-code">'+esc(bank.code)+'</span>':'')+'</button>').join('')+'</div>'+
 '<p class="gb-bank-no-results" data-bank-no-results hidden>Nenhuma instituição encontrada. Você pode cadastrá-la em Bancos.</p></div>';
}
export function filterBankPicker(picker,term){
 if(!picker)return 0;
 const query=normalize(term);
 let count=0;
 picker.querySelectorAll('[data-bank-id]').forEach(button=>{
  const key=String(button.dataset.bankSearch||''),code=String(button.dataset.bankCode||'');
  const ispb=String(button.dataset.bankIspb||'');
  let matches;
  if(!query)matches=button.dataset.bankFeatured==='true';
  else if(/^\d{1,3}$/.test(query))matches=query.length===3?code===query:
   code.startsWith(query)||code.replace(/^0+/,'').startsWith(query.replace(/^0+/,''));
  else if(/^0\d{3}$/.test(query))matches=code===query.slice(1);
  else if(/^\d{8}$/.test(query))matches=ispb===query;
  else matches=key.includes(query);
  button.hidden=!matches;
  if(matches)count++;
 });
 const summary=picker.querySelector('[data-bank-count]');
 if(summary)summary.textContent=query?
  count+' '+(count===1?'instituição encontrada':'instituições encontradas')+'.':
  count+' bancos em destaque. Pesquise para encontrar outros ou abra a lista completa.';
 const noResults=picker.querySelector('[data-bank-no-results]');
 if(noResults)noResults.hidden=count>0;
 return count;
}
export function syncBankPicker(picker,db){
 if(!picker)return;
 const field=picker.querySelector('select[name="bankId"]');
 if(!field)return;
 const bank=findBank(db,field.value),slot=picker.querySelector('[data-bank-selected]');
 if(slot)slot.innerHTML=(bank?bankBadge(bank):'<span class="gb-bank-placeholder" aria-hidden="true">B</span>')+
  '<small>'+esc(bank?.name||'Selecione um banco')+'</small>';
 picker.querySelectorAll('[data-bank-id]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.bankId===field.value)));
}

export function filterBankDirectory(container,db,term){
 if(!container)return 0;
 let count=0;
 container.querySelectorAll('[data-directory-bank-id]').forEach(item=>{
  const bank=findBank(db,item.dataset.directoryBankId);
  const visible=!!bank&&matchesBank(bank,term);
  item.hidden=!visible;
  if(visible)count++;
 });
 const label=container.querySelector('[data-bank-directory-count]');
 if(label)label.textContent=count+' '+(count===1?'instituição encontrada':'instituições encontradas')+'.';
 const empty=container.querySelector('[data-bank-directory-empty]');
 if(empty)empty.hidden=count>0;
 return count;
}
