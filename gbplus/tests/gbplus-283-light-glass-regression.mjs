#!/usr/bin/env node
// GB+ 2.8.3 — regressão do refinamento visual do botão de tema no cabeçalho.
// Testa fonte e configuração inicial sem tocar em dados financeiros ou Supabase.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(base,path),'utf8');
const toggle=read('lab/liquid-theme-toggle.html');
const app=read('js/app.js');
const page=read('index.html');
const style=read('next-282.css');
const tests=[];
const check=(name,cond)=>{assert.ok(cond,name);tests.push(name);};

const scriptMatches=[...toggle.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
check('Dois blocos JavaScript internos',scriptMatches.length===2);
for(const s of scriptMatches)Function(s[1]);
check('Scripts de animação têm sintaxe válida',true);
const script=Function('document','location',scriptMatches[0][1]);
function prepare(theme){
 const vars={};const cls=new Set();const attributes={};
 const root={
   classList:{add:x=>cls.add(x)},
   dataset:attributes,
   style:{colorScheme:'',setProperty:(key,value)=>{vars[key]=value;}}
 };
 script({documentElement:root},{search:'?compact=1&theme='+theme});
 return {vars,cls,attributes,scheme:root.style.colorScheme};
}
const light=prepare('light'),dark=prepare('dark');
check('O modo claro ativa o esquema claro antes de desenhar',light.scheme==='light'&&light.attributes.gbCompactTheme==='light');
check('O modo escuro preserva o esquema escuro',dark.scheme==='dark'&&dark.attributes.gbCompactTheme==='dark');
check('Não há fundo escuro inicial no modo claro',light.vars['--day']==='1'&&light.vars['--night']==='0');
check('Modo escuro inicia com a trilha noturna',dark.vars['--day']==='0'&&dark.vars['--night']==='1');
check('Estilo do modo claro não usa fundo preto',/html\.gb-theme-compact\[data-gb-compact-theme="light"\]\{color-scheme:light!important\}/.test(toggle));
check('Área externa do iframe permanece transparente',/html\.gb-theme-compact,html\.gb-theme-compact body\{[\s\S]*?background:transparent!important/.test(toggle));
check('Trilho de vidro claro é suave',/html\.gb-theme-compact \.track-day\{[\s\S]*?rgba\(255,255,255,\.98\)/.test(toggle));
check('Lente de vidro claro preserva profundidade',toggle.includes('html.gb-theme-compact .lens-day'));
check('A renderização sincroniza a paleta durante o arrasto',toggle.includes('css.dataset.gbCompactTheme = appearance'));
check('A luz orbital aprovada continua',toggle.includes('setOrbit(p)')&&toggle.includes('orbit-primary'));
check('A mola e o arrasto continuam',toggle.includes('const stiffness = 205')&&toggle.includes("toggle.addEventListener('pointerdown'"));
check('Acessibilidade do teclado preservada',toggle.includes("e.key === 'ArrowLeft'")&&toggle.includes("e.key === 'Enter'"));
check('A origem das mensagens de tema é validada',app.includes('event.origin!==location.origin')&&app.includes('frame.contentWindow!==event.source'));
check('O iframe é versionado para não receber CSS antigo',page.includes('v=20261108-2832&amp;theme=light')&&app.includes('v=20261108-2832&theme='));
check('Estilo novo é importado com cache atualizado',page.includes('next-282.css?v=20261108-2832')&&page.includes('app.js?v=20261108-2832'));
check('Espaço do cabeçalho continua discreto',style.includes('height:59px')&&style.includes('max-width:106px')===false);
check('Não altera a página Mais nem as faturas',app.includes('more:()=>moreView')&&app.includes('accountsCardsView'));
console.log('GB+ 2.8.3 Liquid Glass: '+tests.length+' verificações aprovadas em fonte. Teste visual em Android ainda pendente.');
