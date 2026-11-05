'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../gbplus/js/banks.js'),'utf8')
 .replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const select=(label,name,options,value)=>'<label>'+esc(label)+'<select name="'+esc(name)+'">'+
 options.map(([id,title])=>'<option value="'+esc(id)+'" '+(value===id?'selected':'')+'>'+esc(title)+'</option>').join('')+'</select></label>';
const bank=new Function('esc','select',source+';return {BANKS,bankCatalog,findBank,matchesBank,bankPicker,bankBadge,filterBankPicker,filterBankDirectory};')(esc,select);
const normalized=text=>String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
test('at least 50 Brazilian institutions, unique IDs, official 3-digit codes, alphabetical',()=>{
 assert.ok(bank.BANKS.length>=50);
 assert.equal(new Set(bank.BANKS.map(x=>x.id)).size,bank.BANKS.length);
 assert.ok(bank.BANKS.every(x=>/^\d{3}$/.test(x.code)&&/^\d{8}$/.test(x.ispb)), 'every curated bank has COMPE and ISPB');
 const order=bank.BANKS.map(x=>x.name);
 assert.deepEqual(order,[...order].sort(new Intl.Collator('pt-BR',{sensitivity:'base'}).compare));
});
test('key requested banks are present with Banco Central codes and logos',()=>{
 assert.equal(bank.findBank(null,'756').name,'Sicoob');
 assert.equal(bank.findBank(null,'004').name,'Banco do Nordeste');
 assert.equal(bank.findBank(null,'623').name,'Banco Pan');
 assert.equal(bank.findBank(null,'07237373').name,'Banco do Nordeste');
 assert.match(bank.bankBadge(bank.findBank(null,'623')),/59285411\.svg/);
 assert.match(bank.bankBadge(bank.findBank(null,'756')),/02038232\.svg/);
});
test('name aliases and partial strings support typed bank search',()=>{
 assert.ok(bank.matchesBank(bank.findBank(null,'756'),'Sicobi'));
 assert.ok(bank.matchesBank(bank.findBank(null,'756'),'Sicoob'));
 assert.ok(bank.matchesBank(bank.findBank(null,'004'),'Nordeste'));
 assert.ok(bank.matchesBank(bank.findBank(null,'623'),'Pan'));
 assert.ok(bank.matchesBank(bank.findBank(null,'623'),'59285411'));
 assert.equal(bank.matchesBank(bank.findBank(null,'623'),'Nubank'),false);
});
test('native selection remains available while visual bank shortcuts and search are primary',()=>{
 const html=bank.bankPicker(null,'sicoob');
 assert.match(html,/class="gb-bank-search"/);
 assert.match(html,/Buscar banco por nome, COMPE ou ISPB/);
 assert.match(html,/data-action="choose-bank"/);
 assert.match(html,/Ver lista completa de bancos/);
 assert.match(html,/select name="bankId"/);
 assert.match(html,/aria-pressed="true"/);
 assert.ok((html.match(/class="gb-bank-shortcut"/g)||[]).length>=50);
});
test('filter limits visual chips to matching institution without changing saved bank ID',()=>{
 const buttons=bank.BANKS.map(b=>({
  dataset:{bankId:b.id,bankCode:b.code,bankIspb:b.ispb,bankSearch:[b.name,b.code,b.ispb,b.aliases].filter(Boolean).map(normalized).join(' ')},
  hidden:false
 }));
 const summary={textContent:''},none={hidden:true};
 const picker={
  querySelectorAll:()=>buttons,
  querySelector:key=>key==='[data-bank-count]'?summary:key==='[data-bank-no-results]'?none:null
 };
 assert.equal(bank.filterBankPicker(picker,'Sicobi'),1);
 assert.equal(buttons.filter(b=>!b.hidden)[0].dataset.bankId,'sicoob');
 assert.equal(bank.filterBankPicker(picker,'623'),1);
 assert.equal(buttons.filter(b=>!b.hidden)[0].dataset.bankId,'banco-pan');
 assert.equal(bank.filterBankPicker(picker,'notabank'),0);
 assert.equal(none.hidden,false);
 assert.equal(bank.filterBankPicker(picker,''),bank.BANKS.length);
});
test('directory search filters alphabetically without mutating accounts',()=>{
 const rows=bank.BANKS.map(b=>({dataset:{directoryBankId:b.id},hidden:false}));
 const label={textContent:''},empty={hidden:true};
 const container={
  querySelectorAll:()=>rows,
  querySelector:q=>q==='[data-bank-directory-count]'?label:q==='[data-bank-directory-empty]'?empty:null
 };
 const db={banks:[],accounts:[{id:'myaccount',bankId:'bb'}]};
 const before=JSON.stringify(db);
 assert.equal(bank.filterBankDirectory(container,db,'004'),1);
 assert.equal(rows.filter(r=>!r.hidden)[0].dataset.directoryBankId,bank.findBank(null,'004').id);
 assert.equal(JSON.stringify(db),before);
});
