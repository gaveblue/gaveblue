# GB+ 3.0.1 — QA da abertura Logo Reveal

Data: 10/11/2026. Liberação expressamente autorizada com QA parcial. Candidata: `feat/gbplus-301-splash-reveal` (PR #122).

## Escopo
- Sobreposição inicial de aproximadamente 2,05 segundos; efeito G → B → + azul; fade final.
- Tema claro/escuro segundo `data-theme` aplicado antes do paint.
- CSS local, sem dependência externa, sem alterações no domínio financeiro, serviços, autenticação ou armazenamento.
- Sem novas permissões, rede, coleta de dados nem migração.

## Verificações executadas
- [x] 16 verificações estruturais realizadas sobre arquivos consultados da branch: presença e ordem do overlay, URLs locais, tempo de animação, formação dos caracteres, temas, saída dupla, cache PWA, manifesto, CHANGELOG e balanceamento de chaves CSS.
- [x] O elemento tem `aria-hidden` e existe uma regra `prefers-reduced-motion` que oculta a splash.
- [x] A animação CSS conclui com `visibility:hidden` e `pointer-events:none`; temporizador de segurança retira o nó após 2400 ms, independentemente do bootstrap.

## Pendências / evidências indisponíveis
- [ ] `node gbplus/tests/gbplus-301-splash-regression.mjs` no checkout integral do repositório.
- [ ] GitHub Actions run [42843996230](https://github.com/gaveblue/gaveblue/actions/runs/42843996230): status **failure**, mas o job não retornou nenhum step e seus logs responderam 404. **Não houve evidência de execução do teste nem de reprovação do código.**
- [ ] Testar abertura no navegador Android, PWA instalado, desktop, modo claro e escuro.
- [ ] Conferir abertura com `prefers-reduced-motion:reduce`, login, redirecionamento institucional, recuperação e offline após cache.
- [ ] Conferir que o overlay não aparece nas navegações internas do SPA e que não cobre telas após seu término.
- [ ] Revisão e homologação para publicar a versão.

## Regra de liberação
Não confundir código preparado ou sucesso de verificações estruturais com homologação. Responsável autorizou publicar em 10/11/2026 apesar das pendências; não declarar homologação completa. Confirmar merge e deploy antes de registrar publicada.
