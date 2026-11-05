import {esc,select} from './ui.js?v=20261105-72';

// Curated identities: ISPB maps to actual bank logos from public Open Finance sources.
// Logos are nominative identifiers only; GB+ is not affiliated with the banks.
export const BANKS=Object.freeze([
 {id:'bb',name:'Banco do Brasil',ispb:'00000000',color:'#f9cf00'},
 {id:'caixa',name:'Caixa',ispb:'00360305',color:'#0068a0'},
 {id:'itau',name:'Itaú',ispb:'60701190',color:'#eb7200'},
 {id:'bradesco',name:'Bradesco',ispb:'60746948',color:'#c91530'},
 {id:'santander',name:'Santander',ispb:'90400888',color:'#ed0000'},
 {id:'nubank',name:'Nubank',ispb:'18236120',color:'#7a1ab9'},
 {id:'inter',name:'Inter',ispb:'00416968',color:'#fa7400'},
 {id:'c6',name:'C6 Bank',ispb:'31872495',color:'#171717'},
 {id:'btg',name:'BTG Pactual',ispb:'30306294',color:'#002c62'},
 {id:'sicredi',name:'Sicredi',ispb:'01181521',color:'#3b9b35'},
 {id:'picpay',name:'PicPay',ispb:'22896431',color:'#21b965'},
 {id:'pagbank',name:'PagBank',ispb:'08561701',color:'#5bba4a'}
]);
const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const bankCatalog=db=>[...BANKS,...(db?.banks||[])];
export function findBank(db,idOrName){
 const target=normalize(idOrName);
 if(!target)return null;
 return bankCatalog(db).find(bank=>normalize(bank.id)===target||normalize(bank.name)===target)||null;
}
export function bankOptions(db){
 return [['','Selecione uma instituição'],...bankCatalog(db).map(b=>[b.id,b.name])];
}
export function bankBadge(bank,size=''){
 const name=String(bank?.name||'Instituição financeira');
 const initials=name.replace(/^banco\s+/i,'').split(/\s+/).filter(Boolean).map(v=>v[0]).join('').slice(0,2).toUpperCase()||'B';
 const color=/^#[0-9a-f]{6}$/i.test(bank?.color||'')?bank.color:'#535a6c';
 const logo=bank?.ispb&&/^\d{8}$/.test(bank.ispb)?
  '<img loading="lazy" decoding="async" alt="" src="./assets/banks/'+bank.ispb+'.svg" onerror="this.remove()" />':'';
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
 const popular=BANKS.slice(0,9);
 return '<div class="gb-bank-picker full"><div class="gb-bank-picker-heading"><strong>'+esc(label)+'</strong>'+
  '<span class="gb-bank-selected" data-bank-selected>'+(selected?bankBadge(selected):'<span class="gb-bank-placeholder" aria-hidden="true">B</span>')+
  '<small>'+esc(selected?.name||'Selecione um banco')+'</small></span></div>'+
  select(label,'bankId',bankOptions(db),value)+
  '<div class="gb-bank-shortcuts" role="group" aria-label="Bancos principais">'+popular.map(bank=>
   '<button type="button" class="gb-bank-shortcut" data-action="choose-bank" data-bank-id="'+esc(bank.id)+'" aria-pressed="'+String(bank.id===value)+'" title="'+esc(bank.name)+'">'+
   bankBadge(bank)+'<small>'+esc(bank.name)+'</small></button>').join('')+'</div></div>';
}
export function syncBankPicker(picker,db){
 if(!picker)return;
 const selected=picker.querySelector('select[name="bankId"]');
 if(!selected)return;
 const bank=findBank(db,selected.value);
 const slot=picker.querySelector('[data-bank-selected]');
 if(slot)slot.innerHTML=(bank?bankBadge(bank):'<span class="gb-bank-placeholder" aria-hidden="true">B</span>')+'<small>'+esc(bank?.name||'Selecione um banco')+'</small>';
 picker.querySelectorAll('[data-bank-id]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bankId===selected.value)));
}
