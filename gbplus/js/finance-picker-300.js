/* GB+ 3.0 visual — unified, accessible selectors backed by native form fields.
   Pickers never write financial data; the original commit/validation path remains. */
import {esc,icon} from './ui.js?v=20261105-72';
import {money,accountBalance,today} from './domain.js?v=20261105-72';
import {bankPickerCatalog,bankBadge,findBank} from './banks.js?v=20261105-87';
import {accountMark,ACCOUNT_ICON_OPTIONS,GOAL_PRESETS} from './account-goals.js?v=20261109-2900';
import {gbIcon,categoryIconFor,CATEGORY_ICON_OPTIONS} from './gb-icons.js?v=20261109-2900';

const labelled=(name,options,value,placeholder='Selecione uma opção')=>{
 const row=options.find(x=>String(x.id)===String(value));
 return row||{id:'',name:placeholder,subtitle:'Toque para escolher',badgeMarkup:icon('plus')};
};
const badge=(markup)=>'<span class="gb30-picker-mark" aria-hidden="true">'+markup+'</span>';
const preview=item=>'<span class="gb30-picker-preview">'+badge(item.badgeMarkup||icon('wallet'))+
 '<span class="gb30-picker-copy"><strong>'+esc(item.name)+'</strong>'+
 (item.subtitle?'<small>'+esc(item.subtitle)+'</small>':'')+'</span></span>';
export function financePickerItems(db,kind,{includeInactive=false,allowEmpty=false,selected='',exclude='',type='expense'}={}){
 if(kind==='bank')return [
  {id:'',name:'Sem banco',subtitle:'Não vincular instituição',badgeMarkup:icon('wallet')},
  ...bankPickerCatalog(db).map(b=>({id:b.id,name:b.name,
   subtitle:b.code?'Banco '+b.code:'Instituição financeira',
   search:[b.code,b.ispb,b.aliases].filter(Boolean).join(' '),badgeMarkup:bankBadge(b)}))
 ];
 if(kind==='account')return [
  ...(allowEmpty?[{id:'',name:'Não definir',subtitle:'Selecionar depois',badgeMarkup:icon('wallet')}]:[]),
  ...(db.accounts||[]).filter(a=>a.id!==exclude&&(includeInactive||a.active!==false||a.id===selected)).map(a=>({
   id:a.id,name:a.name,
   subtitle:money(accountBalance(db,a.id,today()))+(a.active===false?' · Inativa':' · Saldo disponível'),
   badgeMarkup:accountMark(db,a)
  }))
 ];
 if(kind==='card')return (db.cards||[]).filter(c=>c.active!==false||c.id===selected).map(c=>{
  const bank=findBank(db,c.bankId);
  return {id:c.id,name:c.name,subtitle:bank?.name||'Cartão de crédito',
   badgeMarkup:bankBadge(bank)};
 });
 if(kind==='icon')return ACCOUNT_ICON_OPTIONS.map(([id,name])=>({
  id,name,subtitle:'Ícone da conta',badgeMarkup:gbIcon(id)
 }));
 if(kind==='category-icon')return CATEGORY_ICON_OPTIONS.map(([id,name])=>({id,name,subtitle:'Ícone de categoria',badgeMarkup:gbIcon(id)}));
 if(kind==='goal')return GOAL_PRESETS.map(([id,name,ico])=>({
  id,name,subtitle:'Objetivo do cofrinho',badgeMarkup:gbIcon(ico)
 }));
 if(kind==='partner')return [
  {id:'',name:'Sem parceiro',subtitle:'Opcional',badgeMarkup:icon('people')},
  ...(db.partners||[]).filter(p=>p.active!==false||p.id===selected).map(p=>({
   id:p.id,name:p.name,subtitle:'Parceiro cadastrado',badgeMarkup:icon('people')
  }))
 ];
 if(kind==='expense-category')return (db.categories||[]).filter(c=>c.type===type).map(c=>({
  id:c.id,name:c.name,subtitle:'Categoria de despesa',badgeMarkup:gbIcon(categoryIconFor(c))
 }));
 return [];
}
export function financePickerField(db,{kind,name,label,value='',required=false,allowEmpty=false,placeholder='',exclude='',type='expense'}={}){
 const options=financePickerItems(db,kind,{allowEmpty,selected:value,exclude,type});
 const selected=options.some(o=>String(o.id)===String(value))?String(value):String(options[0]?.id||'');
 const chosen=labelled(name,options,selected,placeholder||'Selecionar');
 const isIcon=kind==='icon';
 const control=isIcon?
  '<input type="hidden" name="'+esc(name)+'" value="'+esc(selected)+'">':
  '<select name="'+esc(name)+'" class="gb30-native-select" data-gb-native="true" tabindex="-1" aria-hidden="true"'+
    (required?' data-gb30-required="true"':'')+' aria-label="'+esc(label)+'">'+
    options.map(o=>'<option value="'+esc(o.id)+'"'+(String(o.id)===String(selected)?' selected':'')+'>'+esc(o.name)+'</option>').join('')+'</select>';
 return '<div class="full gb30-picker-field" data-gb30-picker-field="'+esc(name)+'">'+
  '<label class="gb30-field-label" id="gb30-label-'+esc(name)+'">'+esc(label)+'</label>'+control+
  '<button type="button" class="gb30-picker-trigger" data-action="gb30-picker" data-kind="'+esc(kind)+
   '" data-field="'+esc(name)+'" aria-labelledby="gb30-label-'+esc(name)+'" aria-haspopup="dialog" aria-expanded="false" aria-controls="gb-picker-sheet">'+
   '<span data-gb30-picker-preview>'+preview(chosen)+'</span>'+icon('chevron')+'</button></div>';
}
export function refreshFinancePicker(form,name,item){
 if(!form||!item)return;
 const root=form.querySelector('[data-gb30-picker-field="'+name+'"]');
 const target=root?.querySelector('[data-gb30-picker-preview]');
 if(target)target.innerHTML=preview(item);
}
export function financePickerSummary(db,kind,value){
 return financePickerItems(db,kind,{selected:value,includeInactive:true}).find(o=>String(o.id)===String(value));
}
