#!/usr/bin/env node
// GB+ 2.8.5 — regressão da navegação inferior Liquid Glass e interruptor simples de tema.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(join(root,path),'utf8');
const app=read('js/app.js');
const css=read('liquid-glass.css');
const page=read('index.html');
const changelog=read('CHANGELOG.md');

assert.match(page,/\.\/liquid-glass\.css\?v=20261108-2811/,'A folha Liquid Glass precisa estar carregada');
assert.match(page,/js\/app\.js\?v=20261108-2851/,'O app precisa usar cache da candidata');
assert.match(app,/const slots=\[\['dashboard','Início','home'\],renderMobileShortcut\(custom\[0\]\),\['new','Novo','plus'\],renderMobileShortcut\(custom\[1\]\),renderMobileShortcut\(custom\[2\]\)\]/,'Atalhos fixos/personalizáveis devem permanecer');
assert.match(app,/gbMobileNav\.classList\.add\('gb-liquid-nav'\)/,'A navegação precisa ativar a lente');
assert.match(app,/nav\.style\.setProperty\('--gb-liquid-left'/,'A lente precisa acompanhar a aba real');
assert.match(app,/state\.accountCardsTab===key/,'Contas e cartões compartilham a rota');
assert.match(app,/gbMobileNav\.style\.setProperty\('--gb-liquid-visible'/,'A lente não deve selecionar aba inexistente');
assert.match(css,/left:var\(--gb-liquid-left,6px\)/,'Deslocamento deve usar a posição medida do botão');
assert.match(css,/prefers-reduced-motion:reduce/,'Deve respeitar movimento reduzido');
assert.match(css,/html\[data-theme=dark\]/,'Tema escuro deve ter tratamento próprio');
assert.match(page,/id="gb-theme-toggle"/,'Alternador normal precisa estar no cabeçalho');
assert.match(page,/data-action="top-theme"/,'O tema deve usar a ação existente');
assert.doesNotMatch(page,/gb-top-theme-frame/,'O antigo iframe não pode ser carregado');
assert.match(app,/topThemeToggle\.querySelector\('\.gb-theme-toggle-sun'\)\.innerHTML=icon\('sun'\)/,'Sol deve vir da biblioteca Lucide');
assert.match(app,/topThemeToggle\.querySelector\('\.gb-theme-toggle-moon'\)\.innerHTML=icon\('moon'\)/,'Lua deve vir da biblioteca Lucide');
assert.match(app,/topThemeToggle\.setAttribute\('aria-checked'/,'Interruptor acessível deve refletir tema salvo');
assert.doesNotMatch(app,/gbLiquidThemeTimer|liquid-theme-progress/,'Remover mensagens e timers do antigo seletor');
assert.match(changelog,/Interfaces aprovadas — incluídas na 2\.8\.0 em 08\/11\/2026/,'Atualização precisa ser documentada');
assert.match(page,/gbplus-version" content="2\.8\.5"/,'A versão autorizada precisa anunciar 2.8.4');
console.log('GB+ 2.8.5: navegação inferior Liquid Glass e alternador simples validados.');
