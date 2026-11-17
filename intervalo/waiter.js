import {groupProducts,chooseVariant} from './product-variants-rc28.js?v=1.1.0-rc.28';
import {icon} from './ui-icons.js?v=1.0.0-rc.1';
import {menuButtonMarkup} from './global-navigation-rc7.js?v=1.2.0-rc.7';
import {openWaiterDelivery} from './waiter-delivery-rc17.js?v=1.1.0-rc.29';
// Intervalo 0.9.7 — painel responsivo do garçom; operações reais via restaurant-core.
// A mesa pode ter várias rodadas em estágios diferentes. Uma pronta para servir tem prioridade.
export function preparationMinutes(start,now=Date.now()){
 if(!start)return null;
 const time=Date.parse(start);return Number.isFinite(time)?Math.max(0,Math.floor((now-time)/60000)):null;
}
export function oldestReadyAt(rounds){
 return rounds.filter(r=>r.status==='ready').map(r=>r.ready_at).filter(t=>t&&Number.isFinite(Date.parse(t))).sort((a,b)=>Date.parse(a)-Date.parse(b))[0]??null;
}
export function overdueReady(start,now=Date.now()){
 return !!start&&Number.isFinite(Date.parse(start))&&now-Date.parse(start)>300000;
}
export function nextTableSelection(current,tapped){return current===tapped?null:tapped}
export function readyTableAlerts(tables,orders,rounds){
 const byTable=new Map();
 for(const o of orders)if(o.table_id&&!['closed','cancelled'].includes(o.status)&&!byTable.has(o.table_id))byTable.set(o.table_id,o);
 const byOrder=new Map();
 for(const round of rounds)if(round.status==='ready'){
  if(!byOrder.has(round.order_id))byOrder.set(round.order_id,[]);
  byOrder.get(round.order_id).push(round);
 }
 return tables.filter(t=>t.active!==false).flatMap(t=>{
  const o=byTable.get(t.id);if(!o)return [];
  const ready=byOrder.get(o.id)??[];
  if(!ready.length&&!(o.status==='ready'&&!rounds.some(r=>r.order_id===o.id)))return [];
  return [{tableId:t.id,label:t.label,count:ready.length||1,readyAt:oldestReadyAt(ready),keys:ready.length?ready.map(r=>o.id+':'+r.round_no+':'+(r.ready_at??'')):[o.id+':ready']}];
 });
}
export function tableOrderProgress(order,rounds=[]){
 if(!order||['closed','cancelled'].includes(order.status))return {key:'free',label:'Livre'};
 const active=rounds.filter(r=>r.order_id===order.id&&r.status!=='cancelled');
 const ready=active.filter(r=>r.status==='ready').length;
 if(ready)return {key:'ready',label:'Pronto',readyAt:oldestReadyAt(active),detail:ready+' rodada(s) pronta(s) para servir'};
 const preparing=active.filter(r=>r.status==='preparing');
 if(preparing.length){
  const starts=preparing.map(r=>r.started_at).filter(t=>t&&Number.isFinite(Date.parse(t))).sort((a,b)=>Date.parse(a)-Date.parse(b));
  return {key:'preparing',label:'Em preparo',startedAt:starts[0]??null};
 }
 if(active.some(r=>r.status==='submitted'))return {key:'submitted',label:'Enviado'};
 if(active.some(r=>r.status==='draft'))return {key:'draft',label:'Lançando'};
 if(active.length&&active.every(r=>r.status==='served'))return {key:'served',label:'Servido'};
 const fallback={ready:{key:'ready',label:'Pronto'},preparing:{key:'preparing',label:'Em preparo'},submitted:{key:'submitted',label:'Enviado'},served:{key:'served',label:'Servido'}};
 return fallback[order.status]??{key:'busy',label:'Ocupada'};
}

