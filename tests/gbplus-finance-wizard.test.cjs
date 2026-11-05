'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../gbplus'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const strip=s=>s.replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const mask=new Function(strip(read('js/gb-finance-input.js'))+';return {formatCentavos,moneyFromStored,parseMoneyCentavos,formatPhone,formatTaxId,formatCpf,formatCnpj};')();
const holidays=new Function(strip(read('js/gb-calendar-rules.js'))+';return {expectedDates,nextBusinessDay,isBusinessDay,nationalHolidays};')();
const icons=new Function(strip(read('js/gb-icons.js'))+';return {CATEGORY_ICON_OPTIONS,categoryIconFor,gbIcon,gbOptionIcon};')();
let identifier=0;
const domain=new Function('crypto','parseMoneyCentavos','expectedDates','nextBusinessDay',strip(read('js/domain.js'))+';return {cents,generateTitles,addMonths,updateTitle,validDate};')(
 {randomUUID:()=>String(++identifier)},mask.parseMoneyCentavos,holidays.expectedDates,holidays.nextBusinessDay);
test('typing digits is centavo-first: 1→0,01, 10→0,10, 123456→1.234,56',()=>{
 assert.equal(mask.formatCentavos('1'),'0,01');
 assert.equal(mask.formatCentavos('10'),'0,10');
 assert.equal(mask.formatCentavos('123456'),'1.234,56');
 assert.equal(mask.moneyFromStored('1234.56'),'1.234,56');
 assert.equal(mask.moneyFromStored('-12.34'),'-12,34');
 assert.equal(domain.cents('1.234,56'),123456);
 assert.equal(domain.cents('0,01'),1);
 assert.equal(domain.cents('-12,34'),-1234);
});
test('phone and tax IDs format progressively',()=>{
 assert.equal(mask.formatPhone('11987654321'),'(11) 98765-4321');
 assert.equal(mask.formatPhone('1133445566'),'(11) 3344-5566');
 assert.equal(mask.formatTaxId('52998224725'),'529.982.247-25');
 assert.equal(mask.formatTaxId('12345678000190'),'12.345.678/0001-90');
});
test('roll-forward business days accounts for weekends and national holidays',()=>{
 assert.equal(holidays.nextBusinessDay('2026-11-15'),'2026-11-16');
 assert.equal(holidays.nextBusinessDay('2026-11-20'),'2026-11-23');
 assert.equal(holidays.nextBusinessDay('2027-01-01'),'2027-01-04');
 assert.ok(holidays.isBusinessDay('2026-11-23'));
 assert.ok(!holidays.isBusinessDay('2026-11-20'));
});
test('installments split total exactly; dates match preview planner',()=>{
 const input={type:'expense',description:'Teste',amount:100,due:'2026-10-20',issue:'2026-10-10',categoryId:'c',partnerId:'',document:'',notes:'',accountId:''};
 const plan=holidays.expectedDates('2026-10-20','installment',3,true,domain.addMonths);
 const titles=domain.generateTitles(input,'installment',3,{businessDays:true});
 assert.deepEqual(titles.map(x=>x.amount),[34,33,33]);
 assert.deepEqual(titles.map(x=>x.due),plan.map(x=>x.date));
 assert.deepEqual(titles.map(x=>x.originalDue),plan.map(x=>x.nominal));
 assert.equal(titles[1].due,'2026-11-23');
 assert.equal(titles.reduce((sum,x)=>sum+x.amount,0),100);
 assert.ok(titles.every(x=>x.businessDays===true));
});
test('without adjustment original due-date rules are preserved',()=>{
 const base={type:'income',description:'Mensalidade',amount:2000,due:'2026-10-20'};
 const titles=domain.generateTitles(base,'recurring',3,{businessDays:false});
 assert.deepEqual(titles.map(x=>x.due),['2026-10-20','2026-11-20','2026-12-20']);
 assert.deepEqual(titles.map(x=>x.amount),[2000,2000,2000]);
 assert.ok(titles.every(x=>x.businessDays===false));
});
test('wizard is two stages, first ends at due date, second starts with amount',()=>{
 const src=read('js/forms.js');
 const first=src.indexOf('id="gb-entry-step-one"');
 const second=src.indexOf('id="gb-entry-step-two"');
 assert.ok(first>0&&second>first);
 const due=src.indexOf("field('Vencimento'");
 const amount=src.indexOf("field('Valor (R$)'");
 assert.ok(first<due&&due<second&&second<amount);
 assert.ok(src.includes('data-action="title-next"'));
 assert.ok(src.includes('data-action="title-back"'));
 assert.ok(src.includes('name="businessDays"'));
 assert.ok(src.includes('id="gb-entry-schedule"'));
});
test('chosen category icons are persisted, validated and shown in dropdown',()=>{
 assert.ok(icons.CATEGORY_ICON_OPTIONS.some(([id])=>id==='droplets'));
 assert.equal(icons.categoryIconFor({name:'Outros',icon:'zap'}),'zap');
 assert.ok(read('js/forms.js').includes("categoryIconFor(c)"));
 assert.ok(read('js/forms.js').includes("data-action=\"category-icon\""));
 assert.ok(read('js/entry-select.js').includes('gb-entry-chosen-icon'));
 assert.ok(read('js/store.js').includes('CATEGORY_ICON_OPTIONS.some'));
});
test('saving only occurs after stage two and final review',()=>{
 const app=read('js/app.js');
 assert.ok(app.includes("if(form.dataset.step!=='2')throw Error"));
 assert.ok(app.includes('generateTitles(input,v.mode'));
 assert.ok(app.includes('{businessDays}'));
 assert.ok(app.includes("'save-generation':"));
 assert.ok(app.includes("v.businessDays==='true'"));
 assert.ok(app.includes("categoryIconFor(c)"));
 assert.ok(app.includes('refreshEntrySchedule'));
 assert.ok(read('gb-entry-wizard.css').includes('.gb-entry-progress'));
});
