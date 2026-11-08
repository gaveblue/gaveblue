#!/usr/bin/env node
// GB+ 2.8.3 — scrubbing progressivo do tema, sem tocar em Supabase.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(base,path),'utf8');
const app=read('js/app.js'),toggle=read('lab/liquid-theme-toggle.html');
const style=read('next-282.css'),html=read('index.html');
let passed=0;
const check=(ok,why)=>{assert.ok(ok,why);passed++;};
const start=app.indexOf('  let gbLiquidThemeTimer=null,gbLiquidPreviewTimeout=null;');
const end=app.indexOf('\ninstallGbPickerSheet();',start);
check(start>=0&&end>start,'Extrair o handler seguro do cabeçalho.');
const block=app.slice(start,end);
const props=new Map(),classes=new Set();
const root={style:{
  setProperty:(key,v)=>props.set(key,String(v)),
  removeProperty:key=>props.delete(key)
},classList:{
  add:key=>classes.add(key),
  remove:key=>classes.delete(key),
  contains:key=>classes.has(key)
}};
const source={},frame={contentWindow:source,isConnected:true,dataset:{theme:'light'},src:'initial'};
const document={
  documentElement:root,
  querySelector:key=>key==='#gb-top-theme-frame'?frame:null
};
let onMessage,writeCount=0;
const db={settings:{theme:'light'}},pending=new Map();
let seq=0;
const setTimeoutMock=(callback,delay)=>{const key=++seq;pending.set(key,{callback,delay});return key;};
const clearTimeoutMock=key=>pending.delete(key);
const install=new Function('window','document','location','db','busy','commit','toast','setTimeout','clearTimeout',block);
install({
 addEventListener:(event,callback)=>{if(event==='message')onMessage=callback;},
 matchMedia:()=>({matches:false})
},document,{origin:'https://gaveblue.com.br'},
db,false,async fn=>{writeCount++;fn(db);},()=>{},setTimeoutMock,clearTimeoutMock);
check(typeof onMessage==='function','Handler de mensagens registrado.');
const send=(data,origin='https://gaveblue.com.br',src=source)=>
  onMessage({origin,source:src,data});
const timersByDelay=delay=>[...pending].filter(([,t])=>t.delay===delay);
async function runDelay(delay){
  const tasks=timersByDelay(delay);
  for(const [key,task] of tasks){pending.delete(key);await task.callback();}
}
send({type:'gbplus:liquid-theme-progress',progress:.4,phase:'drag'},'https://evil.example');
check(!classes.has('gb-theme-preview'),'Origem externa rejeitada.');
send({type:'gbplus:liquid-theme-progress',progress:.4,phase:'drag'},'https://gaveblue.com.br',{});
check(!classes.has('gb-theme-preview'),'Janela diferente rejeitada.');
send({type:'gbplus:liquid-theme-progress',progress:1.4,phase:'drag'});
check(!classes.has('gb-theme-preview'),'Progresso fora do intervalo rejeitado.');
send({type:'gbplus:liquid-theme-progress',progress:.25,phase:'drag'});
check(classes.has('gb-theme-preview')&&props.get('--gb-theme-day-share')==='25.00%','25% de claridade ao arrastar.');
check(props.get('--gb-theme-text-day-share')==='0%','Textos claros permanecem legíveis na metade escura.');
send({type:'gbplus:liquid-theme-progress',progress:.67,phase:'drag'});
check(props.get('--gb-theme-day-share')==='67.00%','Progresso é contínuo, não só 0/1.');
check(props.get('--gb-theme-text-day-share')==='100%','Textos escuros aparecem com contraste na metade clara.');
check(db.settings.theme==='light'&&writeCount===0,'Sem gravação ou inversão do tema durante arrasto.');
send({type:'gbplus:liquid-theme',theme:'dark'});
check(writeCount===0&&timersByDelay(620).length===1,'Persistência é agendada somente depois de soltar.');
send({type:'gbplus:liquid-theme-progress',progress:.39,phase:'drag'});
check(timersByDelay(620).length===0,'Novo arrasto cancela uma escolha anterior pendente.');
send({type:'gbplus:liquid-theme',theme:'dark'});
await runDelay(620);
check(writeCount===1&&db.settings.theme==='dark','Soltar e concluir grava o modo escuro uma única vez.');
check(!classes.has('gb-theme-preview')&&!props.has('--gb-theme-text-day-share'),'Após salvar, preview e ajuste de contraste são limpos.');
check(frame.dataset.theme==='dark'&&frame.src==='initial','O iframe não é recarregado durante a mola.');
send({type:'gbplus:liquid-theme-progress',progress:.72,phase:'drag'});
send({type:'gbplus:liquid-theme',theme:'dark'});
send({type:'gbplus:liquid-theme-settled',theme:'dark'});
check(!classes.has('gb-theme-preview')&&writeCount===1,'Soltar no modo que já estava não faz gravação.');
send({type:'gbplus:liquid-theme-progress',progress:.8,phase:'drag'});
send({type:'gbplus:liquid-theme',theme:'light'});
await runDelay(620);
check(db.settings.theme==='light'&&writeCount===2,'Retorno do escuro para o claro também persiste.');
check(!classes.has('gb-theme-preview'),'Preview é encerrado nos dois sentidos.');
const scripts=[...toggle.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
for(const [,script] of scripts)new Function(script);
check(scripts.length===2,'Scripts do toggle parseiam normalmente.');
check(toggle.includes("type:'gbplus:liquid-theme-progress'")&&toggle.includes('progress:Number(p.toFixed(4))'),'O iframe envia progresso fracionário.');
check(toggle.includes("type:'gbplus:liquid-theme-settled'")&&toggle.includes('userInteracting=false'),'O iframe sinaliza fim da mola.');
check(toggle.includes("Math.abs(p-lastSentPreview) < .004"),'Mensagens redundantes são limitadas.');
check(toggle.includes("setOrbit(p)")&&toggle.includes('const stiffness = 205'),'Orbital e mola originais permanecem.');
check(style.includes(':root[data-theme].gb-theme-preview')&&style.includes('color-mix(in srgb'),'Mistura de cores tem precedência mesmo sobre o tema escuro salvo.');
check(style.includes('--bg:color-mix')&&style.includes('--ink:color-mix')&&style.includes('--surface:color-mix'),'Fundo, texto e cartões acompanham o arrasto.');
check(style.includes('html.gb-theme-preview body::after'),'Área inferior acompanha o tema no celular.');
check(html.includes('v=20261108-2832')&&app.includes('v=20261108-2832'),'Cache novo do seletor e do aplicativo.');
console.log('GB+ 2.8.3: '+passed+' verificações de transição progressiva e segurança aprovadas.');
