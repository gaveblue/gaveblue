'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../gbplus/js/setup-ui.js'),'utf8');
const start=source.indexOf('export function firstStepsPanel(');
assert.ok(start>0,'Checklist não encontrado');
const template=source.slice(start).replace('export function firstStepsPanel','function firstStepsPanel');
const button=(label,action,kind='',attr='')=>'<button data-action="'+action+'" '+attr+'>'+label+'</button>';
const esc=x=>String(x??'').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const firstStepsPanel=new Function('money','esc','icon','button',template+';return firstStepsPanel;')(
 value=>'R$ '+(value/100).toFixed(2).replace('.',','),esc,name=>'<span data-icon="'+name+'"></span>',button
);
test('empty finances offer account, opening balance, and first title',()=>{
 const html=firstStepsPanel({accounts:[],titles:[]});
 for(const item of ['Cadastre sua primeira conta','Informe o saldo inicial','Registre seu primeiro lançamento','0 de 3 etapas','onboarding-dismiss','new-account','new-title'])
  assert.ok(html.includes(item),item);
});
test('account opening balance is guidance, never a booked receipt',()=>{
 const html=firstStepsPanel({accounts:[{id:'a1',initial:12500}],titles:[]});
 assert.match(html,/Saldo registrado/);
 assert.match(html,/R\$ 125,00/);
 assert.match(html,/2 de 3 etapas/);
 assert.match(html,/não uma receita/);
 assert.match(html,/Criar lançamento/);
});
test('checklist disappears after account and first title',()=>{
 assert.equal(firstStepsPanel({accounts:[{id:'a1',initial:0}],titles:[{id:'t1'}]}),'');
});
test('account names and financial values do not enter unsafe markup',()=>{
 const html=firstStepsPanel({accounts:[{id:'a1',initial:0,name:'<script>'}],titles:[]});
 assert.ok(!html.includes('<script>'));
});
