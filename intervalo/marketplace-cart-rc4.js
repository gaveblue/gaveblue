// Carrinho de catálogo por restaurante. Contém somente IDs/quantidades/observações, nunca PII nem valores confiáveis.
const key='intervalo-marketplace-cart-v1';
const validId=x=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
export const formatBRL=x=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(x||0)/100);
export function loadCart(slug){
 try{
  const raw=sessionStorage.getItem(key);if(!raw)return {slug,items:[]};
  const parsed=JSON.parse(raw);
  if(parsed?.version!==1||parsed.slug!==slug||!Array.isArray(parsed.items))return {slug,items:[]};
  const items=parsed.items.slice(0,25).filter(item=>validId(item.product_id)&&
   Number.isSafeInteger(item.quantity)&&item.quantity>=1&&item.quantity<=20&&
   Array.isArray(item.option_ids)&&item.option_ids.length<=12&&
   item.option_ids.every(validId)&&typeof item.note==='string'&&item.note.length<=350);
  return {slug,items};
 }catch{return {slug,items:[]}}
}
export function saveCart(slug,items){
 if(!Array.isArray(items)||items.length>25)throw Error('Limite de 25 itens diferentes por pedido.');
 const normalized=items.map(i=>({product_id:i.product_id,option_ids:i.option_ids??[],quantity:i.quantity,note:String(i.note??'').trim().slice(0,350)}));
 try{sessionStorage.setItem(key,JSON.stringify({version:1,slug,items:normalized}))}
 catch{throw Error('O navegador bloqueou o carrinho. Ative o armazenamento para continuar.')}
 return {slug,items:normalized};
}
export function addCartItem(slug,entry){
 const cart=loadCart(slug),opt=[...(entry.option_ids??[])].sort();
 if(!validId(entry.product_id)||!opt.every(validId)||opt.length>12)throw Error('Produto ou adicionais inválidos');
 const note=String(entry.note??'').trim().slice(0,350);
 const found=cart.items.find(x=>x.product_id===entry.product_id&&x.note===note&&JSON.stringify([...x.option_ids].sort())===JSON.stringify(opt));
 const qty=Number(entry.quantity);
 if(!Number.isSafeInteger(qty)||qty<1||qty>20)throw Error('Quantidade inválida');
 if(found){if(found.quantity+qty>20)throw Error('Limite de 20 unidades deste item');found.quantity+=qty}
 else cart.items.push({product_id:entry.product_id,option_ids:opt,quantity:qty,note});
 return saveCart(slug,cart.items);
}
export function setCartItemQuantity(slug,index,qty){
 const cart=loadCart(slug);if(!Number.isInteger(index)||index<0||index>=cart.items.length)throw Error('Item inválido');
 if(qty<=0)cart.items.splice(index,1);else if(Number.isInteger(qty)&&qty<=20)cart.items[index].quantity=qty;else throw Error('Quantidade inválida');
 return saveCart(slug,cart.items);
}
export function clearCart(slug){return saveCart(slug,[])}
export const cartCount=cart=>cart.items.reduce((n,x)=>n+x.quantity,0);
