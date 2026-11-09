// GB+ 2.8.9 — regressão de Nova/Editar conta e seletor de instituição.
// Execute: node gbplus/tests/gbplus-289-account-sheet-regression.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const strip=code=>code.replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const compile=(file,names,deps={})=>
 Function(...Object.keys(deps),strip(read(file))+'; return {'+names.join(',')+'};')(...Object.values(deps));
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const icon=name=>'<svg data-icon="'+esc(name)+'"></svg>';
const field=(label,name,value='',type='text',attrs='')=>
 '<label class="field">'+label+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+attrs+'></label>';
const select=(label,name,options,value)=>'<label>'+esc(label)+'<select name="'+esc(name)+'">'+options.map(([v,title])=>
 '<option value="'+esc(v)+'"'+(String(v)===String(value)?' selected':'')+'>'+esc(title)+'</option>').join('')+'</select></label>';
const formFooter=()=>'<div class="form-footer"><button type="submit">Salvar</button></div>';
const button=(txt,action)=>'<button type="button" data-action="'+action+'">'+txt+'</button>';
const bank={id:'001',name:'Banco de Teste',code:'001'};
const db={banks:[],accounts:[]};
const findBank=(source,value)=>String(value||'').toLowerCase()===bank.id||
 String(value||'').toLowerCase()===bank.name.toLowerCase()?bank:null;
const bankBadge=row=>'<span class="bank-logo">'+esc(row.name)+'</span>';
const forms=compile('js/forms.js',['accountForm','accountBankPreview'],{
 esc,icon,field,select,formFooter,button,findBank,bankBadge
});
const fresh=forms.accountForm(db);
assert(fresh.includes('id="account-form"')&&fresh.includes('gb-account-edit-form'));
assert(fresh.includes('data-action="account-bank-picker"')&&fresh.includes('aria-controls="gb-picker-sheet"'));
assert(fresh.includes('Dinheiro em caixa')&&fresh.includes('Sem banco'));
assert(fresh.includes('name="bankId"')&&fresh.includes('name="bank"'));
assert(fresh.includes('name="initial"')&&!/name="initial"[^>]*required/.test(fresh));
assert(fresh.includes('name="active" value="true"'),'New account active by default');
assert(!fresh.includes('Outra instituição')&&!fresh.includes('Agência (opcional)')&&!fresh.includes('Número da conta (opcional)'));
assert(!fresh.includes('gb-bank-shortcuts')&&!fresh.includes('gb-bank-search'));
assert(!fresh.includes('Selecione um banco para exibir seu logo'));
const current={id:'existing',name:'Dinheiro',bank:'',bankId:'',initial:0,active:true,branch:'0001',number:'12345'};
const edit=forms.accountForm(db,current);
assert(edit.includes('Editar')===false,'Title belongs to modal header, not in nested form');
assert(edit.includes('Situação')&&edit.includes('Excluir conta'));
assert(!edit.includes('name="branch"')&&!edit.includes('name="number"'));
const legacy=forms.accountForm(db,{...current,bank:'Cooperativa antiga'});
assert(legacy.includes('Cooperativa antiga')&&legacy.includes('name="bank"'));
assert(!legacy.includes('name="bankLookup"'),'No duplicate bank search');
const identified=forms.accountForm(db,{...current,bankId:'001',bank:bank.name});
assert(identified.includes(bank.name)&&identified.includes('name="bankId" value="001"'));
const cash=forms.accountBankPreview(db,'','');
assert(cash.includes('Dinheiro em caixa')&&cash.includes('wallet'));
const selected=forms.accountBankPreview(db,'001','');
assert(selected.includes(bank.name)&&selected.includes('bank-logo'));
const oldName=forms.accountBankPreview(db,'','Cooperativa antiga');
assert(oldName.includes('Cooperativa antiga'));
const sheetRoot={
 open:false,dataset:{},innerHTML:'',
 querySelector:()=>({setAttribute(){},focus(){}}),
 showModal(){this.open=true;}
};
const picker=compile('js/bottom-sheet.js',['openGbPickerSheet'],{
 esc,icon,gbIcon:()=>'',categoryIconFor:()=>'',SERVICE_CATALOG:[],SERVICE_GROUPS:{},
 serviceIconMarkup:()=>'',serviceCategoryPreviewMarkup:()=>'',isPrimaryServiceCategory:()=>false,
 isSelectableExpenseCategory:()=>true,
 document:{querySelector:()=>sheetRoot,activeElement:{focus(){}}}
});
const shown=picker.openGbPickerSheet({
 kind:'bank',selected:'__cash__',items:[
  {id:'__cash__',name:'Dinheiro em caixa',subtitle:'Sem banco',badgeMarkup:icon('wallet')},
  {id:'001',name:bank.name,subtitle:'Código 001',badgeMarkup:bankBadge(bank)}
 ],onPick:()=>{}
});
assert(shown&&sheetRoot.open&&sheetRoot.dataset.snap==='expanded');
assert(sheetRoot.innerHTML.indexOf('Dinheiro em caixa')<sheetRoot.innerHTML.indexOf('Bancos disponíveis'));
assert(sheetRoot.innerHTML.includes('aria-selected="true" data-sheet-choice="__cash__"'));
assert(sheetRoot.innerHTML.includes('data-sheet-search-input')&&sheetRoot.innerHTML.includes('Arraste a barra'));
const app=read('js/app.js');
assert(app.includes("'account-bank-picker':el=>")&&app.includes("bankPickerCatalog(db)"));
assert(app.includes("if(id==='__cash__'){source.value='';manual.value='';}"));
assert(app.includes("if(id==='__legacy__'&&legacy)"));
assert(app.includes('branch:previous?.branch')&&app.includes('number:previous?.number'));
assert(app.includes("String(v.initial||'').trim()===''?0:cents(v.initial)"));
const css=read('styles.css');
assert(css.includes('#account-form.gb-account-edit-form'));
assert(css.includes('#account-form .gb-account-bank-trigger'));
assert(css.includes('#account-form .gb-account-opening-control'));
const version=JSON.parse(read('version.json'));
assert.equal(version.version,'2.8.9');assert.equal(version.build,2890);
assert(read('sw.js').includes('gb-plus-shell-v2890'));
assert(read('index.html').includes('gbplus-version" content="2.8.9"'));
assert(read('index.html').includes('app.js?v=20261108-2890'));
console.log('GB+ 2.8.9: cadastro compacto, caixa sem banco, bottom sheet, dados legados e cache aprovados.');
