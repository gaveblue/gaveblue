#!/usr/bin/env node
// GB+ 2.8.5 — substituição definitiva do controle de tema Liquid Glass por
// uma flag simples com sol/lua da biblioteca de ícones interna (Lucide-style).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=x=>readFileSync(resolve(base,x),'utf8');
const page=read('index.html'),app=read('js/app.js'),css=read('next-282.css'),
      ui=read('js/ui.js'),views=read('js/views.js');
let count=0;
function check(value,message){assert.ok(value,message);count++;}
check(page.includes('id="gb-theme-toggle"'),'O botão deve existir no topo.');
check(page.includes('data-action="top-theme"'),'O botão deve disparar a ação conhecida.');
check(page.includes('role="switch"')&&page.includes('aria-checked="false"'),'O botão deve ter semântica acessível de interruptor.');
check(page.includes('aria-label="Ativar modo escuro"'),'Rótulo inicial comunica próxima ação.');
check(page.includes('gb-theme-toggle-sun')&&page.includes('gb-theme-toggle-moon'),'As duas posições do seletor devem existir.');
check(!page.includes('<iframe id="gb-top-theme-frame"'),'O iframe antigo não pode continuar carregando.');
check(!app.includes('gb-top-theme-frame')&&!app.includes('gbLiquidThemeTimer'),'Remover escuta e temporização da animação.');
check(!app.includes('liquid-theme-progress')&&!app.includes('liquid-theme-settled'),'Remover mensagens e arrasto.');
check(!css.includes('.gb-top-theme-frame')&&!css.includes('gb-theme-preview'),'Remover estilos antigos do controle.');
check(css.includes('.gb-theme-toggle-thumb')&&css.includes('grid-template-columns:1fr 1fr'),'Cápsula clássica com duas posições.');
check(css.includes('.gb-theme-toggle[data-theme="light"]')&&css.includes('.gb-theme-toggle[data-theme="dark"]'),'Ambos os modos devem ter estilos próprios.');
check(css.includes('transition:transform .18s ease'),'O indicador simples anima apenas o deslocamento.');
check(css.includes('@media(prefers-reduced-motion:reduce)'),'Acessibilidade de movimento reduzido.');
check(/sun:'M12 8|sun:'M12|sun:'M12 /.test(ui),'Ícone de sol está incluído na biblioteca.');
check(/moon:'M20 14/.test(ui),'Ícone de lua está incluído na biblioteca.');
check(views.includes("cfgOption('Aparência','Escolha entre modo claro e escuro'"),'Preferências não devem anunciar Liquid Glass.');
check(!app.includes('O controle Liquid Glass agora')&&!app.includes('Arraste-o para alternar'),'A ajuda não deve instruir arrastar.');
check(page.includes('next-282.css?v=20261108-2851')&&page.includes('app.js?v=20261108-2861'),'Cache do app e CSS atualizado.');
check(app.includes("views.js?v=20261108-2851"),'Cache das instruções da tela Aparência atualizado.');
check(!/data-theme="light"[^>]*<\/iframe>/.test(page),'Nenhum iframe de tema no cabeçalho.');

const marker="const topThemeToggle=document.querySelector('#gb-theme-toggle');";
const start=app.indexOf(marker),end=app.indexOf('const gbMobileNav=',start);
check(start>=0&&end>start,'Bloco de renderização do novo botão encontrado.');
const renderFlag=new Function('document','db','icon',app.slice(start,end));
function draw(theme){
 const spans={
  '.gb-theme-toggle-sun':{innerHTML:''},
  '.gb-theme-toggle-moon':{innerHTML:''}
 };
 const attrs={},button={
   dataset:{theme:'light'},title:'',
   setAttribute:(key,val)=>{attrs[key]=String(val)},
   querySelector:key=>spans[key]
 };
 renderFlag({querySelector:key=>key==='#gb-theme-toggle'?button:null},
   {settings:{theme}},
   name=>'<svg class="icon" data-symbol="'+name+'"></svg>');
 return {button,attrs,spans};
}
const light=draw('light'),dark=draw('dark');
check(light.button.dataset.theme==='light'&&light.attrs['aria-checked']==='false','Modo claro selecionado corretamente.');
check(light.attrs['aria-label']==='Ativar modo escuro','Modo claro anuncia próxima ação.');
check(dark.button.dataset.theme==='dark'&&dark.attrs['aria-checked']==='true','Modo escuro selecionado corretamente.');
check(dark.attrs['aria-label']==='Ativar modo claro','Modo escuro anuncia próxima ação.');
check(light.spans['.gb-theme-toggle-sun'].innerHTML.includes('data-symbol="sun"'),'Sol desenhado usando biblioteca.');
check(dark.spans['.gb-theme-toggle-moon'].innerHTML.includes('data-symbol="moon"'),'Lua desenhada usando biblioteca.');

const beginAction=app.indexOf("  'top-theme':"),endAction=app.indexOf("\n  'check-updates':",beginAction);
check(beginAction>=0&&endAction>beginAction,'Encontrar ação padrão de troca de tema.');
const source=app.slice(beginAction,endAction).trim()
  .replace(/^'top-theme':/,'').replace(/,\s*$/,'');
const db={settings:{theme:'light'}};
let saves=0;
const action=new Function('commit','return ('+source+');')(fn=>{fn(db);saves++;});
action();
check(db.settings.theme==='dark'&&saves===1,'Clique alterna claro→escuro uma vez.');
action();
check(db.settings.theme==='light'&&saves===2,'Segundo clique alterna escuro→claro uma vez.');
check(app.includes('function updateSystemAppearance(theme)')&&
      app.includes('document.documentElement.dataset.theme=selected'),
      'Persistência e aparência seguem pelo caminho original.');
new Function(app.replace(/^import\s+.*?;\s*$/gm,'').replace(/^export /gm,''));
new Function(views.replace(/^import\s+.*?;\s*$/gm,'').replace(/^export /gm,''));
check(true,'Módulos app.js e views.js sintaticamente válidos.');
console.log('GB+ 2.8.5: '+count+' verificações aprovadas — flag simples, sol/lua, acessibilidade e persistência.');
