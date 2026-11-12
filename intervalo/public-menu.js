// Intervalo — cardápio público, modo consulta na fase piloto.
export async function renderPublicMenu({supabase,slug,box,esc,link}){
 const style='<style>.public-head{padding:30px 12px;text-align:center;background:#fff;border:1px solid #e2e8f0;border-radius:18px}.public-head h1{font-size:clamp(30px,4vw,44px);letter-spacing:-1px}.public-cat{margin:34px 0 10px}.public-items{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.public-product{padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}.public-product p{line-height:1.45;color:#64748b;font-size:13px}.public-product strong{color:#0f766e}.public-option{font-size:12px;color:#475569}.public-note{font-size:12px;color:#64748b;line-height:1.5}</style>';
 box(style+'<section class="panel" style="text-align:center"><h1>Cardápio digital</h1><p class="muted">Carregando produtos...</p></section>');
 const {data,error}=await supabase.functions.invoke("public-menu",{body:{slug}});
 if(error||!data?.published){
   box(style+'<section class="panel" style="text-align:center"><span class="eyebrow">INTERVALO · CARDÁPIO</span><h1>Cardápio indisponível</h1><p class="muted">Este restaurante ainda não publicou seu cardápio digital.</p><a class="btn alt" href="'+link('/')+'">Voltar ao Intervalo</a></section>');
   return;
 }
 const price=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n??0)/100);
 let out=style+'<div class="public-head"><span class="eyebrow">CARDÁPIO DIGITAL · INTERVALO</span><h1>'+esc(data.restaurant.name)+'</h1><p class="public-note">Confira as opções do estabelecimento. Os pedidos online ainda não estão habilitados nesta prévia.</p></div>';
 for(const category of data.categories??[]){
   const products=(data.products??[]).filter(p=>p.category_id===category.id);
   if(!products.length)continue;
   out+='<h2 class="public-cat">'+esc(category.name)+'</h2><div class="public-items">';
   for(const product of products){
     const options=(data.options??[]).filter(o=>o.product_id===product.id);
     out+='<article class="public-product"><h3>'+esc(product.name)+'</h3><p>'+esc(product.description??'')+'</p><strong>'+price(product.price_cents)+'</strong>';
     if(options.length)out+='<p class="public-option">Opcionais: '+options.map(o=>esc(o.name)+' (+'+price(o.price_delta_cents)+')').join(' · ')+'</p>';
     out+='</article>';
   }
   out+='</div>';
 }
 out+='<p class="public-note" style="text-align:center;margin:35px 0">Intervalo · Tecnologia Gaveblue. Valores e disponibilidade sujeitos a atualização pelo restaurante.</p>';
 box(out);
}
