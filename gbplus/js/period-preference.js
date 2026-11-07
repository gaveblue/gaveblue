// Preferência de visualização por usuário, sem modificar dados financeiros.
const PREFIX='gbplus-period-v1:';
const PERIODS=new Set(['month','last','year','all','custom']);
function validDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [year,month,day]=value.split('-').map(Number);
 const parsed=new Date(Date.UTC(year,month-1,day));
 return parsed.getUTCFullYear()===year&&parsed.getUTCMonth()===month-1&&parsed.getUTCDate()===day;
}
function normalize(value){
 if(!value||!PERIODS.has(value.period))return null;
 if(value.period!=='custom')return {period:value.period};
 const from=value.range?.from,to=value.range?.to;
 return validDate(from)&&validDate(to)&&from<=to?{period:'custom',range:{from,to}}:null;
}
export function readPeriodPreference(storage,userId){
 if(!storage||!userId)return null;
 try{return normalize(JSON.parse(storage.getItem(PREFIX+userId)||'null'));}
 catch{return null;}
}
export function writePeriodPreference(storage,userId,value){
 if(!storage||!userId)return false;
 const preference=normalize(value);
 if(!preference)return false;
 try{storage.setItem(PREFIX+userId,JSON.stringify(preference));return true;}
 catch{return false;}
}
