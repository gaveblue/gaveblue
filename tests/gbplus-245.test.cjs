'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const js=name=>fs.readFileSync(path.join(root,'js',name),'utf8');
const compiled=source=>source.replace(/^import .*;$/gm,'').replace(/\bexport\s+/g,'');
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const select=(label,name,items,value='')=>'<label>'+esc(label)+'<select name="'+esc(name)+'">'+items.map(([id,name])=>'<option value="'+esc(id)+'" '+(id===value?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>';
const banks=new Function('esc','select',compiled(js('banks.js'))+';return {BANKS,bankBadge,bankPicker,findBank,bankOptions};')(esc,select);
const charts=new Function('buildChartPayload',compiled(js('gb-charts-native.js'))+';return {visibleCashflowRows,trendMarkup,barMarkup};')(()=>({}));
const sourceChartCss=fs.readFileSync(path.join(root,'charts-integration.css'),'utf8');
test('dashboard restores former top, positioning future projection immediately before cashflow panel',()=>{
 const app=js('app.js');
 assert.match(app,/flowSection=document\.querySelector\('#main \.dashboard-middle'\)/);
 assert.match(app,/flowSection\.insertAdjacentHTML\('beforebegin',forecastSummary\(db\)\)/);
 assert.doesNotMatch(app,/anchor\.insertAdjacentHTML\('afterend',forecastSummary\(db\)\)/);
 assert.match(js('views.js'),/VISÃO GERAL/);
});
test('twelve main financial institutions use self-hosted SVG and no CDN calls',()=>{
 assert.equal(banks.BANKS.length,12);
 for(const bank of banks.BANKS){
  const imagePath=path.join(root,'assets','banks',bank.ispb+'.svg');
  const asset=fs.readFileSync(imagePath,'utf8');
  assert.match(asset,/<svg[\s>]/i,bank.name);
  const badge=banks.bankBadge(bank);
  assert.match(badge,new RegExp('assets/banks/'+bank.ispb+'\\.svg'));
  assert.doesNotMatch(badge,/https?:\/\//);
 }
});
test('account onboarding bank picker uses native select plus visually recognizable shortcuts',()=>{
 const html=banks.bankPicker(null,'nubank');
 assert.match(html,/select name="bankId"/);
 assert.match(html,/data-action="choose-bank"/);
 assert.match(html,/18236120\.svg/);
 assert.match(html,/aria-pressed="true"/);
 assert.match(js('forms.js'),/bankPicker\(db,id\)/);
 assert.match(js('setup-ui.js'),/bankPicker\(db,d\.bankId\|\|''\)/);
 assert.match(js('app.js'),/'choose-bank':el=>/);
});
test('mobile cash flow graph reduces visual density but does not mutate transactions',()=>{
 const sample=Array.from({length:42},(_,i)=>({label:String(i+1),income:i*10,expense:100-i}));
 const snapshot=JSON.stringify(sample);
 assert.deepEqual(charts.visibleCashflowRows(sample,true),sample.slice(-6));
 assert.deepEqual(charts.visibleCashflowRows(sample,false),sample.slice(-36));
 assert.equal(JSON.stringify(sample),snapshot);
});
test('cash flow offers bars, comparative lines and net period result',()=>{
 const rows=[{label:'out.',income:100,expense:80},{label:'nov.',income:90,expense:130},{label:'dez.',income:160,expense:70}];
 assert.match(charts.barMarkup(rows,'mensais'),/Gráfico de barras rolável/);
 const line=charts.trendMarkup(rows,'mensais','lines');
 const net=charts.trendMarkup(rows,'mensais','net');
 assert.match(line,/Comparativo de receitas e despesas/);
 assert.match(line,/#16a34a/);
 assert.match(line,/#ef4444/);
 assert.match(net,/Resultado líquido do período/);
 assert.match(net,/Receitas − despesas/);
 assert.match(net,/−?\s?/);
 const views=js('views.js'),app=js('app.js');
 for(const mode of ["'bars'","'lines'","'net'"])assert.ok(views.includes('flowChartMode==='+mode),mode);
 assert.match(app,/'flow-chart-mode':el=>/);
});
test('chart containers limit width and provide their own horizontal scrolling',()=>{
 assert.match(sourceChartCss,/\.gb-cashflow-panel\{/);
 assert.match(sourceChartCss,/\.gb-cashflow-panel \.gb-native-scroll\{/);
 assert.match(sourceChartCss,/overflow-x:auto/);
 assert.match(sourceChartCss,/max-width:100%/);
 assert.match(sourceChartCss,/\.gb-flow-graph-switch/);
});
