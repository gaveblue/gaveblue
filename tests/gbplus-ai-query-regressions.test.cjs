'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const raw=fs.readFileSync(path.join(root,'js/ai-bridge.js'),'utf8');
const script=raw.replace(/^import .*;\s*$/gm,'').replace(/\bexport\s+/g,'');
const db={
 titles:[
  {id:'energy',type:'expense',description:'Energia',amount:10000,due:'2026-11-20',cancelled:false,partnerId:'',categoryId:'e'},
  {id:'sale',type:'income',description:'Venda',amount:20000,due:'2026-11-10',cancelled:false,partnerId:'',categoryId:'v'},
  {id:'old',type:'expense',description:'Internet',amount:3000,due:'2026-10-20',cancelled:false,partnerId:'',categoryId:'e'},
  {id:'cancelled',type:'expense',description:'Cancelado',amount:999999,due:'2026-11-01',cancelled:true,partnerId:'',categoryId:'e'}
 ],
 payments:[
  {titleId:'sale',amount:5000,date:'2026-10-30'},
  {titleId:'energy',amount:2500,date:'2026-11-01'}
 ],
 accounts:[{id:'bank',name:'Conta Principal',initial:50000}],transfers:[],partners:[],
 categories:[{id:'e',name:'Contas',type:'expense'},{id:'v',name:'Vendas',type:'income'}]
};
const paid=(database,id)=>database.payments.filter(p=>p.titleId===id).reduce((n,p)=>n+p.amount,0);
const pending=(database,t)=>t.cancelled?0:t.amount-paid(database,t.id);
const {answerFromDb}=new Function('balance','accountBalance','pending','today','generateTitles','paid','answerScenario',
 script+';return {answerFromDb};')(
 ()=>50000,()=>50000,pending,()=> '2026-11-05',()=>{},paid,()=>null
);
const response=q=>answerFromDb(db,q);
test('consultas mensais usam período explícito em vez de mês corrente',()=>{
 assert.match(response('Quanto recebi em outubro?'),/10\/2026: R.\s?50,00/);
 assert.match(response('Quanto paguei em novembro?'),/11\/2026: R.\s?25,00/);
 assert.match(response('Quanto gastei no mês passado?'),/10\/2026/);
});
test('consultar movimentos na conta não vira uma lista de vencimentos',()=>{
 const answer=response('Quanto entrou na conta neste mês?');
 assert.match(answer,/Receitas efetivamente recebidas/);
 assert.doesNotMatch(answer,/Vencimentos/);
});
test('consultas de saldo e capacidade de pagamento',()=>{
 assert.match(response('Me diz quanto tenho na conta'),/Saldo atual calculado/);
 assert.match(response('Tenho dinheiro pra pagar as contas?'),/Saldo bancário/);
 assert.match(response('Qual meu saldo por conta?'),/Conta Principal/);
});
test('contas vencidas, em aberto e próximas',()=>{
 assert.match(response('Quais são meus boletos em aberto?'),/Contas a pagar/);
 assert.match(response('Quando vence minha próxima conta?'),/Próximos vencimentos/);
 assert.match(response('Listar títulos vencidos'),/Internet/);
 assert.doesNotMatch(response('Listar títulos vencidos'),/Cancelado/);
});
test('separação de recebíveis ainda pendentes de dinheiro recebido',()=>{
 assert.match(response('Quanto tenho em contas a receber?'),/R.\s?150,00/);
 assert.match(response('Quanto recebi em outubro?'),/R.\s?50,00/);
});

test('mensagens curtas de saudação e confirmação não geram erro',()=>{
 assert.match(response('ol'),/Olá!/);
 assert.match(response('oi'),/Olá!/);
 assert.match(response('ok'),/Certo!/);
 assert.match(response('beleza'),/Certo!/);
});
