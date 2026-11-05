'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const script=fs.readFileSync(path.join(root,'js/ai-scenarios.js'),'utf8').replace(/\bexport\s+/g,'');
const {readScenarioMonth,readScenarioAmount,answerScenario,projectCash}=
 new Function(script+';return {readScenarioMonth,readScenarioAmount,answerScenario,projectCash};')();
const asOf='2026-11-05',bankCents=50000;
const db={titles:[
 {id:'unpaid',type:'expense',amount:10000,due:'2026-11-20',cancelled:false},
 {id:'partial',type:'expense',amount:9000,due:'2026-12-05',cancelled:false},
 {id:'receivable',type:'income',amount:30000,due:'2026-12-10',cancelled:false},
 {id:'cancelled',type:'expense',amount:999999,due:'2026-12-10',cancelled:true},
 {id:'later',type:'expense',amount:100000,due:'2027-05-10',cancelled:false}
 ],payments:[{titleId:'partial',amount:4000}]};
const ask=(question,context)=>answerScenario(db,question,{asOf,bankCents,context});
test('regras de datas futuras e meses nomeados',()=>{
 assert.equal(readScenarioMonth('mês que vem',asOf),'2026-12');
 assert.equal(readScenarioMonth('daqui a três meses',asOf),'2027-02');
 assert.equal(readScenarioMonth('dentro de 12 meses',asOf),'2027-11');
 assert.equal(readScenarioMonth('em janeiro',asOf),'2027-01');
 assert.equal(readScenarioMonth('em janeiro de 2028',asOf),'2028-01');
 assert.equal(readScenarioMonth('este mês',asOf),'2026-11');
});
test('valores em reais, nunca meses confundidos com dinheiro',()=>{
 assert.equal(readScenarioAmount('por R$ 1.200,75'),120075);
 assert.equal(readScenarioAmount('250 reais'),25000);
 assert.equal(readScenarioAmount('se custar 250'),25000);
 assert.equal(readScenarioAmount('daqui a 3 meses'),null);
});
test('projeção é imutável, sem dupla contagem de baixas e sem cancelados',()=>{
 const before=JSON.stringify(db);
 assert.deepEqual(projectCash(db,asOf,'2026-12',bankCents),{
  current:50000,outgoing:15000,incoming:30000,overdue:0,
  conservative:35000,estimated:65000
 });
 assert.equal(JSON.stringify(db),before);
});
test('intenção de comprar calça, preço ausente, e seguimento no mesmo chat',()=>{
 const first=ask('Quero comprar uma calça mês que vem. Como vai estar meu fluxo de caixa?');
 assert.equal(first.context.item,'calca');
 assert.equal(first.context.month,'2026-12');
 assert.equal(first.context.amount,null);
 assert.match(first.answer,/Quanto você estima gastar/);
 const second=ask('e se custar R$ 250?',first.context);
 assert.equal(second.context.amount,25000);
 assert.match(second.answer,/Saldo projetado com a compra: R.\s?400,00/);
 assert.match(second.answer,/não criei lançamento nem alterei seus dados/);
 const third=ask('e daqui a três meses?',second.context);
 assert.equal(third.context.month,'2027-02');
 assert.equal(third.context.amount,25000);
 const fresh=ask('Qual será meu saldo previsto em janeiro?',third.context);
 assert.equal(fresh.context.item,null);
 assert.equal(fresh.context.amount,null);
 assert.doesNotMatch(fresh.answer,/Compra simulada/);
});
test('sem data pede esclarecimento; sem compromisso não inventa resposta',()=>{
 const one=ask('Quero comprar um celular');
 assert.match(one.answer,/Para qual mês/);
 assert.equal(ask('cadastre uma despesa de 250 reais'),null);
 assert.equal(ask('boa tarde'),null);
});
test('déficit conservador fica explícito',()=>{
 const r=ask('Posso comprar um notebook no próximo mês por R$ 1.000,00?');
 assert.match(r.answer,/Atenção:/);
 assert.match(r.answer,/Simulação apenas/);
});
test('corrige-se bug da edição e do botão confirmar sem acesso à conta',()=>{
 const html=fs.readFileSync(path.join(root,'ai-lab/index.html'),'utf8');
 assert.ok(!html.includes("classList.reply('hidden')"));
 assert.ok(html.includes("const targetChat=chats.activeId();const reply=message=>add(message,'assistant',targetChat);"));
 assert.ok(html.includes("scenarioContexts.set(targetChat,event.data.context||null)"));
 const bridge=fs.readFileSync(path.join(root,'js/ai-bridge.js'),'utf8');
 assert.ok(bridge.includes("answerScenario(currentDb,q,"));
});
test('gerador combinatório: 216.000 perguntas em português, sem chamadas externas', {skip:process.env.GBPLUS_AI_STRESS!=='1'},()=>{
 const items=[
 'calca','tenis','camisa','blusa','jaqueta','vestido','saia','bermuda','sapato','bolsa',
 'celular','notebook','tablet','televisao','geladeira','fogao','microondas','sofa','cama','colchao',
 'bicicleta','moto','carro','capacete','cadeira','mesa','monitor','teclado','mouse','impressora',
 'ventilador','ar condicionado','maquina de lavar','secadora','aspirador','cafeteira','livro','curso','violao','piano',
 'passagem','viagem','ingresso','relogio','oculos','anel','brinquedo','presente','uniforme','mochila',
 'remedio','computador','fone','camera','luminaria','tapete','armario','estante','churrasqueira','ferramenta'
 ];
 const times=[
 ['mes que vem','2026-12'],['no proximo mes','2026-12'],['daqui a dois meses','2027-01'],
 ['daqui a tres meses','2027-02'],['em 4 meses','2027-03'],['dentro de cinco meses','2027-04'],
 ['daqui a 6 meses','2027-05'],['em sete meses','2027-06'],['daqui a oito meses','2027-07'],
 ['em 9 meses','2027-08'],['dentro de dez meses','2027-09'],['em 11 meses','2027-10'],
 ['daqui a doze meses','2027-11'],['em 13 meses','2027-12'],['daqui a 15 meses','2028-02']
 ];
 const amounts=[10,19,30,55,79,100,250,399,500,1000];
 const starts=['Quero comprar','Gostaria de comprar','Pretendo comprar','Estou pensando em comprar',
  'Vou comprar','Posso comprar','Será que posso comprar','Queria comprar',
  'Planejo comprar','Se eu comprar','Preciso comprar','Penso em comprar'];
 let cases=0;
 for(const item of items)for(const [time,expectedMonth] of times)for(const amount of amounts)for(const begin of starts)for(const suffix of [
  ' por R$ '+amount,', custando R$ '+amount
 ]){
  const query=begin+' '+item+' '+time+suffix+'. Como fica meu fluxo de caixa?';
  const r=ask(query);
  assert.ok(r,query);
  assert.equal(r.context.month,expectedMonth,query);
  assert.equal(r.context.amount,amount*100,query);
  assert.match(r.answer,/Saldo projetado com a compra:/,query);
  cases++;
 }
 assert.equal(cases,216000);
});
