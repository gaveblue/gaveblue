// GB+ 2.5.0 build 4 — validate import file extension and legacy bank encodings.
// Run: node gbplus/tests/bank-import-codec-regression.mjs
import assert from 'node:assert/strict';
import {bankImportFileNameSupported,readBankFileText,parseBankStatement} from '../js/bank-import-preview.js';

assert.equal(bankImportFileNameSupported('extrato.ofx'),true);
assert.equal(bankImportFileNameSupported('EXTRATO.CSV'),true);
assert.equal(bankImportFileNameSupported('movimentos.txt'),true);
assert.equal(bankImportFileNameSupported('movimentos.csv.exe'),false);
assert.equal(bankImportFileNameSupported('arquivo.pdf'),false);
assert.equal(bankImportFileNameSupported(''),false);
const fakeFile=(name,bytes)=>({
 name,size:bytes.byteLength,async arrayBuffer(){return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);}
});
const utf8=new TextEncoder().encode('Data;Descrição;Valor\n06/11/2026;Tarifa;-5,00');
const plain=await readBankFileText(fakeFile('extrato.csv',utf8));
assert.match(plain,/Descrição/);
assert.equal(parseBankStatement(plain,'extrato.csv').records[0].amount,-500);
// Windows-1252 accented header "Descrição" = e7 e3.
const latin=Uint8Array.from([
 ...new TextEncoder().encode('Data;Descri'),0xe7,0xe3,
 ...new TextEncoder().encode('o;Valor\n06/11/2026;Tarifa;-5,00')
]);
const legacy=await readBankFileText(fakeFile('legado.CSV',latin));
assert.equal(legacy,plain,'Read Windows-1252 without corrupting header names');
assert.equal(parseBankStatement(legacy,'legado.CSV').records.length,1);
await assert.rejects(()=>readBankFileText(fakeFile('extrato.pdf',utf8)),/OFX ou CSV/);
await assert.rejects(()=>readBankFileText({...fakeFile('extrato.csv',utf8),size:9_000_000}),/até 8 MB/);
await assert.rejects(()=>readBankFileText({...fakeFile('extrato.csv',utf8),size:utf8.length+1}),/modificado/);
console.log('GB+ 2.5.0 build 4: extensões e UTF-8/Windows-1252 aprovados.');
