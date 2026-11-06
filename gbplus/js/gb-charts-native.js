// Offline-friendly SVG charts, using exactly the same data as EasyUI React.
// Never changes payment records, fetches remote assets, or delays sign-in.
import {buildChartPayload} from './gb-charts-data.js?v=20261106-68';
const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const short=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1});
const money=n=>currency.format(Number.isFinite(n)?n:0);
const chartDescription=status=>status==='pending'?'Valores pendentes por vencimento':status==='paid'?'Movimentações efetivamente baixadas':'Valores baixados e pendentes, sem duplicidade';
const chartLegend=status=>status==='pending'?['A receber','A pagar']:status==='paid'?['Recebidas','Pagas']:['Receitas','Despesas'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xof=(i,n,w=560)=>n===1?w/2:16+i*(w-32)/(n-1);

function earningsMarkup(p){
  const trend=p.trend||[],n=trend.length,w=560,bottom=122,maximum=Math.max(1,...trend);
  const pts=trend.map((v,i)=>({x:xof(i,n,w),y:bottom-(Math.max(0,v)/maximum)*107}));
  const poly=pts.map(q=>q.x.toFixed(2)+','+q.y.toFixed(2)).join(' ');
  const area=pts.length>1?'M'+pts[0].x+' '+bottom+' L'+pts.map(q=>q.x+' '+q.y).join(' L')+' L'+pts.at(-1).x+' '+bottom+' Z':'';
  const old=p.previous||0,delta=old?(p.total-old)/old*100:null;
  const badge=delta===null?'':('<span class="gb-native-growth '+(delta>=0?'up':'down')+'">'+(delta>0?'+':'')+delta.toFixed(1).replace('.',',')+'%</span>');
  const axes=[0,Math.floor((n-1)/2),n-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=>' <text x="'+xof(i,n,w)+'" y="154" fill="currentColor" font-size="12" text-anchor="'+(i===0?'start':i===n-1?'end':'middle')+'">'+esc(p.trendLabels[i])+'</text>').join('');
  const dots=pts.map((q,i)=>'<circle class="gb-native-dot" data-native-point="'+i+'" cx="'+q.x+'" cy="'+q.y+'" r="12" tabindex="0" role="button" aria-label="'+esc(p.trendLabels[i]+': '+money(trend[i]))+'"><title>'+esc(money(trend[i]))+'</title></circle>').join('');
  const all=p.sources.reduce((s,r)=>s+r.amount,0);
  const sources=p.sources.map(s=>'<div class="gb-native-source"><div><span>'+esc(s.label)+'</span><strong>'+money(s.amount)+'</strong></div><div class="gb-native-source-track"><span style="width:'+(all?(s.amount/all*100).toFixed(2):0)+'%;background:'+( /^#[0-9a-f]{6}$/i.test(s.color)?s.color:'#16a34a')+'"></span></div></div>').join('');
  return '<section class="gb-native-earnings"><div class="gb-native-header"><div><span class="gb-native-eyebrow">Receitas recebidas</span><strong class="gb-native-total" data-native-total>'+money(p.total)+'</strong><p class="gb-native-comparison">'+badge+esc(p.comparison||'')+'</p></div><div class="gb-native-switch" role="group" aria-label="Período das receitas">'+[['7d','7D'],['30d','30D'],['12m','12M']].map(([id,label])=>'<button type="button" data-native-range="'+id+'" aria-pressed="'+(id===p.id)+'">'+label+'</button>').join('')+'</div></div><p class="gb-native-interaction" data-native-hint>Toque no gráfico para consultar cada período</p><div class="gb-native-svg"><svg viewBox="0 0 '+w+' 164" role="img" aria-label="Evolução de receitas recebidas"><defs><linearGradient id="gb-native-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16a34a" stop-opacity=".20"/><stop offset="1" stop-color="#16a34a" stop-opacity="0"/></linearGradient></defs><path d="M16 40H544 M16 80H544 M16 122H544" class="gb-native-grid"/>'+(area?'<path fill="url(#gb-native-gradient)" d="'+area+'"/>':'')+'<polyline points="'+poly+'" class="gb-native-line"/>'+dots+axes+'</svg></div><div class="gb-native-sources-title">Receitas por categoria</div>'+sources+'</section>';
}
function barMarkup(rows,periodLabel,status='paid'){
  const n=rows.length,w=Math.max(360,n*58+54),h=228,left=48,base=174,top=18,step=(w-left-12)/Math.max(1,n);
  const peak=Math.max(1,...rows.flatMap(r=>[r.income,r.expense]));
  const magnitude=Math.pow(10,Math.floor(Math.log10(peak/4)));
  const tick=Math.ceil(peak/4/magnitude)*magnitude;
  const limit=Math.max(peak,tick*4);
  const grid=[0,1,2,3,4].map(i=>{const y=base-i*(base-top)/4;return '<path d="M'+left+' '+y+' H'+(w-12)+'" class="gb-native-grid"/><text x="'+(left-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="currentColor">'+esc(short.format(i*limit/4))+'</text>';}).join('');
  const marks=rows.map((r,i)=>{const center=left+step*(i+.5),bw=Math.min(18,step*.29),income=Math.max(0,r.income),expense=Math.max(0,r.expense),ih=income/limit*(base-top),eh=expense/limit*(base-top);return '<rect x="'+(center-bw-2)+'" y="'+(base-ih)+'" width="'+bw+'" height="'+ih+'" rx="3" fill="#16a34a"><title>'+esc(r.label+' · Receitas '+money(income))+'</title></rect><rect x="'+(center+2)+'" y="'+(base-eh)+'" width="'+bw+'" height="'+eh+'" rx="3" fill="#ef4444"><title>'+esc(r.label+' · Despesas '+money(expense))+'</title></rect>'+(n<=10||i%Math.ceil(n/10)===0||i===n-1?'<text x="'+center+'" y="197" text-anchor="middle" font-size="11" fill="currentColor">'+esc(r.label)+'</text>':'');}).join('');
  return '<section class="gb-native-bars"><div class="gb-native-bar-header"><div><strong>Receitas e despesas</strong><span>'+chartDescription(status)+'</span></div><div class="gb-native-legend"><span><i class="gb-native-key income"></i>'+chartLegend(status)[0]+'</span><span><i class="gb-native-key expense"></i>'+chartLegend(status)[1]+'</span></div></div>'+(n>12?'<p class="gb-native-interaction">Deslize para conferir os outros períodos '+esc(periodLabel)+'</p>':'')+'<div class="gb-native-scroll" tabindex="0" aria-label="Gráfico de barras rolável"><svg class="gb-native-chart-svg" style="width:'+(n<=6?'100%':w+'px')+';height:auto" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Receitas verdes e despesas vermelhas por período">'+grid+marks+'</svg></div></section>';
}

export function visibleCashflowRows(rows,mobile=false){
 // Retain the full financial table; limit only the chart density on small screens.
 return (Array.isArray(rows)?rows:[]).slice(mobile?-6:-36);
}
function trendMarkup(rows,periodLabel,mode='lines',status='paid'){
 const net=mode==='net',n=rows.length,w=Math.max(360,n*62+62),h=224,left=48,top=17,bottom=170,right=w-16;
 const income=rows.map(r=>Math.max(0,Number(r.income)||0));
 const expense=rows.map(r=>Math.max(0,Number(r.expense)||0));
 const result=rows.map((r,i)=>income[i]-expense[i]);
 const all=net?[...result,0]:[...income,...expense,0];
 const lower=Math.min(0,...all),upper=Math.max(1,...all),span=Math.max(1,upper-lower);
 const x=i=>left+(right-left)*((i+.5)/Math.max(1,n));
 const y=value=>bottom-(value-lower)/span*(bottom-top);
 const zero=y(0);
 const grid=[0,1,2,3,4].map(i=>{
  const value=lower+span*i/4,yy=y(value);
  return '<path class="gb-native-grid" d="M'+left+' '+yy+' H'+right+'"/>'+
   '<text x="'+(left-7)+'" y="'+(yy+4)+'" font-size="10" text-anchor="end" fill="currentColor">'+esc(short.format(value))+'</text>';
 }).join('');
 const line=(values,color,label)=>{
  const points=values.map((value,i)=>x(i).toFixed(2)+','+y(value).toFixed(2)).join(' ');
  const dots=values.map((value,i)=>'<circle cx="'+x(i)+'" cy="'+y(value)+'" r="4" fill="'+color+'"><title>'+esc(rows[i].label+' · '+label+': '+money(value))+'</title></circle>').join('');
  return '<polyline points="'+points+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'+dots;
 };
 const lines=net?line(result,'#6184d9','Resultado líquido'):
  line(income,'#16a34a','Receitas')+line(expense,'#ef4444','Despesas');
 const labels=rows.map((r,i)=>(i%Math.max(1,Math.ceil(n/8))===0||i===n-1)
  ?'<text x="'+x(i)+'" y="'+(bottom+21)+'" text-anchor="middle" font-size="10" fill="currentColor">'+esc(r.label)+'</text>':'').join('');
 return '<section class="gb-native-bars gb-native-lines"><div class="gb-native-bar-header"><div><strong>'+
   (net?'Resultado líquido do período':'Comparativo de receitas e despesas')+'</strong><span>'+
   (net?'Diferença entre entradas e saídas':chartDescription(status))+
   '</span></div><div class="gb-native-legend">'+(net?
   '<span><i class="gb-native-key net"></i>Receitas − despesas</span>':
   '<span><i class="gb-native-key income"></i>'+chartLegend(status)[0]+'</span><span><i class="gb-native-key expense"></i>'+chartLegend(status)[1]+'</span>')+
   '</div></div><div class="gb-native-scroll" tabindex="0" aria-label="Gráfico de linhas rolável">'+
   '<svg class="gb-native-chart-svg" style="width:'+(n<=6?'100%':w+'px')+';height:auto" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+
   (net?'Resultado líquido por período':'Comparação entre receitas e despesas por período')+'">'+
   grid+'<path d="M'+left+' '+zero+' H'+right+'" stroke="currentColor" opacity=".35" stroke-dasharray="4 3"/>'+
   lines+labels+'</svg></div></section>';
}

export function mountNativeCharts(db,state,flowRows){
  const earnings=document.querySelector('[data-gb-native="earnings"]'),bars=document.querySelector('[data-gb-native="cashflow-bars"]');
  if(!earnings&&!bars)return;
  const isMobile=typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 760px)').matches;
   const payload=buildChartPayload(db,state,flowRows,{includeEarnings:!!earnings,mobile:isMobile});
  if(earnings&&payload.earnings.hasRecords){
    earnings.hidden=false;
    const original=earnings.parentElement?.querySelector('[data-gb-chart-original]');
    if(original)original.hidden=true;
    const draw=id=>{
      const period=payload.earnings.periods.find(p=>p.id===id)||payload.earnings.periods[1];
      earnings.innerHTML=earningsMarkup(period);
      earnings.querySelectorAll('[data-native-range]').forEach(b=>b.addEventListener('click',()=>draw(b.dataset.nativeRange)));
      earnings.querySelectorAll('[data-native-point]').forEach(dot=>{
        const show=()=>{const i=Number(dot.dataset.nativePoint);const total=earnings.querySelector('[data-native-total]'),hint=earnings.querySelector('[data-native-hint]');if(total)total.textContent=money(period.trend[i]);if(hint)hint.textContent=period.trendLabels[i]+' · '+money(period.trend[i]);};
        dot.addEventListener('pointerenter',show);dot.addEventListener('pointerdown',show);dot.addEventListener('focus',show);
        dot.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();show();}});
      });
    };
    draw('30d');
  }
  if(bars){
    bars.hidden=false;
    const rows=payload.bar.data;
    const mode=['bars','lines','net'].includes(state?.flowChartMode)?state.flowChartMode:'bars';
    bars.innerHTML=(rows.some(r=>r.income!==0||r.expense!==0)?
      (mode==='bars'?barMarkup(rows,payload.bar.periodLabel,payload.bar.status):trendMarkup(rows,payload.bar.periodLabel,mode,payload.bar.status)):
      '<div class="gb-native-empty" role="status">Não há valores '+(payload.bar.status==='paid'?'baixados':payload.bar.status==='pending'?'pendentes':'registrados')+' nos períodos exibidos.</div>')+
      (payload.bar.count>payload.bar.shown?'<p class="gb-native-chart-note">Exibindo '+payload.bar.shown+' períodos próximos à data atual. A tabela abaixo mantém todos os registros filtrados.</p>':'');
  }
}
