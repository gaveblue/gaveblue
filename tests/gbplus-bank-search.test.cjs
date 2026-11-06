'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'../gbplus');
const source=fs.readFileSync(path.join(root,'js/banks.js'),'utf8')
 .replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const select=(label,name,options,value)=>'<label>'+esc(label)+'<select name="'+esc(name)+'">'+
 options.map(([id,title])=>'<option value="'+esc(id)+'" '+(value===id?'selected':'')+'>'+esc(title)+'</option>').join('')+'</select></label>';
const bank=new Function('esc','select',source+';return {BANKS,POPULAR_BANK_IDS,bankCatalog,bankPickerCatalog,findBank,matchesBank,bankPicker,bankBadge,filterBankPicker,filterBankDirectory};')(esc,select);
const normalized=text=>String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const namesFromPicker=html=>[...html.matchAll(/data-action="choose-bank" data-bank-id="([^"]+)"/g)].map(m=>m[1]);

test('complete catalog remains alphabetical, distinct and contains valid COMPE and ISPB codes',()=>{
 assert.equal(bank.BANKS.length,78);
 assert.equal(new Set(bank.BANKS.map(b=>b.id)).size,78);
 assert.ok(bank.BANKS.every(b=>/^\d{3}$/.test(b.code)&&/^\d{8}$/.test(b.ispb)));
 assert.deepEqual(bank.BANKS.map(b=>b.name),[...bank.BANKS.map(b=>b.name)].sort(new Intl.Collator('pt-BR',{sensitivity:'base'}).compare));
});
test('popular banks lead the continuous horizontal strip in the user requested order',()=>{
 const expected=['bb','sicoob','caixa','bradesco','itau','c6','nubank'];
 assert.deepEqual(bank.POPULAR_BANK_IDS.slice(0,7),expected);
 const ids=namesFromPicker(bank.bankPicker(null));
 assert.equal(ids.length,78);
 assert.deepEqual(ids.slice(0,7),expected);
 assert.equal(new Set(ids).size,78);
 assert.ok(ids.includes('99pay')&&ids.includes('banestes')&&ids.includes('banco-pan'));
});
test('remaining institutions are sorted alphabetically after the popular first choices',()=>{
 const catalog=bank.bankPickerCatalog(null);
 const extra=catalog.slice(bank.POPULAR_BANK_IDS.length);
 assert.deepEqual(extra.map(x=>x.name),[...extra.map(x=>x.name)].sort(new Intl.Collator('pt-BR',{sensitivity:'base'}).compare));
 assert.equal(catalog.length,78);
});
test('visual interface contains only Pesquisar, without technical search hints or expansion link',()=>{
 const html=bank.bankPicker(null,'sicoob');
 assert.match(html,/>Pesquisar<\/label>/);
 assert.match(html,/placeholder="Pesquisar"/);
 assert.doesNotMatch(html,/Ver lista completa de bancos|20 bancos|78 instituições|código COMPE ou ISPB|instituições disponíveis/);
 assert.match(html,/class="gb-bank-shortcuts"/);
 assert.match(html,/select name="bankId"/);
 assert.match(html,/aria-pressed="true"/);
 assert.match(html,/02038232\.svg/);
});
test('all institutions remain visible by default and filter by name, alias and code',()=>{
 const buttons=bank.BANKS.map(b=>({
  dataset:{bankId:b.id,bankCode:b.code,bankIspb:b.ispb,bankSearch:[b.name,b.code,b.ispb,b.aliases].filter(Boolean).map(normalized).join(' ')},
  hidden:false
 }));
 const summary={textContent:''},noResults={hidden:true},strip={scrollLeft:1200};
 const picker={querySelectorAll:()=>buttons,querySelector:q=>q==='[data-bank-count]'?summary:q==='[data-bank-no-results]'?noResults:q==='.gb-bank-shortcuts'?strip:null};
 assert.equal(bank.filterBankPicker(picker,''),78);
 assert.equal(buttons.filter(x=>!x.hidden).length,78);
 assert.equal(bank.filterBankPicker(picker,'Sicobi'),1);
 assert.equal(buttons.find(x=>!x.hidden)?.dataset.bankId,'sicoob');
 assert.equal(strip.scrollLeft,0);
 assert.equal(bank.filterBankPicker(picker,'623'),1);
 assert.equal(buttons.find(x=>!x.hidden)?.dataset.bankId,'banco-pan');
 assert.equal(bank.filterBankPicker(picker,'99pay'),1);
 assert.equal(buttons.find(x=>!x.hidden)?.dataset.bankId,'99pay');
 assert.equal(bank.filterBankPicker(picker,'nãotem'),0);
 assert.equal(noResults.hidden,false);
 assert.equal(bank.filterBankPicker(picker,''),78);
});
test('bank outside popular choices is still selected and selectable in the editing form',()=>{
 const html=bank.bankPicker(null,'banestes');
 assert.match(html,/<small>Banestes<\/small>/);
 assert.match(html,/option value="banestes" selected/);
 assert.match(html,/data-action="choose-bank" data-bank-id="banestes"/);
 assert.doesNotMatch(html,/class="gb-bank-shortcut" hidden/);
});
test('custom institutions remain in the same scrolling strip and native selection field',()=>{
 const db={banks:[{id:'local-coop',name:'Cooperativa Regional',color:'#456789'}]};
 const html=bank.bankPicker(db);
 assert.equal(namesFromPicker(html).length,79);
 assert.match(html,/data-bank-id="local-coop"/);
 assert.match(html,/option value="local-coop"/);
 assert.ok(bank.matchesBank({id:'local-coop',name:'Cooperativa Regional'},'cooperativa'));
});
test('required familiar banks and identity logos remain available',()=>{
 assert.equal(bank.findBank(null,'756').name,'Sicoob');
 assert.equal(bank.findBank(null,'004').name,'Banco do Nordeste');
 assert.equal(bank.findBank(null,'623').name,'Banco Pan');
 assert.match(bank.bankBadge(bank.findBank(null,'623')),/59285411\.svg/);
 assert.match(bank.bankBadge(bank.findBank(null,'756')),/02038232\.svg/);
});
test('account and credit-card forms share the same searchable horizontal bank picker',()=>{
 const forms=fs.readFileSync(path.join(root,'js/forms.js'),'utf8');
 const cards=fs.readFileSync(path.join(root,'js/finance-24-ui.js'),'utf8');
 const setup=fs.readFileSync(path.join(root,'js/setup-ui.js'),'utf8');
 assert.match(forms,/bankPicker\(db,id\)/);
 assert.match(cards,/bankPicker\(db,card\?\.bankId\|\|''\)/);
 assert.match(setup,/bankPicker\(db,d\.bankId\|\|''\)/);
});
test('Bancos directory has compact search label without exposing COMPE or ISPB in the hint',()=>{
 const html=fs.readFileSync(path.join(root,'js/finance-24-ui.js'),'utf8');
 assert.match(html,/>Pesquisar<\/label>/);
 assert.match(html,/placeholder="Pesquisar"/);
 assert.doesNotMatch(html,/Buscar banco por nome, código COMPE ou ISPB|78 instituições disponíveis/);
 assert.match(html,/class="gb-visually-hidden" data-bank-directory-count/);
});
test('mobile scrolling stays inside the bank strip, with select as an accessible hidden fallback',()=>{
 const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 assert.match(css,/\.gb-bank-picker \.gb-bank-shortcuts\{/);
 assert.match(css,/overflow-x:auto;overflow-y:hidden/);
 assert.match(css,/touch-action:pan-x/);
 assert.match(css,/\.gb-bank-native-select\{/);
 assert.match(css,/clip-path:inset\(50%\)/);
});
test('bank directory filter does not change records',()=>{
 const rows=bank.BANKS.map(b=>({dataset:{directoryBankId:b.id},hidden:false}));
 const label={textContent:''},empty={hidden:true};
 const container={querySelectorAll:()=>rows,querySelector:q=>q==='[data-bank-directory-count]'?label:q==='[data-bank-directory-empty]'?empty:null};
 const db={banks:[],accounts:[{id:'conta',bankId:'banestes'}]};
 const snap=JSON.stringify(db);
 assert.equal(bank.filterBankDirectory(container,db,'004'),1);
 assert.equal(rows.filter(x=>!x.hidden)[0].dataset.directoryBankId,bank.findBank(null,'004').id);
 assert.equal(JSON.stringify(db),snap);
});
