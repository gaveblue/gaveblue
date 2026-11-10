// GB+ 3.0.8 — regressão de movimentos diários e vínculo pelo código Sankhya.
// Dados são sintéticos: nenhum nome, CPF/CNPJ ou lançamento do usuário está no repositório.
import assert from 'node:assert/strict';
import {parseErpPartners,parseErpMovements,partnerDecisions,movementDecisions,applyErpPartners,applyErpMovements} from '../js/sankhya-import-core.js';
import {csvRows} from '../js/financial-report-readers.js';
const today='2026-11-10';
const peopleHeaders=['Cód. Sistema Anterior','Data cadastramento','Cód. Parceiro','Matriz','Razão social','Nome Parceiro','Ativo','Tipo de pessoa','CNPJ / CPF','Insc. Estadual / Identidade','Data nascimento/Fundação','Sexo','CEP','Endereço','Nome (Endereço)','Número','Complemento','Bairro','Nome (Bairro)','Cód. Cidade','Nome + UF (Cidade)','Telefone','Ramal','Celular/Fax','Email','Situação','Dt. Último contato','Tabela de Preço','Nome (Cadastro de Tabela de Preço)','Grupo de autorização','Limite de crédito','Limite crédito mensal','Bloquear venda a prazo','Motivo de Bloqueio','Classificação ICMS','Código Sit.Trib.IPI Entrada','Código Sit.Trib.IPI Saída','Natureza da Retenção na Fonte','IPI incide no cálculo do ICMS','Tem IPI','Calcula FUNRURAL/INSS','Calcula IRF','Retém ISS','Optante pelo Simples Nacional?','Enviar DANFE por e-mail?','E-mail p/ envio NF-e/NFS-e/CT-e','Alíquota ISS Ret/Simples','Aplicar a lei da transparência','Micro empresário individual','Sugestão Entrada/Cotação','Descrição (Entrada/Cotação)','Sugestão Saída','Descrição (abaSugestaoSaida)'];
const fields=(code,name,tax)=>Object.assign(Array(peopleHeaders.length).fill(''),{2:code,4:name+' LTDA',5:name,6:'Sim',7:'Jurídica',8:tax,9:'ISENTO',12:'29980000',14:'RUA TESTE',15:'50',20:'CIDADE EXEMPLO - ES',24:'teste@example.invalid',34:'Contribuinte',52:'Operação de saída'});
const partners=parseErpPartners([['Parceiro'],['Total de registros: 2'],peopleHeaders,fields(101,'CLIENTE EXEMPLO','11.111.111/0001-11'),fields(202,'FORNECEDOR EXEMPLO','22.222.222/0001-22')]);
assert.equal(partners.rows.length,2);
assert.equal(partners.columns,53);
assert.equal(partners.rows[0].code,'101');
assert.equal(partners.rows[0].attributes['Descrição (abaSugestaoSaida)'],'Operação de saída');
const db={partners:[],titles:[],payments:[],categories:[{id:'ic',type:'income'},{id:'ec',type:'expense'}],accounts:[{id:'acc',name:'Conta teste',active:true}]};
let seq=0;const newid=()=>'test'+(++seq);
assert.throws(()=>applyErpPartners(db,partners.rows,newid,{confirmed:false}),/Confirme/);
const first=applyErpPartners(db,partners.rows,newid,{confirmed:true});
assert.equal(first.created,2);
assert.deepEqual(partnerDecisions(db,partners.rows).map(p=>p.decision),['update','update']);
assert.equal(db.partners[0].sankhyaCode,'101');
assert.equal(db.partners[0].name,'CLIENTE EXEMPLO LTDA');
assert.equal(db.partners[0].tradeName,'CLIENTE EXEMPLO');
assert.equal(applyErpPartners(db,partners.rows,newid,{confirmed:true}).created,0);
assert.equal(db.partners.length,2);
const movementHeaders=['Dt. Entrada e Saída','Vlr Juros','Parceiro','Conta Baixa','Dt. Negociação','Atraso (dias)','Nro Nota','Dt. Vencimento','Data Baixa','Vlr do Desdobramento','Histórico','Origem','Nro Único','Valor Líquido','Tipo de Título','Vendedor Antigo 2','Vendedor','Empresa','Tipo Operação','Centro Resultado','Vlr Multa','Vlr Desconto','Vlr Baixa','Receita/Despesa'];
const mov=(unique,partner,invoice,due,amt,kind,paidDate='',paymentAmount=0)=>[
 46308,0,partner,'Cód.Conta: 1 - Descrição: SICOOB MATRIZ',46308,0,invoice,due,paidDate,amt,'EXEMPLO','Estoque',unique,kind==='Receita'?amt:-amt,'4','',7,1,1101,'100200101',0,0,paymentAmount,kind];
