#!/usr/bin/env node
// GB+ 2.8.0 — regressão estática da integração aprovada. Não substitui teste Android/PWA.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(join(root,path),'utf8');
const app=read('js/app.js');
const css=read('liquid-glass.css');
const toggle=read('lab/liquid-theme-toggle.html');
const page=read('index.html');
const changelog=read('CHANGELOG.md');

assert.match(page,/\.\/liquid-glass\.css\?v=20261108-2811/,'A folha Liquid Glass precisa estar carregada');
assert.match(page,/js\/app\.js\?v=20261108-2821/,'O app precisa usar cache da candidata');
assert.match(app,/const slots=\[\['dashboard','Início','home'\],renderMobileShortcut\(custom\[0\]\),\['new','Novo','plus'\],renderMobileShortcut\(custom\[1\]\),renderMobileShortcut\(custom\[2\]\)\]/,'Atalhos fixos/personalizáveis devem permanecer');
assert.match(app,/gbMobileNav\.classList\.add\('gb-liquid-nav'\)/,'A navegação precisa ativar a lente');
assert.match(app,/nav\.style\.setProperty\('--gb-liquid-left'/,'A lente precisa acompanhar a aba real');
assert.match(app,/state\.accountCardsTab===key/,'Contas e cartões compartilham a rota');
assert.match(app,/gbMobileNav\.style\.setProperty\('--gb-liquid-visible'/,'A lente não deve selecionar aba inexistente');
assert.match(css,/left:var\(--gb-liquid-left,6px\)/,'Deslocamento deve usar a posição medida do botão');
assert.match(css,/prefers-reduced-motion:reduce/,'Deve respeitar movimento reduzido');
assert.match(css,/html\[data-theme=dark\]/,'Tema escuro deve ter tratamento próprio');
assert.match(page,/gb-top-theme-frame/,'O cabeçalho deve apresentar o seletor compacto aprovado');
assert.match(app,/event\.origin!==location\.origin/,'Mensagem deve conferir a origem');
assert.match(app,/frame\.contentWindow!==event\.source/,'Mensagem deve conferir a janela do iframe');
assert.match(toggle,/gb-theme-compact/,'O toggle deve oferecer modo compacto no cabeçalho');
assert.match(app,/clearTimeout\(gbLiquidThemeTimer\)/,'Trocas repetidas devem cancelar a pendência anterior');
assert.match(app,/if\(theme!=='light'&&theme!=='dark'\)return/,'Valores inválidos devem ser rejeitados');
assert.match(toggle,/gbplus:theme-change/,'O toggle deve emitir evento de tema');
assert.match(toggle,/window\.parent\.postMessage/,'O toggle deve comunicar o tema ao aplicativo');
assert.match(toggle,/setOrbit\(p\)/,'A faixa orbital aprovada deve continuar ativa');
assert.match(toggle,/reflectState\(initialLight\)/,'O seletor deve iniciar no tema já salvo');
assert.match(toggle,/canSendTheme=true/,'A inicialização não deve enviar comando de tema ao aplicativo');
assert.match(changelog,/Interfaces aprovadas — incluídas na 2\.8\.0 em 08\/11\/2026/,'Atualização precisa ser documentada');
assert.match(page,/gbplus-version" content="2\.8\.1"/,'A versão autorizada precisa anunciar 2.8.1');
console.log('Liquid Glass 2.8.1: regressão de 23 asserções após alinhamento dos ícones.');
