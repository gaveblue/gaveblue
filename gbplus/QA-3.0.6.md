# GB+ 3.0.6 — QA da abertura automática com rastros de luz

Data: 10/11/2026. Mudança solicitada diretamente pelo responsável, para produção.

## Escopo da entrega
- Remove somente o botão Iniciar da abertura. Mantém a página, sem troca fictícia de URL.
- Fim automático após cerca de 6 segundos: fade do CSS e remoção garantida pelo temporizador de segurança no JavaScript.
- Abre automaticamente a tela de login ou o painel existente conforme o estado real do aplicativo.
- Elimina margens negativas e padroniza `gap` dos três elementos G, B e + no desktop e celular.
- Dois anéis finos originais, girando em sentidos opostos, recebem trilhas tênues azuis que se dissipam gradualmente ao longo da borda.
- Mantém fundo branco, logo grafite e + azul sem outros efeitos pesados.

## Verificações
- [x] HTML e CSS limitados à abertura; scripts de autenticação e financeiro inalterados.
- [x] Remoção do botão Iniciar e persistência do fallback de remoção da splash.
- [x] Tratamento de callback OAuth, deep link e redução de movimento.
- [x] Classes dos anéis com borda fina e novo efeito de trilha sem disco.
- [ ] Execução confirmada do teste `node gbplus/tests/gbplus-306-auto-glow.mjs` em checkout integral.
- [ ] Testar celular Android e PWA instalado: tempo de transição e ausência de bloqueios no login.
- [ ] Conferir visual em 320/360/390/430 px e desktop: G B + sem cortes, separados de forma harmônica.
- [ ] Testar redução de movimento, offline, sessão existente, OAuth e link direto.
- [ ] Confirmar merge e deploy do GitHub Pages.

**Status:** publicação solicitada; homologação visual e E2E ainda sem evidências.
