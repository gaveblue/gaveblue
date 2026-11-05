'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const preview=fs.readFileSync(path.join(root,'ai-lab/preview-card.js'),'utf8').replace(/\bexport\s+(?=(?:async |function |const |let |class ))/g,'');
const engine=fs.readFileSync(path.join(root,'ai-lab/engine.js'),'utf8').replace(/^import .*;$/gm,'').replace(/\bexport\s+(?=(?:async |function |const |let |class ))/g,'');
const html=fs.readFileSync(path.join(root,'ai-lab/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'ai-lab/preview-card.css'),'utf8');
const importStage=fs.readFileSync(path.join(root,'ai-lab/file-stage.js'),'utf8');
const lib=new Function(preview+';return {proposalSchedule,validateEditedProposal,renderProposalPreview};')();
const ai=new Function('answerFAQ',engine+';return {interpret,fixture};')(()=>null);
const sample=()=>({type:'expense',description:'Energia elétrica',amountCents:45000,due:'2026-11-15',mode:'recurring',count:6,partner:null});

test('six recurring titles match the screenshot, with exact total and monthly dates',()=>{
 const result=lib.proposalSchedule(sample());
 assert.equal(result.items.length,6);
 assert.deepEqual(result.items.map(t=>t.due),[
  '2026-11-15','2026-12-15','2027-01-15','2027-02-15','2027-03-15','2027-04-15'
 ]);
 assert.deepEqual(result.items.map(t=>t.amountCents),Array(6).fill(45000));
 assert.equal(result.totalCents,270000);
});
test('installment preview distributes residual centavos without inventing expenses',()=>{
 const result=lib.proposalSchedule({...sample(),mode:'installment',amountCents:10001,count:3});
 assert.deepEqual(result.items.map(t=>t.amountCents),[3334,3334,3333]);
 assert.equal(result.totalCents,10001);
});
test('calendar never overflows a short month',()=>{
 const result=lib.proposalSchedule({...sample(),due:'2026-01-31',count:3});
 assert.deepEqual(result.items.map(t=>t.due),['2026-01-31','2026-02-28','2026-03-31']);
});
test('invalid dates, quantities and unsafe amounts do not produce a confirmable preview',()=>{
 assert.throws(()=>lib.proposalSchedule({...sample(),due:'2026-02-31'}),/incompleta/);
 assert.throws(()=>lib.proposalSchedule({...sample(),count:121}),/quantidade/);
 assert.throws(()=>lib.proposalSchedule({...sample(),mode:'installment',amountCents:2,count:3}),/valor/);
 assert.throws(()=>lib.validateEditedProposal({...sample(),description:''}),/descrição/);
});
test('assistant prepares a proposal before recording; editing a day does not alter R$450',()=>{
 const first=ai.interpret('Lança uma conta de energia de 450 reais para dia 15 e repete por seis meses');
 assert.equal(first.intent,'preparar_lancamento');
 assert.equal(first.status,'ready');
 assert.equal(first.proposal.amountCents,45000);
 assert.equal(first.proposal.mode,'recurring');
 assert.equal(first.proposal.count,6);
 const next=ai.interpret('altera para dia 20',{proposal:first.proposal});
 assert.equal(next.intent,'corrigir_previa');
 assert.equal(next.proposal.amountCents,45000);
 assert.equal(next.proposal.due.slice(-2),'20');
 const question=ai.interpret('edita a data de vencimento',{proposal:next.proposal});
 assert.equal(question.status,'needs_clarification');
 assert.match(question.answer,/Qual nova data/);
});
test('draft is inside chat with four actions and complete edit fields',()=>{
 for(const id of ['details','preview','detail-toggle','edit-draft','discard','confirm','draft-editor','ai-file-input','ai-attach'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/log\.append\(detailsCard\)/);
 assert.match(html,/placePreviewAfterAnswer\(\)/);
 assert.match(html,/renderProposalPreview\(/);
 assert.match(html,/validateEditedProposal\(/);
 assert.match(html,/pendingPreviewCorrection/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.ai-preview-confirm\{background:#11933d/);
 assert.match(css,/\.ai-preview-discard\{color:#ba363e/);
});
test('legacy postMessage bridge remains the sole route for confirmed financial creation',()=>{
 assert.match(html,/if\(!proposal\)return/);
 assert.match(html,/bridge\.writeEnabled/);
 assert.match(html,/kind:'gbplus-ai-create-title'/);
 assert.match(html,/requestId/);
 assert.match(html,/Verifique se o título apareceu em Títulos antes de tentar novamente/);
});
test('staged attachments are local-only: PDF and XLSX are not claimed to be parsed',()=>{
 assert.match(importStage,/A leitura de/);
 assert.match(importStage,/Aguardando implementação/);
 assert.match(importStage,/parseBankStatement/);
 assert.match(importStage,/Nenhuma operação foi gravada/);
 assert.doesNotMatch(importStage,/supabase\.from|gbplus_save|postMessage\(/);
});
