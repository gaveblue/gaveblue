#!/usr/bin/env node
// GB+ 2.8.4 — correção dos símbolos invisíveis no seletor mobile.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const toggle=read('lab/liquid-theme-toggle.html');
const app=read('js/app.js'),html=read('index.html');
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++};
const svg=toggle.match(/<svg class="gb-compact-theme-glyph"[\s\S]*?<\/svg>/)?.[0]||'';
ok(!!svg,'O controle compacto precisa conter um símbolo vetorial de fallback.');
ok(svg.includes('viewBox="0 0 24 24"'),'Grid de pixels deve escalar com a lente mobile.');
ok(svg.includes('gb-compact-night-glyph')&&svg.includes('gb-compact-day-glyph'),'Precisa mostrar lua e sol.');
ok((svg.match(/<path /g)||[]).length>=3,'A lua e o sol devem ter geometria própria.');
ok(toggle.includes('html.gb-theme-compact .gb-compact-theme-glyph{'),'O ícone precisa aparecer na versão compacta.');
ok(toggle.includes('position:absolute;z-index:7'),'O símbolo deve ficar acima das reflexões do vidro.');
ok(toggle.includes('color:#37363d;opacity:var(--day)'),'Sol escuro e visível na lente branca.');
ok(toggle.includes('color:#e8efff;opacity:var(--night)'),'Lua clara e visível na lente escura.');
ok(toggle.includes('html.gb-theme-compact .pixel-symbol{display:none!important}'),'Evitar sobreposição do canvas pequeno no modo compacto.');
ok(toggle.includes('.gb-compact-theme-glyph{display:none}'),'Prototipagem original preserva canvas e suas partículas.');
ok(toggle.includes('--orbit-color:color-mix(in srgb,#ffb843 calc(var(--day) * 100%),#809eff)'),'Cor de fallback: dourado de dia e azul à noite.');
const begin=toggle.indexOf('  let orbitLength=870;'),end=toggle.indexOf('\n\n  // Paired',begin);
ok(begin>=0&&end>begin,'Calcular faixa orbital em bloco testável.');
const block=toggle.slice(begin,end);
const knobProperties=new Map();
const document={getElementById:()=>({style:{setProperty:(name,value)=>knobProperties.set(name,String(value))}})};
const l=(a,b,t)=>a+(b-a)*t;
const sm=t=>t*t*(3-2*t);
const factory=new Function('orbitGuide','orbitPaths','document','lerp','smooth',block+';return setOrbit;');
const unsupported={
 getTotalLength(){throw new Error('Missing SVG geometry support');},
 getPointAtLength(){throw new Error('Geometry missing during iframe paint');}
};
const setOrbit=factory(unsupported,[{style:{}}],document,l,sm);
setOrbit(0);
ok(knobProperties.get('--orbit-color')==='rgb(112,159,255)','Lua mantém faixa azul mesmo sem APIs SVG.');
ok(knobProperties.get('--orbit-offset')==='0','Ponto inicial da luz permanece estável.');
setOrbit(1);
ok(knobProperties.get('--orbit-color')==='rgb(255,184,67)','Sol recebe faixa dourada mesmo quando geometry throws.');
ok(Number(knobProperties.get('--orbit-offset'))<0,'Luz se move para posição final.');
ok(toggle.includes("const measured=orbitGuide?.getTotalLength?.()"),'API de comprimento é opcional.');
ok(toggle.includes('const point=orbitGuide?.getPointAtLength?.('),'API de coordenadas é opcional.');
ok(toggle.includes('setOrbit(p)')&&toggle.includes('sendThemeScrub(p,settled)'),'Mola e arrasto gradual preservados.');
ok(toggle.includes('progress:Number(p.toFixed(4))'),'Progresso de cores enviado em tempo real.');
ok(html.includes('v=20261108-2841&amp;theme=light'),'Iframe tem novo cache.');
ok(app.includes('v=20261108-2841&theme='),'Carregamento durante troca de tema usa nova versão.');
ok(html.includes('app.js?v=20261108-2841'),'App pai não fica preso no cache antigo.');
for(const x of toggle.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Function(x[1]);
ok(true,'Scripts da página compilam em V8.');
console.log('GB+ 2.8.4: '+checks+' verificações de símbolos e faixa orbital passaram; Android PWA real permanece pendente.');
