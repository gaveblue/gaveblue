// Offline-friendly SVG charts, using exactly the same data as EasyUI React.
// Never changes payment records, fetches remote assets, or delays sign-in.
import {buildChartPayload} from './gb-charts-data.js?v=20261105-47';
const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const short=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1});
const money=n=>currency.format(Number.isFinite(n)?n:0);
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
function barMarkup(rows,periodLabel){
  const n=rows.length,w=Math.max(400,n*58+54),h=228,left=48,base=174,top=18,step=(w-left-12)/Math.max(1,n);
  const peak=Math.max(1,...rows.flatMap(r=>[r.income,r.expense]));
  const magnitude=Math.pow(10,Math.floor(Math.log10(peak/4)));
  const tick=Math.ceil(peak/4/magnitude)*magnitude;
  const limit=Math.max(peak,tick*4);
  const grid=[0,1,2,3,4].map(i=>{const y=base-i*(base-top)/4;return '<path d="M'+left+' '+y+' H'+(w-12)+'" class="gb-native-grid"/><text x="'+(left-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="currentColor">'+esc(short.format(i*limit/4))+'</text>';}).join('');
  const marks=rows.map((r,i)=>{const center=left+step*(i+.5),bw=Math.min(18,step*.29),income=Math.max(0,r.income),expense=Math.max(0,r.expense),ih=income/limit*(base-top),eh=expense/limit*(base-top);return '<rect x="'+(center-bw-2)+'" y="'+(base-ih)+'" width="'+bw+'" height="'+ih+'" rx="3" fill="#16a34a"><title>'+esc(r.label+' · Receitas '+money(income))+'</title></rect><rect x="'+(center+2)+'" y="'+(base-eh)+'" width="'+bw+'" height="'+eh+'" rx="3" fill="#ef4444"><title>'+esc(r.label+' · Despesas '+money(expense))+'</title></rect>'+(n<=10||i%Math.ceil(n/10)===0||i===n-1?'<text x="'+center+'" y="197" text-anchor="middle" font-size="11" fill="currentColor">'+esc(r.label)+'</text>':'');}).join('');
  return '<section class="gb-native-bars"><div class="gb-native-bar-header"><div><strong>Receitas e despesas</strong><span>Movimentações efetivamente baixadas</span></div><div class="gb-native-legend"><span><i class="gb-native-key income"></i>Receitas</span><span><i class="gb-native-key expense"></i>Despesas</span></div></div>'+(n>12?'<p class="gb-native-interaction">Deslize para conferir os outros períodos '+esc(periodLabel)+'</p>':'')+'<div class="gb-native-scroll" tabindex="0" aria-label="Gráfico de barras rolável"><svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Receitas verdes e despesas vermelhas por período">'+grid+marks+'</svg></div></section>';
}
export function mountNativeCharts(db,state,flowRows){
  const earnings=document.querySelector('[data-gb-native="earnings"]'),bars=document.querySelector('[data-gb-native="cashflow-bars"]');
  if(!earnings&&!bars)return;
  const payload=buildChartPayload(db,state,flowRows,{includeEarnings:!!earnings});
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
  if(bars&&payload.bar.data.length){
    bars.hidden=false;
    bars.innerHTML=barMarkup(payload.bar.data.slice(-36),payload.bar.periodLabel);
  }
}
