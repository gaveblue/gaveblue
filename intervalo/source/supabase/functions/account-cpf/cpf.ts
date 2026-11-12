export function cpfDigits(value:unknown):string|null{
 if(typeof value!=="string"||value.length>24)return null;
 if(!/^[\d\s.\-]+$/.test(value))return null;
 const cpf=value.replace(/\D/g,"");
 if(cpf.length!==11||/^(\d)\1{10}$/.test(cpf))return null;
 for(let pos=9;pos<=10;pos++){
   let sum=0;
   for(let i=0;i<pos;i++)sum+=Number(cpf[i])*(pos+1-i);
   const n=(sum*10)%11;
   if(Number(cpf[pos])!==(n===10?0:n))return null;
 }
 return cpf;
}
export async function privateDigest(raw:string,secret:string,purpose:"cpf"|"network"="cpf"):Promise<string>{
 const encoder=new TextEncoder();
 const key=await crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const buffer=await crypto.subtle.sign("HMAC",key,encoder.encode("intervalo:"+purpose+":v1:"+raw));
 return [...new Uint8Array(buffer)].map(n=>n.toString(16).padStart(2,"0")).join("");
}
export function jsonHeaders(){
 return {"Access-Control-Allow-Origin":"https://gaveblue.com.br","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
}
