/* Financial due-date planner.
   National Brazilian holidays are skipped when user enables "dias úteis".
   State and city holidays need their own calendars and are not guessed. */
function iso(y,m,d){return [y,String(m).padStart(2,'0'),String(d).padStart(2,'0')].join('-');}
export function easterUTC(year){
 // Gregorian computus (Meeus/Jones/Butcher).
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
 const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
 const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
 const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
 const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
 return new Date(Date.UTC(year,month-1,day));
}
export function nationalHolidays(year){
 const fixed=['01-01','04-21','05-01','09-07','10-12','11-02','11-15','11-20','12-25'];
 const all=new Set(fixed.map(s=>year+'-'+s));
 const passion=new Date(easterUTC(year));passion.setUTCDate(passion.getUTCDate()-2);
 all.add(iso(passion.getUTCFullYear(),passion.getUTCMonth()+1,passion.getUTCDate()));
 return all;
}
export function isBusinessDay(value){
 const date=new Date(value+'T12:00:00Z');
 if(Number.isNaN(+date)||date.toISOString().slice(0,10)!==value)return false;
 const weekday=date.getUTCDay();
 return weekday!==0&&weekday!==6&&!nationalHolidays(date.getUTCFullYear()).has(value);
}
export function nextBusinessDay(value){
 let date=new Date(value+'T12:00:00Z');
 if(Number.isNaN(+date)||date.toISOString().slice(0,10)!==value)throw Error('Informe uma data de vencimento válida.');
 for(let attempt=0;attempt<15;attempt++){
  const key=iso(date.getUTCFullYear(),date.getUTCMonth()+1,date.getUTCDate());
  if(isBusinessDay(key))return key;
  date.setUTCDate(date.getUTCDate()+1);
 }
 throw Error('Não foi possível calcular o próximo dia útil.');
}
export function expectedDates(due,mode,count,businessDays,addMonths){
 const size=mode==='single'?1:count;
 if(!Number.isInteger(size)||size<1||size>120)throw Error('Informe de 1 a 120 vencimentos.');
 return Array.from({length:size},(_,i)=>{
  const nominal=addMonths(due,i);
  return {index:i+1,nominal,date:businessDays?nextBusinessDay(nominal):nominal,shifted:businessDays&&!isBusinessDay(nominal)};
 });
}
