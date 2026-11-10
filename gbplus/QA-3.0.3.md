# GB+ 3.0.3 — revisão do Brand Reveal

Data: 10/11/2026. Correção visual solicitada pelo responsável, com publicação em produção autorizada.

## Alterações previstas
- Aproximar o cartão do símbolo **+** do B, sem voltar a cortar as letras.
- Animar os dois anéis do fundo com translação/rotação suave e pulso lento.
- Corrigir seletor duplicado do texto de carregamento e separar “Preparando sua experiência” de “GB+” em todas as larguras.
- Corrigir seletor duplicado do feixe de luz e o SVG do ruído de fundo.
- Manter o botão **Iniciar** e todas as rotas, lançamentos e dados financeiros sem alterações.

## Verificações
- [x] Escopo isolado na classe de abertura `gbintro-*` e `#gb-splash`.
- [x] Código da interface financeira e scripts de autenticação inalterados.
- [x] CSS com animação contínua e `prefers-reduced-motion`.
- [x] Conteúdo da legenda permanece em dois spans separados com espaço por flex.
- [ ] Execução confirmada de `node gbplus/tests/gbplus-303-splash-regression.mjs` via runner.
- [ ] Captura visual em Android (incluindo PWA instalado), largura de 320 px e desktop.
- [ ] Verificar fechamento via Iniciar, retorno de login/OAuth, atualização do cache offline.
- [ ] Confirmar merge e implantação do GitHub Pages.

A publicação foi autorizada, mas não implica homologação visual integral.