export async function renderPage({supabase,restaurant,box,esc,link}){
 document.body.classList.add('intervalo-garcom');
 const css='<style>body.intervalo-garcom{background:#f8f9fb;color:#182033}body.intervalo-garcom>header,body.intervalo-garcom>.foot{display:none}body.intervalo-garcom #app .wrap{max-width:1600px;padding:18px clamp(12px,2.1vw,30px) 90px}.wg-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}.wg-logo{font-size:27px;font-weight:950;font-style:italic;letter-spacing:-1.6px;line-height:1}.wg-logo span{color:#ff7000}.wg-brand{display:flex;align-items:center;gap:14px}.wg-role{background:linear-gradient(120deg,#ff8200,#ff5700);padding:9px 15px;border-radius:30px;color:#fff;font-size:12px;font-weight:850}.wg-sub{font-size:11px;color:#82909e;margin-top:5px}.wg-top-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.wg-action{background:#fff;border:1px solid #e5e7eb;color:#263245;padding:9px 12px;border-radius:11px;font-size:12px;font-weight:750;cursor:pointer;text-decoration:none}.wg-action.orange{border-color:#ffbd85;background:#fff3e8;color:#e86400}.wg-app{display:grid;grid-template-columns:245px minmax(300px,1fr) minmax(270px,330px);gap:14px;align-items:start}.wg-panel{background:#fff;border:1px solid #e7e8ed;border-radius:19px;min-width:0;box-shadow:0 3px 12px #24304908}.wg-panel-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:18px 17px 10px}.wg-panel h2{font-size:17px;line-height:1.2;margin:0;letter-spacing:-.35px}.wg-hint{font-size:12px;color:#81909e;margin:5px 0 0}.wg-counter{font-size:11px;background:#fff1e6;border-radius:50px;padding:6px 9px;color:#de6600;font-weight:900}.wg-table-filters,.wg-cats{display:flex;overflow:auto;gap:6px;padding:9px 13px;scrollbar-width:none}.wg-table-filters::-webkit-scrollbar,.wg-cats::-webkit-scrollbar{display:none}.wg-table-filters button,.wg-cats button{border:1px solid #e6e8ed;background:#fff;padding:8px 11px;border-radius:50px;white-space:nowrap;cursor:pointer;color:#566577;font-size:11px;font-weight:800}.wg-table-filters button[aria-pressed=true],.wg-cats button[aria-pressed=true]{background:#ff7800;border-color:#ff7800;color:#fff}.wg-tables{padding:3px 11px 13px;display:grid;gap:9px;max-height:calc(100vh - 260px);overflow:auto}.wg-table{display:block;width:100%;text-align:left;background:#fff;border:1px solid #e7eaf0;border-radius:13px;padding:13px;cursor:pointer}.wg-table.selected{background:#fff3e7;border-color:#ff9200;box-shadow:0 0 0 1px #ff9200}.wg-table-name{font-size:14px;font-weight:850;display:flex;align-items:center;gap:8px}.wg-table-icon{font-size:20px}.wg-table-meta{font-size:11px;color:#788698;margin-top:5px;display:flex;justify-content:space-between;gap:6px}.wg-dot{display:inline-block;width:8px;height:8px;border-radius:100%;background:#15b652;margin-right:4px}.wg-dot.busy{background:#ff7900}.wg-catalogue{padding:14px}.wg-catalogue-heading{display:flex;align-items:center;justify-content:space-between;gap:10px}.wg-catalogue-heading h2{margin:0 0 5px;font-size:20px}.wg-search{width:100%;background:#fafbfc;border:1px solid #e6e9ed;border-radius:12px;padding:12px 13px;box-shadow:none;margin:14px 0 6px;font-size:13px}.wg-cats{padding:10px 0 13px}.wg-products{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.wg-product[hidden]{display:none!important}.wg-product{border:1px solid #eceef1;border-radius:15px;overflow:hidden;background:#fff;min-width:0}.wg-product-photo{height:145px;background:linear-gradient(120deg,#fff5ea,#ffe5c9);position:relative;display:grid;place-items:center;overflow:hidden}.wg-product-photo img{width:100%;height:100%;object-fit:cover;display:block}.wg-product-photo span{font-size:57px}.wg-product-text{padding:11px}.wg-product-text b{display:block;font-size:13px;line-height:1.35;min-height:33px}.wg-product-text p{color:#8b97a5;font-size:11px;line-height:1.35;min-height:28px;margin:4px 0 8px}.wg-product-foot{display:flex;align-items:center;justify-content:space-between;gap:5px}.wg-price{color:#ea6600;font-size:15px;font-weight:900}.wg-plus{border:0;background:#ff7400;color:white;font-size:22px;width:35px;height:35px;border-radius:12px;cursor:pointer}.wg-plus:disabled{background:#e2e8f0;color:#94a3b8}.wg-order{position:sticky;top:14px;padding:17px;max-height:calc(100vh - 30px);overflow:auto}.wg-order h2{margin:3px 0 7px;font-size:22px}.wg-selected{color:#e86a00;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.wg-state{background:#ecfdf3;border-radius:40px;color:#078943;padding:6px 9px;font-size:11px;font-weight:800}.wg-state.busy{background:#fff0e2;color:#d56800}.wg-order-label{font-size:11px;color:#7c899b;margin:11px 0}.wg-line{display:flex;align-items:flex-start;justify-content:space-between;padding:12px 0;border-top:1px solid #f0f1f4;gap:12px;font-size:12px}.wg-line b{font-size:12px}.wg-line small{display:block;color:#8995a3;margin-top:4px}.wg-line strong{white-space:nowrap;font-size:12px}.wg-total{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px dashed #cbd5e1;padding:17px 0 12px;font-size:14px;font-weight:900}.wg-total span:last-child{font-size:21px;color:#ed6b00}.wg-primary,.wg-outline,.wg-danger{display:block;width:100%;border-radius:12px;padding:13px;cursor:pointer;font-size:13px;font-weight:850;margin:8px 0;border:0}.wg-primary{background:linear-gradient(110deg,#ff8200,#ff5c00);color:#fff}.wg-outline{color:#11713b;border:1px solid #8fd1a4;background:#fff}.wg-danger{color:#b42318;border:1px solid #f5a4a4;background:#fff}.wg-primary:disabled,.wg-outline:disabled,.wg-danger:disabled{opacity:.45;cursor:not-allowed}.wg-empty{padding:20px;text-align:center;color:#9aa2af;font-size:12px}.wg-mobile-tabs{display:none}.wg-offline{background:#fef2f2;color:#b42318;padding:10px 13px;border-radius:11px;margin:9px 0;font-size:12px}.wg-note{background:#fff6e9;border:1px solid #ffdfbc;border-radius:10px;padding:10px;font-size:11px;color:#945323;line-height:1.5}.wg-modal{border:0;border-radius:19px;padding:22px;max-width:460px;width:calc(100% - 28px);box-shadow:0 20px 80px #0005}.wg-modal::backdrop{background:#172033a0}.wg-modal h3{margin:0 0 8px}.wg-modal label{display:block;margin:10px 0;font-size:12px;font-weight:750}.wg-modal input,.wg-modal textarea{display:block;margin-top:6px;padding:11px;width:100%;border-radius:10px;border:1px solid #d6dce3}.wg-modal textarea{min-height:82px;resize:vertical}.wg-modal .wg-options{font-size:12px;color:#8b562c;line-height:1.5}.wg-modal-btns{display:flex;gap:9px;margin-top:15px}.wg-modal-btns button{flex:1;padding:12px;border-radius:10px;border:0;cursor:pointer;font-weight:800}.wg-modal-btns button:first-child{background:#e8edf2;color:#344154}.wg-modal-btns button:last-child{background:#ff7000;color:#fff}.wg-mobile-tabs button[aria-pressed=true]{color:#ff6e00}@media(max-width:1090px){.wg-app{grid-template-columns:210px minmax(270px,1fr)}.wg-order{grid-column:1/-1;position:static;max-height:none}.wg-products{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:690px){body.intervalo-garcom #app .wrap{padding:13px 11px 95px}.wg-top{margin-bottom:11px}.wg-logo{font-size:23px}.wg-role{font-size:11px;padding:8px 11px}.wg-top-actions{width:100%;justify-content:flex-end}.wg-app{display:block}.wg-panel{border-radius:17px;margin-bottom:10px}.wg-panel[data-section]{display:none}.wg-app[data-view=mesas] [data-section=mesas],.wg-app[data-view=cardapio] [data-section=cardapio],.wg-app[data-view=comanda] [data-section=comanda]{display:block}.wg-tables{max-height:none}.wg-order{max-height:none}.wg-products{grid-template-columns:repeat(2,minmax(0,1fr))}.wg-product-photo{height:140px}.wg-mobile-tabs{position:fixed;left:0;right:0;bottom:0;z-index:15;display:flex;justify-content:space-around;gap:8px;background:#fff;border-top:1px solid #e6e9ef;padding:8px max(12px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom));box-shadow:0 -5px 20px #1220330b}.wg-mobile-tabs button{border:0;background:transparent;cursor:pointer;display:flex;flex-direction:column;gap:3px;align-items:center;font-size:11px;color:#8692a0;font-weight:800;padding:8px 16px}.wg-mobile-tabs button span{font-size:19px}}@media(max-width:370px){.wg-product-photo{height:112px}.wg-products{gap:8px}.wg-product-text{padding:9px}.wg-product-text b{font-size:12px}.wg-price{font-size:14px}}/* Garçom: grade de mesas e navegação 1.0.0-rc.4 */body.intervalo-garcom .wg-logo::after{display:none!important;content:none!important}body.intervalo-garcom .wg-logo{display:inline-block;padding-bottom:8px;background:linear-gradient(90deg,#ff9000,#ff7000) right bottom/74% 3px no-repeat}body.intervalo-garcom .wg-sub{margin-top:4px;line-height:1.25;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}body.intervalo-garcom .wg-top{flex-wrap:nowrap}body.intervalo-garcom .wg-desktop-more{width:40px;height:40px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;display:grid;place-items:center;cursor:pointer}body.intervalo-garcom .wg-tables{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:5px 12px 15px;max-height:none;overflow:visible}body.intervalo-garcom .wg-table{display:flex;flex-direction:column;justify-content:center;align-items:center;width:100%;min-width:0;min-height:94px;aspect-ratio:1/1;gap:6px;text-align:center;padding:9px 5px;border-radius:16px}body.intervalo-garcom .wg-table:focus-visible{outline:3px solid #ff8200;outline-offset:2px}body.intervalo-garcom .wg-table-name{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;min-width:0}body.intervalo-garcom .wg-table-label{display:block;max-width:100%;font-size:clamp(12px,1.5vw,15px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.intervalo-garcom .wg-table-meta{display:flex;flex-direction:column;gap:5px;align-items:center;width:100%;min-width:0;margin:0;font-size:11px}body.intervalo-garcom .wg-table-meta>span{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.intervalo-garcom .wg-table-meta>span:last-child{width:90%;border-top:1px solid #e9edf2;padding-top:5px}body.intervalo-garcom .wg-mobile-tabs button.wg-tab-add{width:62px;height:62px;min-width:62px;border:0;border-radius:50%;padding:0;display:grid;place-items:center;color:#fff;background:linear-gradient(140deg,#ff9300,#ff6600);box-shadow:0 7px 19px #c55b004a;transform:translateY(-8px)}body.intervalo-garcom .wg-tab-add .iv-icon{width:34px;height:34px}body.intervalo-garcom .wg-mobile-tabs button:focus-visible{outline:3px solid #ff8200;outline-offset:2px}dialog.wg-action-sheet{position:fixed;inset:auto 0 0;width:min(100%,520px);max-width:520px;max-height:80vh;overflow:auto;margin:0 auto;padding:0;border:0;border-radius:23px 23px 0 0;background:#fff;color:#182033;box-shadow:0 -15px 44px #1321394c}dialog.wg-action-sheet::backdrop{background:#15213688}.wg-sheet-content{padding:20px 18px max(24px,env(safe-area-inset-bottom))}.wg-sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}.wg-sheet-head h2{font-size:19px;margin:0}.wg-sheet-close{background:#eef0f4;border:0;width:35px;height:35px;border-radius:50%;display:grid;place-items:center}.wg-sheet-item{display:flex;align-items:center;gap:12px;width:100%;margin-top:9px;padding:12px;border:1px solid #e9ecf0;border-radius:14px;background:white;text-align:left;cursor:pointer}.wg-sheet-item:focus-visible{outline:3px solid #ff8200}.wg-sheet-icon{width:38px;height:38px;flex:none;display:grid;place-items:center;background:#fff1e3;color:#e86c00;border-radius:12px}.wg-sheet-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.wg-sheet-copy strong{font-size:13px;color:#162437}.wg-sheet-copy small{font-size:11px;color:#7a8696}@media(min-width:1091px){body.intervalo-garcom .wg-app{grid-template-columns:minmax(320px,340px) minmax(300px,1fr) minmax(270px,330px)}}@media(min-width:691px) and (max-width:1090px){body.intervalo-garcom .wg-app{grid-template-columns:minmax(320px,340px) minmax(0,1fr)}}@media(min-width:691px){dialog.wg-action-sheet{bottom:20px;border-radius:22px}}@media(max-width:690px){body.intervalo-garcom #app .wrap{padding:14px 11px calc(164px + env(safe-area-inset-bottom))}body.intervalo-garcom .wg-top{margin-bottom:13px}body.intervalo-garcom .wg-logo{font-size:25px}body.intervalo-garcom .wg-brand{gap:10px;min-width:0}body.intervalo-garcom .wg-desktop-more{display:none}body.intervalo-garcom .wg-mobile-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:center;justify-items:center;gap:0;min-height:78px;padding:8px 5px max(10px,env(safe-area-inset-bottom))}body.intervalo-garcom .wg-mobile-tabs button:not(.wg-tab-add){width:100%;min-width:0;padding:5px 1px;font-size:10px}body.intervalo-garcom .wg-cart-shortcut{bottom:calc(86px + env(safe-area-inset-bottom))}}@media(max-width:370px){body.intervalo-garcom .wg-tables{gap:6px;padding:5px 9px 14px}body.intervalo-garcom .wg-table{padding:7px 2px;min-height:88px}body.intervalo-garcom .wg-table-meta{font-size:10px}body.intervalo-garcom .wg-logo{font-size:22px}body.intervalo-garcom .wg-brand{gap:7px}} /* Bottom Sheet Garçom 1.0.0-rc.7 */ body.intervalo-garcom dialog.wg-product-sheet{position:fixed;inset:auto 0 0;box-sizing:border-box;margin:0 auto;padding:0;width:min(100%,540px);max-width:540px;max-height:min(90dvh,var(--wg-sheet-vh,90dvh));overflow:hidden;border:0;border-radius:26px 26px 0 0;background:#fff;color:#182033;box-shadow:0 -18px 65px #14203335;overscroll-behavior:contain;animation:wg-product-enter .22s ease-out} body.intervalo-garcom dialog.wg-product-sheet::backdrop{background:#1623358a} body.intervalo-garcom dialog.wg-product-sheet.is-expanded{max-height:min(96dvh,var(--wg-sheet-vh,96dvh))} body.intervalo-garcom .wg-product-sheet form{display:flex;flex-direction:column;max-height:inherit;min-height:0;margin:0;padding:0;overflow:hidden} body.intervalo-garcom .wg-product-top{flex:none;padding:8px 19px 12px;border-bottom:1px solid #edf0f3} body.intervalo-garcom .wg-product-grip{display:block;touch-action:none;border:0;background:transparent;width:100%;height:28px;padding:7px 0 10px;cursor:grab} body.intervalo-garcom .wg-product-grip:before{content:"";display:block;width:43px;height:5px;margin:0 auto;border-radius:100px;background:#d2d8e0} body.intervalo-garcom .wg-product-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px} body.intervalo-garcom .wg-product-heading h3{margin:4px 0;font-size:21px;line-height:1.25;letter-spacing:-.55px;color:#172033;overflow-wrap:anywhere} body.intervalo-garcom .wg-product-unit{font-size:12px;font-weight:750;color:#eb6b00} body.intervalo-garcom .wg-product-close{width:38px;height:38px;flex:none;border:0;border-radius:50%;background:#f2f4f7;color:#445368;display:grid;place-items:center;cursor:pointer} body.intervalo-garcom .wg-product-content{padding:16px 19px 13px;overflow-y:auto;overscroll-behavior:contain;min-height:0;flex:1} body.intervalo-garcom .wg-product-help{margin:0 0 14px;color:#8090a0;font-size:12px;line-height:1.5} body.intervalo-garcom .wg-product-label{display:block;margin:0 0 9px;font-size:13px;font-weight:800;color:#303d50} body.intervalo-garcom .wg-qty-row{display:flex;align-items:center;justify-content:center;gap:15px;padding:8px 10px;margin-bottom:17px;border:1px solid #e7eaf0;border-radius:16px;background:#fafbfc} body.intervalo-garcom .wg-qty-step{height:45px;width:45px;min-width:45px;border-radius:12px;border:1px solid #ffd3aa;background:#fff4e7;color:#eb6e00;display:grid;place-items:center;cursor:pointer} body.intervalo-garcom .wg-qty-step:disabled{opacity:.38;cursor:not-allowed} body.intervalo-garcom .wg-qty-input{width:78px;max-width:78px;min-width:0;height:45px;margin:0;padding:0 4px;background:#fff;border:1px solid transparent;text-align:center;border-radius:10px;font-size:24px;font-weight:850;color:#172033;font-variant-numeric:tabular-nums} body.intervalo-garcom .wg-qty-input:focus{outline:0;border-color:#ff9c43;box-shadow:0 0 0 3px #ff85001d} body.intervalo-garcom .wg-product-note{display:block;resize:vertical;width:100%;min-height:94px;margin:0;padding:13px;border:1px solid #dbe1e9;border-radius:14px;background:#fff;font-size:14px;line-height:1.5;color:#172033} body.intervalo-garcom .wg-product-note:focus{outline:0;border-color:#ff8900;box-shadow:0 0 0 3px #ff82001f} body.intervalo-garcom .wg-product-warning{margin-top:10px} body.intervalo-garcom .wg-product-feedback{margin:8px 0 0;font-size:12px} body.intervalo-garcom .wg-product-feedback:empty{display:none} body.intervalo-garcom .wg-product-footer{flex:none;border-top:1px solid #edf0f3;background:#fff;padding:14px 19px max(18px,env(safe-area-inset-bottom))} body.intervalo-garcom .wg-product-total{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;color:#637185;font-size:13px;font-weight:750} body.intervalo-garcom .wg-product-total strong{font-size:20px;color:#e86a00} body.intervalo-garcom .wg-product-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:10px} body.intervalo-garcom .wg-product-actions button{margin:0;min-width:0;min-height:49px;padding:12px 10px;border:0;border-radius:13px;font-size:13px;font-weight:850;cursor:pointer} body.intervalo-garcom .wg-product-cancel{background:#edf1f5;color:#35465a} body.intervalo-garcom .wg-product-confirm{background:linear-gradient(110deg,#ff8700,#ff6900);color:#fff} body.intervalo-garcom .wg-product-sheet button:disabled{cursor:not-allowed;opacity:.6} @keyframes wg-product-enter{from{transform:translateY(22px);opacity:.75}to{transform:translateY(0);opacity:1}} @media(min-width:691px){body.intervalo-garcom dialog.wg-product-sheet{bottom:16px;border-radius:24px}} @media(max-width:370px){body.intervalo-garcom .wg-qty-row{gap:10px}body.intervalo-garcom .wg-product-actions{grid-template-columns:minmax(0,1fr) minmax(0,1.25fr)}} @media(prefers-reduced-motion:reduce){body.intervalo-garcom dialog.wg-product-sheet{animation:none}} body.intervalo-garcom .wg-inline-keypad{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:-7px 0 17px}body.intervalo-garcom .wg-inline-keypad[hidden]{display:none}body.intervalo-garcom .wg-inline-keypad button{min-height:41px;border:1px solid #e4e8ee;border-radius:11px;background:#f8fafc;color:#29384e;font-weight:800;font-size:16px;cursor:pointer}body.intervalo-garcom .wg-inline-keypad button.wg-key-done{grid-column:1/-1;background:#fff2e6;color:#de6500;border-color:#ffd8b3;font-size:13px}body.intervalo-garcom .wg-qty-input{cursor:pointer}body.intervalo-garcom .wg-qty-input:focus-visible{outline:2px solid #ff8c00;outline-offset:2px}body.intervalo-garcom .wg-round{padding:11px;margin:12px 0;border:1px solid #e7ebf0;border-radius:14px;background:#fcfdff}body.intervalo-garcom .wg-round-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px;font-size:12px}body.intervalo-garcom .wg-round-status{padding:5px 8px;border-radius:30px;background:#eef1f5;color:#596779;font-weight:800;font-size:10px}body.intervalo-garcom .wg-round-status.draft{background:#fff1e2;color:#cb6200}body.intervalo-garcom .wg-round-status.submitted,body.intervalo-garcom .wg-round-status.preparing{background:#edf3ff;color:#225fb2}body.intervalo-garcom .wg-round-status.ready,body.intervalo-garcom .wg-round-status.served{background:#ecfdf3;color:#0c8a4d}body.intervalo-garcom .wg-round .wg-line{padding:9px 0}body.intervalo-garcom .wg-round-subtotal{display:flex;justify-content:space-between;border-top:1px solid #e9edf1;padding-top:9px;font-size:11px;color:#657387}</style>';
 const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)/100);
 const call=async(action,extra={})=>{
  const r=await supabase.functions.invoke('restaurant-core',{body:{restaurant_id:restaurant.id,action,...extra}});
  if(r.error||r.data?.error){
    let msg=r.data?.error??r.error?.message??'Falha ao comunicar com o restaurante';
    try{const d=await r.error?.context?.json?.();msg=d?.error??msg}catch{}
    throw Error(msg);
  }
  return r.data;
 };
 const categoryIcon=name=>icon(/bebid|refriger|suco/i.test(name)?'cup':/pizza/i.test(name)?'pizza':/doce|sobremesa/i.test(name)?'cake':/batata|porç|acomp/i.test(name)?'package':'burger',52);
 const photo=p=>typeof p.image_url==='string'&&/^https:\/\/[^\s<>"']+$/.test(p.image_url)?p.image_url:null;
 const statuses={open:'Aberta',submitted:'Enviada à cozinha',preparing:'Em preparo',ready:'Pronta',served:'Servida'};
 let selectedId=null,tableFilter='all',categoryFilter='all',search='',view='mesas';
 let catalogLayout=(()=>{try{return localStorage.getItem('intervalo.waiter.catalog.layout.v1')==='grid'?'grid':'list'}catch{return 'list'}})();
 let fetching=false,lastSignature='',snapshot=null,alive=true;
 let knownReady=new Set();
 const viewCss="<style>\n.wg-catalogue-heading{gap:8px}.wg-catalogue-heading>div{min-width:0}\n.wg-catalogue-tools{display:flex;align-items:center;gap:8px;flex:none}\n.wg-catalogue-layout{display:flex;align-items:center;gap:2px;padding:3px;border:1px solid #e7eaf0;border-radius:12px;background:#f5f7fa}\n.wg-catalogue-layout button{width:34px;height:33px;border:0;border-radius:9px;background:transparent;color:#7f8a9c;cursor:pointer;display:grid;place-items:center}\n.wg-catalogue-layout button[aria-pressed=true]{background:#fff;color:#ef7000;box-shadow:0 1px 5px #0b253016}\n.wg-catalogue-layout button:focus-visible{outline:2px solid #fb923c;outline-offset:1px}\n.wg-products.wg-products--list{display:flex!important;flex-direction:column;gap:9px}\n.wg-products.wg-products--list .wg-product{display:flex;align-items:center;min-height:84px;padding:10px;gap:12px;box-sizing:border-box;border-radius:13px}\n.wg-products.wg-products--list .wg-product-photo{flex:0 0 64px;width:64px;height:64px!important;min-height:0;max-height:64px;aspect-ratio:1/1;border-radius:9px;align-self:center}\n.wg-products.wg-products--list .wg-product-photo img{position:absolute;inset:0;height:100%;width:100%;object-fit:cover;object-position:center}\n.wg-products.wg-products--list .wg-product-photo span{display:grid;place-items:center;height:100%}\n.wg-products.wg-products--list .wg-product-photo .iv-icon{width:31px;height:31px}\n.wg-products.wg-products--list .wg-product-text{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;padding:0}\n.wg-products.wg-products--list .wg-product-text>b{min-height:0!important;margin:0;font-size:13px;line-height:1.25}\n.wg-products.wg-products--list .wg-product-text>p{min-height:0!important;margin:4px 0 6px;font-size:11px;line-height:1.3;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}\n.wg-products.wg-products--list .wg-product-foot{margin-top:0;gap:8px;justify-content:flex-end}.wg-products.wg-products--list .wg-price{font-size:13px}\n.wg-products.wg-products--list .wg-plus{flex:0 0 37px;width:37px;height:37px}\n.wg-sheet-preview{margin:0 auto 12px;text-align:center}.wg-sheet-preview>div{width:min(100%,150px);aspect-ratio:1/1;background:#f6f7f9;border-radius:12px;overflow:hidden;margin:auto}.wg-sheet-preview img{width:100%;height:100%;object-fit:contain;display:block}.wg-sheet-preview figcaption{font-size:10px;color:#8190a4;margin-top:5px}.wg-sheet-description{font-size:12px;color:#738196;margin:0 0 10px;overflow-wrap:anywhere}\n@media(max-width:640px){.wg-products.wg-products--list .wg-product{min-height:76px;padding:9px;gap:10px}.wg-products.wg-products--list .wg-product-photo{width:56px;height:56px!important;flex-basis:56px;max-height:56px}}\n@media(max-width:390px){.wg-catalogue-tools .wg-counter{display:none}.wg-products.wg-products--list .wg-product{min-height:76px;padding:9px;gap:10px}.wg-products.wg-products--list .wg-product-photo{width:56px;height:56px!important;flex-basis:56px;min-height:0;max-height:56px}.wg-products.wg-products--list .wg-product-text{padding:0}.wg-products.wg-products--list .wg-product-text>b{font-size:12px}}\n</style>";
 const deliveryCss='<style>.wg-delivery-shortcut{display:flex;align-items:center;justify-content:space-between;gap:10px;width:calc(100% - 24px);margin:7px 12px 13px;border:1px solid #ffcf9f;background:#fff2e7;border-radius:12px;min-height:46px;padding:10px 12px;font-size:12px;font-weight:850;color:#c65b00;cursor:pointer}.wg-delivery-shortcut .iv-icon:first-child{flex:none}.wg-delivery-shortcut span{flex:1;text-align:left}@media(max-width:700px){.wg-delivery-shortcut{margin-top:10px}}</style>';
 const progressCss="<style>\nbody.intervalo-garcom .wg-table{position:relative;gap:4px;padding:6px 4px;justify-content:center}\nbody.intervalo-garcom .wg-table .wg-table-progress{display:inline-flex;align-items:center;justify-content:center;gap:4px;max-width:100%;box-sizing:border-box;border-radius:7px;padding:3px 6px;font-size:10px;font-weight:750;line-height:1.15;white-space:nowrap;background:#f1f4f7;color:#768597}\n.wg-table-progress:before{content:\"\";width:5px;height:5px;flex:none;border-radius:50%;background:currentColor}\nbody.intervalo-garcom .wg-table .wg-table-progress[data-stage=\"ready\"]{background:#dcfce7;color:#166534}\nbody.intervalo-garcom .wg-table[data-stage=\"ready\"]:not(.selected){border-color:#86cfa1;background:#f5fdf7}\nbody.intervalo-garcom .wg-table .wg-table-progress[data-stage=\"preparing\"]{background:#fff0d9;color:#a65300}\nbody.intervalo-garcom .wg-table .wg-table-progress[data-stage=\"submitted\"]{background:#e5efff;color:#245aa7}\nbody.intervalo-garcom .wg-table .wg-table-progress[data-stage=\"draft\"],body.intervalo-garcom .wg-table .wg-table-progress[data-stage=\"busy\"]{background:#f1eefb;color:#66549a}\nbody.intervalo-garcom .wg-table .wg-table-progress[data-stage=\"served\"]{background:#e9edf2;color:#556478}\nbody.intervalo-garcom .wg-table .wg-table-name{gap:2px}\nbody.intervalo-garcom .wg-table .wg-table-meta{gap:0;font-size:10px;margin:0}\nbody.intervalo-garcom .wg-table .wg-table-meta>span:last-child{width:100%;border:0;padding:0}\n@media(max-width:350px){body.intervalo-garcom .wg-table .wg-table-progress{font-size:9px;padding:3px 4px;gap:3px}body.intervalo-garcom .wg-table .wg-table-icon svg{width:21px;height:21px}}\nbody.intervalo-garcom .wg-table .wg-table-progress[data-stage=\"preparing\"]:before,body.intervalo-garcom .wg-table .wg-table-progress[data-stage=\"ready\"]:before{display:none}\nbody.intervalo-garcom .wg-table-progress svg{width:12px;height:12px;flex:none}\nbody.intervalo-garcom .wg-table .wg-prep-time{font-size:10px;color:#a65300;font-weight:650;line-height:1.15;font-variant-numeric:tabular-nums}\nbody.intervalo-garcom .wg-table.selected .wg-prep-time{color:inherit}\n.wg-ready-alert{display:flex;align-items:center;gap:10px;border:1px solid #a7dec0;border-radius:13px;background:#effbf3;color:#17623b;padding:9px 11px;margin:0 0 12px;min-width:0}\n.wg-ready-alert>.wg-ready-bell{display:grid;place-items:center;flex:0 0 32px;width:32px;height:32px;border-radius:10px;background:#d8f4e3;color:#16834a}\n.wg-ready-content{min-width:0;flex:1;display:grid;gap:5px}\n.wg-ready-content strong{font-size:13px;line-height:1.25;font-weight:750}\n.wg-ready-tables{display:flex;align-items:center;gap:5px;overflow-x:auto;scrollbar-width:thin}\n.wg-ready-tables button{display:inline-flex;align-items:center;gap:4px;flex:none;border:1px solid #a7dec0;background:#fff;color:#17623b;border-radius:8px;font-size:11px;font-weight:650;padding:6px 8px;min-height:32px;cursor:pointer;white-space:nowrap}\n.wg-ready-tables button:focus-visible{outline:2px solid #16834a}\n.wg-ready-live{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}\n@media(max-width:350px){.wg-ready-alert{gap:7px;padding:8px}.wg-ready-content strong{font-size:12px}}\n\nbody.intervalo-garcom .wg-table[data-overdue=\"true\"]{border-color:#e97b7b!important;background:#fff3f3!important;animation:wg-wait-pulse 2.8s ease-in-out infinite}\nbody.intervalo-garcom .wg-table[data-overdue=\"true\"].selected{outline:2px solid #ff9200;outline-offset:1px}\nbody.intervalo-garcom .wg-table[data-overdue=\"true\"] .wg-table-progress{background:#fee2e2!important;color:#b42323!important}\n@keyframes wg-wait-pulse{0%,100%{box-shadow:0 0 0 0 #dc262610}50%{box-shadow:0 0 0 3px #dc26263b}}\n.wg-ready-red,.wg-ready-elapsed{display:none}\n[data-overdue=\"true\"] .wg-ready-green{display:none}\n[data-overdue=\"true\"] .wg-ready-red,[data-overdue=\"true\"] .wg-ready-elapsed{display:inline-flex}\n.wg-ready-green{display:inline-flex}\n.wg-ready-alert.has-overdue{border-color:#f0a7a7;background:#fff4f4;color:#a52222}\n.wg-ready-alert.has-overdue>.wg-ready-bell{background:#fee2e2;color:#b42323}\n.wg-ready-alert.has-overdue>.wg-ready-bell .wg-ready-green{display:none}\n.wg-ready-alert.has-overdue>.wg-ready-bell .wg-ready-red{display:inline-flex}\n.wg-ready-tables button[data-overdue=\"true\"]{color:#b42323;border-color:#eeb2b2;background:#fff}\n.wg-ready-elapsed{font-variant-numeric:tabular-nums;font-weight:650}\n.wg-selection-line{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:0 0 10px;padding:5px 9px;background:#fff;border:1px solid #e7ebef;border-radius:11px;color:#708196;font-size:11px;min-width:0}\n.wg-selection-line strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#db6800;font-size:12px}\n.wg-clear-table{border:0;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:32px;padding:5px 8px;font-size:11px;font-weight:650;color:#627185;background:#f3f5f7;cursor:pointer;flex:none}\n.wg-clear-table:focus-visible{outline:2px solid #ff9200}\nbody.intervalo-garcom .wg-plus:disabled{opacity:.35;cursor:not-allowed}\n@media(prefers-reduced-motion:reduce){body.intervalo-garcom .wg-table[data-overdue=\"true\"]{animation:none}}\n\n</style>";
 const header=css+viewCss+deliveryCss+progressCss+'<div class="wg-top"><div class="wg-brand">'+menuButtonMarkup()+'<div><div class="wg-logo">Intervalo</div><div class="wg-sub">'+esc(restaurant.name)+'</div></div><span class="wg-role">Garçom</span></div><button type="button" id="wg-desktop-more" class="wg-desktop-more" aria-label="Abrir mais opções">'+icon('more',22)+'</button></div>';
 const selected=()=>snapshot?.tables?.find(t=>t.id===selectedId);
 const order=()=>selectedId?snapshot?.orders?.find(o=>o.table_id===selectedId&&!['closed','cancelled'].includes(o.status)):null;
 const clearSelection=()=>{selectedId=null;categoryFilter='all';search='';view='mesas';render()};
 const listFor=o=>snapshot?.items?.filter(i=>i.order_id===o.id&&i.status!=='cancelled')??[];
 function showView(name){
  view=name;
  const root=document.getElementById('wg-root');if(root)root.dataset.view=name;
  document.querySelectorAll('[data-w-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wView===name)));
 }
 function applyCatalogFilter(){
  const q=search.trim().toLocaleLowerCase('pt-BR');let count=0;
  document.querySelectorAll('[data-w-product]').forEach(el=>{
    const visible=(categoryFilter==='all'||el.dataset.category===categoryFilter)&&(!q||el.dataset.search.includes(q));
    el.hidden=!visible;if(visible)count++;
  });
  const el=document.getElementById('wg-products-count');if(el)el.textContent=count+' produtos';
 }
 function render(){
  if(!snapshot)return;
  const {tables,orders,items,products,categories,rounds=[]}=snapshot;const grouped=groupProducts(products);
  const activeTable=selected(),activeOrder=order(),lines=activeOrder?listFor(activeOrder):[];
  const total=lines.reduce((sum,i)=>sum+Number(i.unit_price_cents)*Number(i.quantity),0);
  const ordersByTable=new Map();
  for(const o of orders)if(o.table_id&&!['closed','cancelled'].includes(o.status)&&!ordersByTable.has(o.table_id))ordersByTable.set(o.table_id,o);
  const roundsByOrder=new Map();
  for(const r of rounds){if(!roundsByOrder.has(r.order_id))roundsByOrder.set(r.order_id,[]);roundsByOrder.get(r.order_id).push(r)}
  const occupied=t=>ordersByTable.has(t.id);
  const visibleTables=tables.filter(t=>tableFilter==='all'||(tableFilter==='busy'?occupied(t):!occupied(t)));
  const filteredCats=categories.filter(c=>c.active&&products.some(p=>p.category_id===c.id));
  const status=activeOrder?.status,canAdd=!!activeTable&&!activeOrder?.payment_started,title='Mesa '+(activeTable?.label??'');
   const activeRounds=activeOrder?rounds.filter(r=>r.order_id===activeOrder.id).sort((a,b)=>a.round_no-b.round_no):[];
   const draftRound=activeRounds.find(r=>r.status==='draft');
   const readyRounds=activeRounds.filter(r=>r.status==='ready');
   const roundNames={draft:'Em lançamento',submitted:'Enviado',preparing:'Em preparo',ready:'Pronto',served:'Servido',cancelled:'Cancelado'};
  const readyAlerts=readyTableAlerts(tables,orders,rounds);
  const readyIcons=size=>'<span class="wg-ready-green">'+icon('bell',size)+'</span><span class="wg-ready-red">'+icon('alert',size)+'</span>';
  const readyAttrs=start=>start?' data-w-ready-since="'+esc(start)+'" data-overdue="'+overdueReady(start)+'"':'';
  const tableName=label=>/^mesa\b/i.test(String(label))?String(label):'Mesa '+label;
  const overdue=readyAlerts.some(a=>overdueReady(a.readyAt));
  const readyMarkup=readyAlerts.length?'<section class="wg-ready-alert'+(overdue?' has-overdue':'')+'" aria-label="Pedidos prontos para servir"><span class="wg-ready-bell" aria-hidden="true">'+readyIcons(18)+'</span><div class="wg-ready-content"><strong id="wg-ready-heading">'+(overdue?'Atenção · sirva os pedidos':'Pronto para servir')+'</strong><div class="wg-ready-tables">'+readyAlerts.map(a=>'<button type="button" data-w-ready-table="'+esc(a.tableId)+'"'+readyAttrs(a.readyAt)+' aria-label="'+esc(tableName(a.label)+', '+a.count+' rodada(s) pronta(s). Abrir pedido')+'">'+esc(tableName(a.label))+(a.count>1?' · '+a.count:'')+(a.readyAt?'<span class="wg-ready-elapsed"> · '+esc(preparationMinutes(a.readyAt))+' min</span>':'')+icon('chevronRight',12)+'</button>').join('')+'</div></div></section>':'';
  const selectionLine=activeTable?'<div class="wg-selection-line"><strong>'+esc(tableName(activeTable.label))+' selecionada</strong><button type="button" class="wg-clear-table" data-w-clear-table aria-label="Desmarcar mesa selecionada">'+icon('x',14)+' Desmarcar</button></div>':'';
  let html=header+(navigator.onLine===false?'<div class="wg-offline">Sem internet. Não é possível enviar comandas até a conexão voltar.</div>':'')+readyMarkup+selectionLine
  +'<div id="wg-root" class="wg-app" data-view="'+esc(view)+'">'
  +'<aside class="wg-panel" data-section="mesas"><div class="wg-panel-head"><div><h2>Mesas</h2><p class="wg-hint">Selecione para atender</p></div><span class="wg-counter">'+tables.filter(occupied).length+' ocupadas</span></div>'
  +'<div class="wg-table-filters" role="group" aria-label="Filtro de mesas">'+[['all','Todas'],['busy','Ocupadas'],['free','Livres']].map(([k,l])=>'<button type="button" data-w-filter="'+k+'" aria-pressed="'+(tableFilter===k)+'">'+l+'</button>').join('')+'</div><button type="button" class="wg-delivery-shortcut" id="wg-delivery-shortcut">'+icon('bike',20)+'<span>Novo delivery ou retirada</span>'+icon('chevronRight',16)+'</button><div class="wg-tables">';
  for(const t of visibleTables){
    const tableOrder=ordersByTable.get(t.id),progress=tableOrderProgress(tableOrder,roundsByOrder.get(tableOrder?.id)??[]);
    const description='Mesa '+t.label+', '+(tableOrder?'ocupada, ':'')+progress.label+(progress.detail?', '+progress.detail:'');
    html+='<button type="button" class="wg-table'+(t.id===selectedId?' selected':'')+'" data-w-table="'+esc(t.id)+'" data-stage="'+esc(progress.key)+'"'+readyAttrs(progress.readyAt)+' aria-pressed="'+(t.id===selectedId)+'" aria-label="'+esc(description)+'"><span class="wg-table-progress" data-stage="'+esc(progress.key)+'"'+(progress.detail?' title="'+esc(progress.detail)+'"':'')+'>'+(progress.key==='preparing'?icon('clock',12):progress.key==='ready'?readyIcons(12):'')+esc(progress.label)+'</span><span class="wg-table-name"><span class="wg-table-icon" aria-hidden="true">'+icon('table',24)+'</span><span class="wg-table-label">'+esc(t.label)+'</span></span>'+(progress.startedAt?'<span class="wg-prep-time" data-w-prep-time="'+esc(progress.startedAt)+'">'+esc(preparationMinutes(progress.startedAt))+' min</span>':'')+'<span class="wg-table-meta"><span>'+esc(t.area??'Salão')+'</span></span></button>';
  }
  html+='</div></aside><section class="wg-panel" data-section="cardapio"><div class="wg-catalogue"><div class="wg-catalogue-heading"><div><h2>Cardápio</h2><p class="wg-hint">'+(activeTable?'Escolha um produto':'Selecione uma mesa antes de lançar')+'</p></div><div class="wg-catalogue-tools"><span class="wg-counter" id="wg-products-count">'+grouped.length+' produtos</span><div class="wg-catalogue-layout" role="group" aria-label="Visualização de produtos"><button type="button" data-w-layout="list" aria-label="Exibir produtos em lista" aria-pressed="'+(catalogLayout==='list')+'">'+icon('bars',19)+'</button><button type="button" data-w-layout="grid" aria-label="Exibir produtos em grade" aria-pressed="'+(catalogLayout==='grid')+'">'+icon('dashboard',19)+'</button></div></div></div>'
   +'<input class="wg-search" id="wg-search" type="search" placeholder="Buscar produtos..." aria-label="Buscar produto" value="'+esc(search)+'" autocomplete="off">'
   +'<div class="wg-cats" role="group" aria-label="Categorias"><button data-w-cat="all" aria-pressed="'+(categoryFilter==='all')+'">Todos</button>'
   +filteredCats.map(c=>'<button type="button" data-w-cat="'+esc(c.id)+'" aria-pressed="'+(categoryFilter===c.id)+'">'+esc(c.name)+'</button>').join('')+'</div><div class="wg-products'+(catalogLayout==='list'?' wg-products--list':'')+'">';
  for(const g of grouped){
    const p=g.product,cat=categories.find(c=>c.id===p.category_id),src=photo(p);
    html+='<article class="wg-product" data-w-product data-category="'+esc(p.category_id)+'" data-search="'+esc((g.name+' '+g.search+' '+(p.description??'')+' '+(cat?.name??'')).toLocaleLowerCase('pt-BR'))+'">'
      +'<div class="wg-product-photo">'+(src?'<img src="'+esc(src)+'" alt="'+esc(p.name)+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">':'<span aria-hidden="true">'+categoryIcon(cat?.name??'')+'</span>')+'</div>'
      +'<div class="wg-product-text"><b>'+esc(g.name)+'</b><p>'+esc(p.description??'')+'</p><div class="wg-product-foot"><span class="wg-price">'+(g.variants.length>1?'A partir de ':'')+money(g.price)+'</span>'
      +'<button type="button" class="wg-plus" data-w-add="'+esc(g.key)+'" aria-label="Adicionar '+esc(p.name)+'" '+(canAdd?'':'disabled title="Esta mesa não aceita novos itens agora"')+'>'+icon("plus",22)+'</button></div></div></article>';
  }
  html+='</div>'+(!products.length?'<p class="wg-empty">O restaurante ainda não tem produtos disponíveis no cardápio.</p>':'')+'</div></section>'
   +'<aside class="wg-panel wg-order" data-section="comanda"><div class="wg-selected">Comanda</div><h2>'+(activeTable?esc(activeTable.label):'Selecione uma mesa')+'</h2>'
   +'<span class="wg-state'+(activeOrder?' busy':'')+'">'+(activeOrder?esc(statuses[status]??status):activeTable?'Livre':'Sem seleção')+'</span>'
   +'<p class="wg-order-label">'+(activeTable?esc(activeTable.area??'Salão')+' · '+(activeOrder?'Pedido em andamento':'Sem comanda aberta'):'Escolha uma mesa no painel de mesas')+'</p>';
  if(activeOrder){
   for(const round of activeRounds){
    const entries=lines.filter(i=>Number(i.round_no||1)===Number(round.round_no));
    const subtotal=entries.reduce((n,i)=>n+Number(i.unit_price_cents)*Number(i.quantity),0);
    html+='<section class="wg-round"><div class="wg-round-head"><b>Rodada '+esc(round.round_no)+'</b><span class="wg-round-status '+esc(round.status)+'">'+esc(roundNames[round.status]??round.status)+'</span></div>';
    for(const item of entries){
     html+='<div class="wg-line"><div><b>'+esc(item.quantity)+' × '+esc(item.product_name)+'</b>'+(item.note?'<small>Obs.: '+esc(item.note)+'</small>':'')+'</div><strong>'+money(Number(item.unit_price_cents)*Number(item.quantity))+'</strong></div>';
    }
    html+='<div class="wg-round-subtotal"><span>Subtotal</span><b>'+money(subtotal)+'</b></div></section>';
   }
   if(!lines.length)html+='<p class="wg-empty">Nenhum produto lançado. Abra o Cardápio para começar.</p>';
   html+='<div class="wg-total"><span>Total da comanda</span><span>'+money(total)+'</span></div>';
   if(!activeOrder.payment_started)html+='<button type="button" class="wg-primary" data-w-view="cardapio">'+icon('plus',16)+' '+(draftRound?'Adicionar à rodada '+draftRound.round_no:'Novo pedido nesta mesa')+'</button>';
   if(draftRound)html+='<button type="button" class="wg-primary" id="wg-submit">Enviar rodada '+esc(draftRound.round_no)+' à cozinha</button>';
   if(status==='open'&&draftRound)html+='<button type="button" class="wg-danger" id="wg-cancel">Cancelar comanda não enviada</button>';
   for(const round of readyRounds)html+='<button type="button" class="wg-outline" data-w-serve-round="'+esc(round.round_no)+'">Marcar rodada '+esc(round.round_no)+' como servida</button>';
   if(activeOrder.payment_started)html+='<p class="wg-note">Pagamento iniciado. Não é possível lançar novas rodadas nesta comanda.</p>';
   else if(status==='served'&&!draftRound)html+='<p class="wg-note">Tudo servido. É possível lançar nova rodada antes de iniciar o pagamento.</p>';
   else if(!draftRound)html+='<p class="wg-note">Novos produtos criam outra rodada, sem alterar pedidos já enviados.</p>';
  }else if(activeTable){
    html+='<p class="wg-empty">Mesa livre. Escolha um produto no cardápio: a comanda será criada automaticamente.</p><button type="button" class="wg-primary" data-w-view="cardapio">Ver cardápio</button>';
  }else html+='<p class="wg-empty">Selecione uma mesa primeiro.</p>';
  html+='</aside></div>'+(activeTable?'<button type="button" class="wg-cart-shortcut" id="wg-cart-shortcut">'+icon('receipt',20)+' <span>Comanda · '+esc(activeTable.label)+'</span><strong>'+money(total)+'</strong>'+icon('chevronRight',18)+'</button>':'')+'<div class="wg-mobile-tabs" role="group" aria-label="Navegação do atendimento">'
    +[['mesas',icon('table',21),'Mesas'],['cardapio',icon('burger',21),'Cardápio']].map(([id,ico,label])=>'<button type="button" data-w-view="'+id+'" aria-pressed="'+(view===id)+'"><span>'+ico+'</span>'+label+'</button>').join('')
    +'<button type="button" id="wg-add-menu" class="wg-tab-add" aria-label="Ações rápidas" aria-haspopup="dialog">'+icon('plus',33)+'</button>'
    +'<button type="button" data-w-view="comanda" aria-pressed="'+(view==='comanda')+'"><span>'+icon('receipt',21)+'</span>Comanda</button>'
    +'<button type="button" id="wg-more-menu" class="wg-tab-more" aria-haspopup="dialog"><span>'+icon('more',22)+'</span>Mais</button></div>';
  box(html);
  const shortcut=document.getElementById('wg-cart-shortcut');if(shortcut)shortcut.onclick=()=>showView('comanda');
  document.getElementById('wg-add-menu')?.addEventListener('click',()=>openMenu('quick'));
  document.getElementById('wg-delivery-shortcut')?.addEventListener('click',startDelivery);
  document.getElementById('wg-more-menu')?.addEventListener('click',()=>openMenu('more'));
  document.getElementById('wg-desktop-more')?.addEventListener('click',()=>openMenu('more'));
  document.querySelectorAll('[data-w-filter]').forEach(b=>b.onclick=()=>{tableFilter=b.dataset.wFilter;render()});
  document.querySelectorAll('[data-w-table]').forEach(b=>b.onclick=()=>{const next=nextTableSelection(selectedId,b.dataset.wTable);if(next===null){clearSelection();return}selectedId=next;categoryFilter='all';search='';view='cardapio';render()});
  document.querySelectorAll('[data-w-clear-table]').forEach(b=>b.onclick=clearSelection);
  document.querySelectorAll('[data-w-ready-table]').forEach(b=>b.onclick=()=>{selectedId=b.dataset.wReadyTable;categoryFilter='all';search='';view='comanda';render()});
  document.querySelectorAll('[data-w-view]').forEach(b=>b.onclick=()=>showView(b.dataset.wView));
  document.querySelectorAll('[data-w-layout]').forEach(b=>b.onclick=()=>{
   catalogLayout=b.dataset.wLayout==='grid'?'grid':'list';
   try{localStorage.setItem('intervalo.waiter.catalog.layout.v1',catalogLayout)}catch{}
   document.querySelector('.wg-products')?.classList.toggle('wg-products--list',catalogLayout==='list');
   document.querySelectorAll('[data-w-layout]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.wLayout===catalogLayout)));
  });
  document.querySelectorAll('[data-w-cat]').forEach(b=>b.onclick=()=>{categoryFilter=b.dataset.wCat;document.querySelectorAll('[data-w-cat]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));applyCatalogFilter()});
  const input=document.getElementById('wg-search');input.oninput=e=>{search=e.target.value;applyCatalogFilter()};
  document.querySelectorAll('.wg-product-photo img').forEach(img=>img.addEventListener('error',()=>{
    const fallback=document.createElement('span');fallback.innerHTML=icon('burger',48);fallback.setAttribute('aria-label','Sem foto disponível');
    img.replaceWith(fallback);
  }));
  applyCatalogFilter();
  async function action(button,cmd,data){
    button.disabled=true;
    try{await call(cmd,data);await reload()}catch(e){alert(e.message);button.disabled=false}
  }


  const submit=document.getElementById('wg-submit');
  if(submit)submit.onclick=()=>{if(confirm('Enviar apenas esta rodada à cozinha? O estoque será descontado somente pelos itens desta rodada.'))action(submit,'order_submit',{order_id:activeOrder.id})};
  const cancel=document.getElementById('wg-cancel');
  if(cancel)cancel.onclick=()=>{
    const reason=prompt('Motivo do cancelamento (mínimo 3 caracteres):','Erro na abertura');
    if(reason===null)return;
    if(reason.trim().length<3||reason.length>180){alert('Informe um motivo válido entre 3 e 180 caracteres.');return}
    if(confirm('Cancelar esta comanda ainda não enviada e liberar a mesa?'))action(cancel,'order_cancel',{order_id:activeOrder.id,reason:reason.trim()});
  };
  document.querySelectorAll('[data-w-serve-round]').forEach(b=>b.onclick=()=>action(b,'round_progress',{order_id:activeOrder.id,round_no:Number(b.dataset.wServeRound),p_next:'served'}));
  document.querySelectorAll('[data-w-add]').forEach(b=>b.onclick=()=>{const tableId=selectedId;if(!tableId||!selected()||b.disabled)return;chooseVariant(grouped.find(g=>g.key===b.dataset.wAdd),money,p=>{if(selectedId===tableId&&selected())openProduct(p,order())})});
 }

 function startDelivery(){
  openWaiterDelivery({supabase,restaurant,products:snapshot?.products??[],categories:snapshot?.categories??[],afterCreated:()=>reload(true)});
 }
 function isInstalled(){return window.matchMedia?.('(display-mode: standalone)')?.matches===true||window.navigator.standalone===true}
 function openMenu(kind){
  document.querySelector('dialog.wg-action-sheet[open]')?.close();
  const dlg=document.createElement('dialog');dlg.className='wg-action-sheet';
  dlg.setAttribute('aria-label',kind==='quick'?'Ações rápidas':'Mais opções');
  const wrap=document.createElement('div');wrap.className='wg-sheet-content';
  const top=document.createElement('div');top.className='wg-sheet-head';
  const h=document.createElement('h2');h.textContent=kind==='quick'?'Ações rápidas':'Mais opções';
  const close=document.createElement('button');close.className='wg-sheet-close';close.type='button';close.setAttribute('aria-label','Fechar');close.innerHTML=icon('x',20);close.onclick=()=>dlg.close();
  top.append(h,close);wrap.append(top);
  const actions=kind==='quick'
   ?[{ico:'table',name:'Selecionar mesa',note:'Ver as mesas do restaurante',run:()=>showView('mesas')},
     {ico:'bike',name:'Novo delivery / retirada',note:'Pedido externo, sem mesa',run:startDelivery},
     {ico:'burger',name:'Abrir cardápio',note:'Consultar e adicionar produtos',run:()=>showView('cardapio')},
     {ico:'receipt',name:'Ver comanda',note:'Acompanhar o pedido selecionado',run:()=>showView('comanda')}]
   :[{ico:'user',name:'Minha conta',note:'Informações e segurança',run:()=>location.assign(link('/minha-conta'))},
     {ico:'store',name:'Trocar restaurante',note:'Voltar aos meus restaurantes',run:()=>location.assign(link('/inicio'))},
     {ico:'refresh',name:'Atualizar informações',note:'Recarregar mesas e comandas',run:()=>reload()}];
  if(kind==='more'&&!isInstalled())actions.push({ico:'download',name:'Instalar aplicativo',note:'Adicionar à tela inicial',run:()=>window.intervaloInstallGarcom?.()});
  for(const a of actions){
   const b=document.createElement('button');b.type='button';b.className='wg-sheet-item';
   b.innerHTML='<span class="wg-sheet-icon">'+icon(a.ico,21)+'</span><span class="wg-sheet-copy"><strong>'+esc(a.name)+'</strong><small>'+esc(a.note)+'</small></span>'+icon('chevronRight',18);
   b.onclick=()=>{dlg.close();a.run()};wrap.append(b);
  }
  dlg.append(wrap);document.body.append(dlg);dlg.addEventListener('close',()=>dlg.remove(),{once:true});
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});dlg.showModal();
 }
 function openProduct(product,activeOrder){
  if(!product||!selectedId||activeOrder?.payment_started)return;
  const tableId=selectedId,previousFocus=document.activeElement;
  // Remove busca focada para evitar teclado aberto junto com o novo painel.
  if(previousFocus?.tagName==='INPUT'||previousFocus?.tagName==='TEXTAREA')previousFocus.blur();
  const extras=(snapshot.options??[]).filter(o=>o.product_id===product.id);
  const dlg=document.createElement('dialog');dlg.className='wg-product-sheet';
  dlg.setAttribute('aria-label','Adicionar '+product.name+' à comanda');
  const form=document.createElement('form');form.noValidate=true;
  const top=document.createElement('div');top.className='wg-product-top';
  const grip=document.createElement('button');grip.className='wg-product-grip';grip.type='button';grip.setAttribute('aria-label','Arraste para expandir ou fechar o painel');
  const heading=document.createElement('div');heading.className='wg-product-heading';
  const productTitle=document.createElement('div');
  const title=document.createElement('h3');title.textContent=product.name;
  const unit=document.createElement('span');unit.className='wg-product-unit';unit.textContent=money(product.price_cents)+' cada';
  productTitle.append(title,unit);
  const close=document.createElement('button');close.type='button';close.className='wg-product-close';close.setAttribute('aria-label','Fechar');close.innerHTML=icon('x',20);
  heading.append(productTitle,close);top.append(grip,heading);
  const content=document.createElement('div');content.className='wg-product-content';
  const hint=document.createElement('p');hint.className='wg-product-help';hint.textContent=activeOrder?'Adicione os produtos nesta comanda. Uma nova rodada será criada quando necessário.':'A comanda será aberta automaticamente quando você confirmar.';
  const qtyLabel=document.createElement('label');qtyLabel.className='wg-product-label';qtyLabel.textContent='Quantidade';
  const row=document.createElement('div');row.className='wg-qty-row';
  const minus=document.createElement('button');minus.type='button';minus.className='wg-qty-step';minus.setAttribute('aria-label','Diminuir quantidade');minus.innerHTML=icon('minus',22);
  const qty=document.createElement('button');qty.type='button';qty.value='1';qty.textContent='1';qty.className='wg-qty-input';qty.setAttribute('aria-label','Quantidade, toque para digitar');qty.setAttribute('aria-expanded','false');
  const plus=document.createElement('button');plus.type='button';plus.className='wg-qty-step';plus.setAttribute('aria-label','Aumentar quantidade');plus.innerHTML=icon('plus',22);
  row.append(minus,qty,plus);
  const keypad=document.createElement('div');keypad.className='wg-inline-keypad';keypad.hidden=true;
  const noteLabel=document.createElement('label');noteLabel.className='wg-product-label';noteLabel.textContent='Observação (opcional)';
  const note=document.createElement('textarea');note.className='wg-product-note';note.name='note';note.rows=3;note.maxLength=350;note.placeholder='Ex.: sem cebola, sem gelo, molho à parte...';
  note.id='wg-sheet-note';noteLabel.htmlFor=note.id;
  const feedback=document.createElement('p');feedback.className='wg-product-feedback error';feedback.setAttribute('role','alert');
  const detailSrc=photo(product);
  if(detailSrc){
   const preview=document.createElement('figure');preview.className='wg-sheet-preview';
   const frame=document.createElement('div'),img=document.createElement('img'),caption=document.createElement('figcaption');
   img.alt=product.name;img.decoding='async';img.addEventListener('error',()=>preview.remove(),{once:true});img.src=detailSrc;
   caption.textContent='Imagem meramente ilustrativa';frame.append(img);preview.append(frame,caption);content.append(preview);
  }
  if(product.description){const p=document.createElement('p');p.className='wg-sheet-description';p.textContent=product.description;content.append(p)}
  content.append(hint,qtyLabel,row,keypad,noteLabel,note);
  if(extras.length){const warning=document.createElement('p');warning.className='wg-note wg-product-warning';warning.textContent='Adicionais ainda não alteram o preço da comanda. Informe pedidos especiais na observação.';content.append(warning)}
  content.append(feedback);
  const footer=document.createElement('div');footer.className='wg-product-footer';
  const total=document.createElement('div');total.className='wg-product-total';
  const totalLabel=document.createElement('span');totalLabel.textContent='Total do produto';
  const amount=document.createElement('strong');total.append(totalLabel,amount);
  const actions=document.createElement('div');actions.className='wg-product-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='wg-product-cancel';cancel.textContent='Cancelar';
  const confirm=document.createElement('button');confirm.type='submit';confirm.className='wg-product-confirm';confirm.textContent='Adicionar à comanda';
  actions.append(cancel,confirm);footer.append(total,actions);
  form.append(top,content,footer);dlg.append(form);document.body.append(dlg);
  let saving=false;
  const quantity=()=>Number(qty.value);
  const update=()=>{
   const n=quantity(),valid=qty.value!==''&&Number.isInteger(n)&&n>=1&&n<=99;
   qty.textContent=qty.value||'–';
   minus.disabled=saving||!valid||n<=1;plus.disabled=saving||!valid||n>=99;
   confirm.disabled=saving||!valid;
   amount.textContent=valid?money(product.price_cents*n):'—';
  };
  let firstDigit=true,editDigits='';
  const closeKeypad=()=>{
   keypad.hidden=true;qty.setAttribute('aria-expanded','false');
   qty.value=String(Math.max(1,Math.min(99,Number(qty.value)||1)));update();
  };
  qty.onclick=()=>{
   keypad.hidden=!keypad.hidden;qty.setAttribute('aria-expanded',String(!keypad.hidden));
   if(!keypad.hidden){firstDigit=true;editDigits=''}
  };
  for(const key of ['1','2','3','4','5','6','7','8','9','Limpar','0','⌫','Concluído']){
   const btn=document.createElement('button');btn.type='button';btn.textContent=key;
   if(key==='Concluído')btn.className='wg-key-done';
   btn.setAttribute('aria-label',key==='⌫'?'Apagar último número':key);
   btn.onclick=()=>{
    if(key==='Concluído'){closeKeypad();return}
    if(key==='Limpar'){editDigits='';firstDigit=false}
    else if(key==='⌫'){editDigits=firstDigit?'':editDigits.slice(0,-1);firstDigit=false}
    else {editDigits=(firstDigit?'':editDigits)+key;firstDigit=false;if(editDigits.length>2)editDigits=editDigits.slice(-2)}
    qty.value=editDigits;feedback.textContent='';update();
   };
   keypad.append(btn);
  }
  minus.onclick=()=>{closeKeypad();qty.value=String(Math.max(1,quantity()-1));update()};
  plus.onclick=()=>{closeKeypad();qty.value=String(Math.min(99,quantity()+1));update()};
  note.addEventListener('focus',()=>{if(!keypad.hidden)closeKeypad()});
  cancel.onclick=()=>{if(!saving)dlg.close()};
  close.onclick=()=>{if(!saving)dlg.close()};
  dlg.addEventListener('cancel',e=>{if(saving)e.preventDefault()});
  // Arrastar a alça para cima expande o sheet; para baixo fecha.
  let dragY=null,dragDelta=0;
  grip.addEventListener('pointerdown',e=>{if(saving)return;dragY=e.clientY;dragDelta=0;grip.setPointerCapture?.(e.pointerId)});
  grip.addEventListener('pointermove',e=>{if(dragY===null)return;dragDelta=e.clientY-dragY;if(dragDelta>0)dlg.style.transform='translateY('+Math.min(dragDelta,220)+'px)'});
  const finishDrag=()=>{if(dragY===null)return;const dy=dragDelta;dragY=null;dragDelta=0;dlg.style.transform='';if(dy>85&&!saving)dlg.close();else if(dy < -45)dlg.classList.add('is-expanded')};
  grip.addEventListener('pointerup',finishDrag);
  grip.addEventListener('pointercancel',finishDrag);
  const viewport=window.visualViewport;
  const alignKeyboard=()=>{
   if(!dlg.isConnected)return;
   const viewHeight=viewport?.height??window.innerHeight;
   const keyboard=Math.max(0,window.innerHeight-(viewHeight+(viewport?.offsetTop??0)));
   dlg.style.bottom=keyboard?Math.round(keyboard)+'px':(window.matchMedia('(min-width:691px)').matches?'16px':'0px');
   dlg.style.setProperty('--wg-sheet-vh',Math.max(200,Math.round(viewHeight-8))+'px');
  };
  viewport?.addEventListener('resize',alignKeyboard);
  viewport?.addEventListener('scroll',alignKeyboard);
  window.addEventListener('resize',alignKeyboard);
  dlg.addEventListener('close',()=>{
   viewport?.removeEventListener('resize',alignKeyboard);
   viewport?.removeEventListener('scroll',alignKeyboard);
   window.removeEventListener('resize',alignKeyboard);
   dlg.remove();
   if(previousFocus?.isConnected&&previousFocus.tagName==='BUTTON')previousFocus.focus({preventScroll:true});
  },{once:true});
  form.onsubmit=async e=>{
   e.preventDefault();if(saving)return;
   const n=quantity();
   if(selectedId!==tableId||!selected()){feedback.textContent='Selecione a mesa novamente antes de adicionar.';return}
   if(!Number.isInteger(n)||n<1||n>99){feedback.textContent='Informe uma quantidade entre 1 e 99.';return}
   saving=true;confirm.textContent='Adicionando...';cancel.disabled=true;close.disabled=true;update();
   try{
    await call('item_add_auto',{table_id:tableId,product_id:product.id,quantity:n,note:note.value});
    dlg.close();view='cardapio';await reload();
   }catch(err){saving=false;confirm.textContent='Adicionar à comanda';cancel.disabled=false;close.disabled=false;feedback.textContent=err.message;update()}
  };
  update();
  dlg.showModal();alignKeyboard();
  // Sem autofocus em campos editáveis: teclado apenas quando usuário tocar neles.
  close.focus({preventScroll:true});
 }
 async function reload(silent=false){
  if(!alive||fetching)return;
  if(silent&&(document.querySelector('dialog.wg-modal[open],dialog.wg-product-sheet[open],dialog.iv-variant-picker[open],dialog.wd-sheet[open]')||document.activeElement?.id==='wg-search'))return;
  fetching=true;
  if(!silent&&!snapshot)box(header+'<div class="iv-loading-inline" role="status" aria-live="polite" aria-busy="true"><div class="iv-loading-inline-label"><span class="iv-load-dot" aria-hidden="true"></span><span>Preparando mesas e produtos...</span></div><div class="iv-loading-inline-lines" aria-hidden="true"><span class="iv-load-skeleton"></span><span class="iv-load-skeleton"></span></div></div>');
  try{
    const [t,o,c]=await Promise.all([call('tables'),call('orders'),call('catalog')]);
    const categories=(c.categories??[]).filter(x=>x.active);
    const ids=new Set(categories.map(x=>x.id));
    const products=(c.products??[]).filter(x=>x.available&&ids.has(x.category_id));
    const tables=(t.tables??[]).filter(x=>x.active!==false),orders=o.orders??[],items=o.items??[],rounds=o.rounds??[],options=c.options??[];
    const sig=JSON.stringify({tables,orders,items,products,categories,options,rounds});
    if(silent&&sig===lastSignature)return;
    const alerts=readyTableAlerts(tables,orders,rounds),nextReady=new Set(alerts.flatMap(a=>a.keys));
    const newlyReady=alerts.filter(a=>a.keys.some(key=>!knownReady.has(key)));
    knownReady=nextReady;
    snapshot={tables,orders,items,products,categories,options,rounds};lastSignature=sig;
    if(selectedId&&!tables.some(t=>t.id===selectedId)){selectedId=null;view='mesas';categoryFilter='all';search=''}
    render();
    // One accessible announcement per newly ready round; visual notice persists until served.
    if(newlyReady.length){
     let live=document.getElementById('wg-ready-live');
     if(!live){live=document.createElement('div');live.id='wg-ready-live';live.className='wg-ready-live';live.setAttribute('role','status');live.setAttribute('aria-live','polite');document.body.append(live)}
     live.textContent='Pronto para servir: '+newlyReady.map(a=>a.label).join(', ');
    }
  }catch(err){if(!silent)box(header+'<section class="wg-panel wg-empty"><h2>Não foi possível carregar o atendimento</h2><p>'+esc(err.message)+'</p><button class="wg-action" id="wg-retry">Tentar novamente</button></section>');
    document.getElementById('wg-retry')?.addEventListener('click',()=>reload())}
  finally{fetching=false}
 }
 const poll=setInterval(()=>{if(document.visibilityState==='visible'&&document.getElementById('wg-root'))reload(true)},10000);
 function updateClocks(){
  if(document.visibilityState!=='visible')return;
  const now=Date.now();
  document.querySelectorAll('[data-w-prep-time]').forEach(el=>{const minutes=preparationMinutes(el.dataset.wPrepTime,now);if(minutes!==null)el.textContent=minutes+' min'});
  for(const el of document.querySelectorAll('[data-w-ready-since]')){
   const late=overdueReady(el.dataset.wReadySince,now);
   if(el.dataset.overdue!==String(late))el.dataset.overdue=String(late);
   const elapsed=el.querySelector('.wg-ready-elapsed'),minutes=preparationMinutes(el.dataset.wReadySince,now);
   if(elapsed&&minutes!==null)elapsed.textContent=' · '+minutes+' min';
  }
  const banner=document.querySelector('.wg-ready-alert');
  if(banner){const late=!!banner.querySelector('button[data-overdue="true"]');banner.classList.toggle('has-overdue',late);const heading=document.getElementById('wg-ready-heading');const label=late?'Atenção · sirva os pedidos':'Pronto para servir';if(heading&&heading.textContent!==label)heading.textContent=label}
 }
 const clock=setInterval(updateClocks,5000);
 const visibility=()=>{if(document.visibilityState==='visible'){updateClocks();reload(true)}};
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('pagehide',()=>{alive=false;clearInterval(poll);clearInterval(clock);document.removeEventListener('visibilitychange',visibility)},{once:true});
 return reload();
}
