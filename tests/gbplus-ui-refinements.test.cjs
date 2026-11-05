'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const strip=s=>s.replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const icons=new Function(strip(read('js/gb-icons.js'))+';return {gbIcon,gbCategoryIcon,gbOptionIcon};')();

test('period menu uses meaningful free SVG icons',()=>{
 assert.equal(icons.gbOptionIcon('period','month','Este mês'),'calendar-days');
 assert.equal(icons.gbOptionIcon('period','last','Mês anterior'),'history');
 assert.equal(icons.gbOptionIcon('period','year','Este ano'),'calendar-range');
 assert.equal(icons.gbOptionIcon('period','all','Todo o período'),'infinity');
 assert.equal(icons.gbOptionIcon('period','custom','Personalizado'),'sliders-horizontal');
 assert.match(icons.gbIcon('calendar-days'),/<svg/);
 assert.match(icons.gbIcon('key-round'),/<circle/);
});
test('category dropdown icon mapping handles accents and common expense categories',()=>{
 assert.equal(icons.gbCategoryIcon('Água'),'droplets');
 assert.equal(icons.gbCategoryIcon('ENERGIA ELÉTRICA'),'zap');
 assert.equal(icons.gbCategoryIcon('Alimentação'),'utensils');
 assert.equal(icons.gbCategoryIcon('Internet'),'wifi');
 assert.equal(icons.gbCategoryIcon('Combustível'),'fuel');
 assert.equal(icons.gbCategoryIcon('Faculdade'),'graduation-cap');
 assert.equal(icons.gbCategoryIcon('Minha categoria'),'tag');
 assert.equal(icons.gbOptionIcon('categoryId','x','Água'),'droplets');
});
test('closed selectors preserve the existing native field appearance and expose only a custom menu',()=>{
 const css=read('custom-controls.css'),controls=read('js/custom-controls.js');
 assert.ok(css.includes('.gb-custom-select-trigger'));
 assert.ok(css.includes('position:absolute;inset:0;display:block'));
 assert.ok(css.includes('opacity:1!important'));
 assert.ok(css.includes('background:transparent!important'));
 assert.ok(css.includes('.period-control select.gb-custom-native-select'));
 assert.ok(controls.includes('gb-custom-option-icon'));
 assert.ok(controls.includes('gbOptionIcon(name,value,title)'));
 assert.ok(controls.includes("pointer-events:none")===false);
 assert.ok(css.includes('pointer-events:none!important'));
 assert.ok(css.includes('font-size:16px!important'));
});
test('calendar opens an actual branded modal and quickly chooses month or year',()=>{
 const js=read('js/custom-controls.js'),css=read('custom-controls.css');
 assert.ok(js.includes("document.createElement('dialog')"));
 assert.ok(js.includes('backdrop.showModal()'));
 assert.ok(js.includes("openCalendar.mode='months'"));
 assert.ok(js.includes("openCalendar.mode='years'"));
 assert.ok(js.includes("data-calendar-year-page"));
 assert.ok(js.includes("data-calendar-month"));
 assert.ok(js.includes("data-calendar-year"));
 assert.ok(js.includes("monthHasDates(input,year,value)"));
 assert.ok(js.includes("yearHasDates(input,y)"));
 assert.ok(css.includes('.gb-calendar-pick-grid'));
 assert.ok(css.includes('.gb-calendar-backdrop::backdrop'));
});
test('My Account has a clean vector key with a round keyhole',()=>{
 const ui=read('js/ui.js'),profile=read('js/profile.js');
 assert.ok(ui.includes('key:'));
 assert.ok(ui.includes('<circle cx="16.5" cy="7.5"'));
 assert.ok(profile.includes("icon('key')"));
});
test('default period is all and custom user selections are preserved',()=>{
 const app=read('js/app.js'),views=read('js/views.js');
 assert.ok(app.includes("route:'dashboard',period:'all'"));
 assert.ok(app.includes("state.range=rangeFor('all')"));
 assert.ok(app.includes("state.period='all';state.range=rangeFor('all')"));
 assert.ok(app.includes("state.period=el.value;state.range=rangeFor(el.value)"));
 assert.ok(app.includes("state.period='custom';state.range={from:v.from,to:v.to}"));
 assert.ok(views.includes('<option value="all"'));
});
test('local open-source icon attribution and proper release metadata',()=>{
 const license=read('ICON_LICENSE.md');
 assert.ok(license.includes('Lucide'));
 assert.ok(license.includes('ISC'));
 assert.ok(license.includes('MIT'));
 const version=JSON.parse(read('version.json'));
 assert.equal(version.version,'2.2.3');
 assert.equal(version.build,40);
 assert.ok(version.assets.includes('./js/gb-icons.js'));
 assert.ok(read('index.html').includes('app.js?v=20261104-41'));
 assert.ok(read('sw.js').includes('gb-plus-shell-v40'));
});
