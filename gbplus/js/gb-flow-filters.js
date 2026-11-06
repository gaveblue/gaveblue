// Read-only presentation helpers for GB+ cashflow.
// Values are integer centavos. No title, payment or account record is changed.
export function filterFlowRows(rows,status='all'){
  const mode=['all','paid','pending'].includes(status)?status:'all';
  const source=Array.isArray(rows)?rows:[];
  return source.filter(row=>{
    if(mode==='paid')return row.actualIn!==0||row.actualOut!==0;
    if(mode==='pending')return row.expectedIn!==0||row.expectedOut!==0;
    return true;
  }).map(row=>({
    ...row,
    expectedIn:mode==='paid'?0:row.expectedIn,
    expectedOut:mode==='paid'?0:row.expectedOut,
    actualIn:mode==='pending'?0:row.actualIn,
    actualOut:mode==='pending'?0:row.actualOut
  }));
}

// Centre the chart around the period being consulted, not the last future
// installment (which could be years away). The full table remains untouched.
export function selectCashflowWindow(rows,granularity='month',mobile=false,reference){
  const ordered=[...(Array.isArray(rows)?rows:[])].sort((a,b)=>a.date.localeCompare(b.date));
  const limit=mobile?6:12;
  if(ordered.length<=limit)return ordered;
  const day=reference||(()=>{
    const d=new Date();
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  })();
  let anchor=day;
  if(granularity==='month')anchor=day.slice(0,7)+'-01';
  if(granularity==='week'){
    const [y,m,d]=day.split('-').map(Number);
    const weekday=new Date(Date.UTC(y,m-1,d,12)).getUTCDay();
    anchor=new Date(Date.UTC(y,m-1,d-((weekday+6)%7),12)).toISOString().slice(0,10);
  }
  let pivot=ordered.findIndex(row=>row.date>=anchor);
  if(pivot<0)pivot=ordered.length-1;
  const before=mobile?3:6;
  const start=Math.max(0,Math.min(pivot-before,ordered.length-limit));
  return ordered.slice(start,start+limit);
}
