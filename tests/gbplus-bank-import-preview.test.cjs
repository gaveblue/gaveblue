'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../gbplus/js/bank-import-preview.js'),'utf8')
 .replace(/\bexport\s+(?=(?:async |function |const |let |class ))/g,'');
const imp=new Function(code+';return {statementCents,statementDate,parseBankCsv,parseBankOfx,parseBankStatement,proposeReconciliation};')();

test('BRL monetary parsing preserves centavos for OFX and Brazilian CSV',()=>{
 assert.equal(imp.statementCents('1.234,56'),123456);
 assert.equal(imp.statementCents('1234.56'),123456);
 assert.equal(imp.statementCents('-1.234,56'),-123456);
 assert.equal(imp.statementCents('R$ 0,01'),1);
 assert.throws(()=>imp.statementCents('1,234'),/ambíguo/);
});
test('bank dates are validated, not guessed',()=>{
 assert.equal(imp.statementDate('05/11/2026'),'2026-11-05');
 assert.equal(imp.statementDate('20261105120000[-3:BRT]'),'2026-11-05');
 assert.throws(()=>imp.statementDate('31/02/2026'),/Data inválida/);
});
test('read OFX SGML with signed movements and preserve bank FITID',()=>{
 const ofx=[
 'OFXHEADER:100','DATA:OFXSGML','VERSION:102',
 '<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKACCTFROM><ACCTID>123456789</BANKACCTFROM>',
 '<BANKTRANLIST>',
 '<STMTTRN>',
 '<TRNTYPE>DEBIT',
 '<DTPOSTED>20261105000000[-3:BRT]',
 '<TRNAMT>-54.90',
 '<FITID>mov-001',
 '<NAME>LOJA',
 '<MEMO>Compra no cartão de débito',
 '</STMTTRN>',
 '<STMTTRN>',
 '<TRNTYPE>CREDIT',
 '<DTPOSTED>20261106',
 '<TRNAMT>125.00',
 '<FITID>mov-002',
 '<NAME>Recebimento',
 '</STMTTRN>',
 '</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>'
 ].join('\n');
 const parsed=imp.parseBankStatement(ofx,'extrato.ofx');
 assert.equal(parsed.format,'ofx');
 assert.equal(parsed.records.length,2);
 assert.equal(parsed.records[0].amount,-5490);
 assert.equal(parsed.records[0].externalId,'mov-001');
 assert.equal(parsed.records[1].amount,12500);
 assert.ok(!parsed.accountHint.includes('123456789'),'bank account number must be masked');
});
test('parse bank CSV with semicolon, quotes, commas and accented headers',()=>{
 const csv='Data;Histórico;Valor;ID\n05/11/2026;"Pix, enviado";"-1.250,23";ABC01\n06/11/2026;"Pix recebido";"3.000,00";ABC02\n';
 const parsed=imp.parseBankCsv(csv);
 assert.equal(parsed.format,'csv');
 assert.equal(parsed.records.length,2);
 assert.equal(parsed.records[0].description,'Pix, enviado');
 assert.equal(parsed.records[0].amount,-125023);
 assert.equal(parsed.records[1].amount,300000);
});
test('CSV with credit and debit columns preserves transaction direction',()=>{
 const csv='Data,Descrição,Crédito,Débito\n05/11/2026,Depósito,12.00,\n05/11/2026,Pagamento,,5.50\n';
 const parsed=imp.parseBankCsv(csv);
 assert.deepEqual(parsed.records.map(x=>x.amount),[1200,-550]);
});
test('unrecognized columns and unsupported xlsx never create financial records',()=>{
 assert.throws(()=>imp.parseBankCsv('qualquer;outra;coluna\na;b;c'),/Colunas obrigatórias/);
 assert.throws(()=>imp.parseBankStatement('binary','extrato.xlsx'),/não suportado/);
});
test('reconciliation is read-only; candidate requires same account, direction and amount',()=>{
 const db={accounts:[{id:'conta_1'}],
  titles:[{id:'t1',type:'expense',description:'Energia',cancelled:false},{id:'t2',type:'income',description:'Venda',cancelled:false}],
  payments:[{id:'p1',titleId:'t1',accountId:'conta_1',amount:5490,date:'2026-11-05'},
   {id:'p2',titleId:'t2',accountId:'conta_1',amount:20000,date:'2026-11-05'}],
  transfers:[]};
 const parsed={format:'ofx',records:[
  {date:'2026-11-05',description:'Luz',amount:-5490,externalId:'abc'},
  {date:'2026-11-05',description:'Recebimento',amount:20000,externalId:'def'},
  {date:'2026-11-05',description:'Novo débito',amount:-9000,externalId:'ghi'}
 ]};
 const snapshot=JSON.stringify(db),preview=imp.proposeReconciliation(parsed,db,'conta_1');
 assert.equal(preview.rows[0].status,'possible_match');
 assert.equal(preview.rows[0].candidates[0].id,'p1');
 assert.equal(preview.rows[1].candidates[0].id,'p2');
 assert.equal(preview.rows[2].status,'not_found');
 assert.equal(preview.totals.unmatched,1);
 assert.equal(preview.readonly,true);
 assert.equal(preview.requiresApproval,true);
 assert.equal(JSON.stringify(db),snapshot);
});
test('repeated same imported transaction is flagged rather than discarded',()=>{
 const db={accounts:[{id:'a'}],titles:[],payments:[],transfers:[]};
 const rec={date:'2026-11-05',description:'Dois pagamentos iguais',amount:-1200,externalId:'same-id'};
 const preview=imp.proposeReconciliation({format:'csv',records:[rec,rec]},db,'a');
 assert.equal(preview.rows.length,2);
 assert.equal(preview.rows[1].status,'possible_duplicate_in_file');
});
test('invalid account and oversize files are rejected',()=>{
 assert.throws(()=>imp.proposeReconciliation({format:'csv',records:[]},{accounts:[]},'nada'),/conta GB/);
 assert.throws(()=>imp.parseBankCsv('x'.repeat(8_000_100)),/8 MB/);
});
