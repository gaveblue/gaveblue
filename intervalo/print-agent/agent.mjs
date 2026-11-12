#!/usr/bin/env node
// Intervalo Print Agent: prova local offline; nao conectar impressora nesta fase.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
const clean=(s,max=200)=>String(s??'').replace(/[\x00-\x1F\x7F\x1B]/g,' ').slice(0,max).trim();
const line='--------------------------------';
function render(ticket){
 if(!ticket||!Array.isArray(ticket.items)||ticket.items.length<1||ticket.items.length>80)throw Error('Itens inválidos');
 if(ticket.items.some(i=>!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>99||typeof i.name!=='string'))throw Error('Item inválido');
 const lines=[line,'INTERVALO · PRÉVIA DE IMPRESSÃO',line,
  'Restaurante: '+clean(ticket.restaurant,80),
  'Mesa: '+clean(ticket.table,35),
  'Pedido: '+clean(ticket.order_id,80),
  'Emissão: '+new Date().toLocaleString('pt-BR'),line];
 for(const i of ticket.items){
  lines.push(String(i.quantity)+' x '+clean(i.name,120));
  if(i.note)lines.push('  Obs: '+clean(i.note,150));
 }
 lines.push(line,'Aguardando driver/agente seguro',line);
 return lines.join('\n')+'\n';
}
if(process.argv[2]!=='--dry-run'||!process.argv[3]){
 console.error('Uso: node agent.mjs --dry-run sample-ticket.json');
 process.exitCode=2;
}else{
 try{
  const filepath=resolve(process.argv[3]);
  const input=await readFile(filepath);
  if(input.length>65536)throw Error('Arquivo excede tamanho máximo');
  const ticket=JSON.parse(input.toString('utf8'));
  const outputDir=resolve('dry-run-output');
  await mkdir(outputDir,{recursive:true});
  const output=join(outputDir,randomUUID()+'.txt');
  await writeFile(output,render(ticket),{encoding:'utf8',flag:'wx',mode:0o600});
  console.log('Prévia gerada sem acessar hardware: '+output);
 }catch(e){
  console.error('Falha de validação: '+e.message);
  process.exitCode=1;
 }
}