const entries=[
 mov(801,101,99001,46335,100,'Receita'),
 mov(802,101,99001,46365,100,'Receita'),
 mov(803,101,99001,46395,100,'Receita'),
 mov(804,202,77001,46350,200,'Despesa',46354,200)
];
const movement=parseErpMovements([['Financeiro'],['Total de registros: 4'],movementHeaders,...entries],partners.rows);
assert.equal(movement.rows.length,4);
assert.equal(movement.receipts,3);
assert.equal(movement.expenses,1);
assert.deepEqual(movement.rows.slice(0,3).map(x=>x.sequence),[1,2,3]);
assert(movement.rows.slice(0,3).every(x=>x.groupKey===movement.rows[0].groupKey&&x.count===3));
assert.equal(movement.rows[0].partnerCode,'101');
assert.equal(movement.rows[3].future,undefined);
assert(movementDecisions(db,movement.rows,today)[3].future);
assert.equal(movementDecisions(db,[{...movement.rows[0],partnerCode:'333'}],today)[0].decision,'blocked');
assert.throws(()=>applyErpMovements(db,movement.rows,{confirmed:false},newid,today),/Confirme/);
const opts={confirmed:true,categories:{income:'ic',expense:'ec'},accounts:{'1':'acc'}};
const initial=applyErpMovements(db,movement.rows,opts,newid,today);
assert.equal(initial.created,4);
assert.equal(initial.settled,0); // Futuro não altera saldo
assert.equal(db.payments.length,0);
assert.equal(db.titles.filter(t=>t.mode==='installment').length,3);
assert.equal(new Set(db.titles.map(t=>t.importKey)).size,4);
assert.equal(movementDecisions(db,movement.rows,today).filter(r=>r.decision==='unchanged').length,4);
const liqui=parseErpMovements([['Financeiro'],['Total de registros: 1'],movementHeaders,mov(802,101,99001,46365,100,'Receita',46335,105)]).rows;
assert.equal(movementDecisions(db,liqui,today)[0].decision,'settle');
assert.equal(applyErpMovements(db,liqui,opts,newid,today).settled,1);
assert.equal(db.payments.length,1);
assert.equal(db.payments[0].amount,10500);
assert.equal(db.titles.find(t=>t.importKey.includes('f802')).sankhyaMovement.originalCents,10000);
assert.equal(movementDecisions(db,liqui,today)[0].decision,'unchanged');
const changed=parseErpMovements([['Financeiro'],['Total de registros: 1'],movementHeaders,mov(801,101,99001,46335,120,'Receita')]).rows;
assert.equal(movementDecisions(db,changed,today)[0].decision,'blocked');
const extra=parseErpMovements([['Financeiro'],['Total de registros: 1'],movementHeaders,mov(900,101,99001,46425,100,'Receita')]).rows;
assert.equal(movementDecisions(db,extra,today)[0].decision,'create');
applyErpMovements(db,extra,opts,newid,today);
assert.equal(db.titles.length,5);
assert.equal(db.titles.find(t=>t.importKey.includes('f900')).mode,'installment');
const dupl=parseErpMovements([['Financeiro'],['Total de registros: 2'],movementHeaders,mov(950,101,999,46335,10,'Receita'),mov(950,101,999,46365,10,'Receita')]);
assert.equal(dupl.rows.length,1);
assert.equal(dupl.ignored.length,1);
const csv=csvRows('Nro Único;Receita/Despesa\n8001;"Receita"\n');
assert.equal(csv[1][1],'Receita');
console.log('GB+ 3.0.8: parceiros, 53 colunas, código, parcelas, reimportação e baixas aprovados.');
