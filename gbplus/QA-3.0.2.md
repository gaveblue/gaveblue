# GB+ 3.0.2 — QA do Brand Reveal com Iniciar

Data: 10/11/2026. Alteração solicitada e publicação autorizada pelo responsável. Branch: `feat/gbplus-302-brand-start`.

## Escopo de produção
- Abertura visual substituída pelo Brand Reveal corrigido, extraído do laboratório; B sem recorte da lateral.
- Um único botão de ação **Iniciar**, que remove a sobreposição e deixa o aplicativo real aparecer (login ou dashboard).
- Sem botões **Rever** ou **Pular abertura**, sem navegação para o HTML demonstrativo do laboratório.
- CSS isolado por classes `gbintro-*`, sem alterar classes financeiras existentes.
- Versão 3.0.2, cache PWA `gb-plus-shell-v3002`, recursos exclusivamente locais.

## Evidência de verificação e checklist
- [x] Código da versão 3.0.1 preservado nos módulos financeiros, cadastro, autenticação, Supabase e dados.
- [x] Entrada do aplicativo, manifesto da versão e service worker versionados.
- [x] Verificação estática dos controles, ausência de redirecionamento fictício, contraste do botão e regras de redução de movimento revisadas.
- [ ] Execução confirmada do teste Node `node gbplus/tests/gbplus-302-brand-start.mjs` em runner/checkout integral.
- [ ] Teste visual em celular Android, navegador e PWA instalado, incluindo telas estreitas.
- [ ] Teste visual no desktop, navegação por teclado, modo de movimento reduzido.
- [ ] Login e redirecionamento OAuth, abertura por URL de módulo, recuperação e offline em PWA.
- [ ] Teste de segundo carregamento após atualizar cache e uso do botão **Iniciar** sem bloqueio de interação.

## Política
A autorização do responsável permite publicar com QA parcial; a publicação não comprova homologação integral.
Verificar PR, merge e deploy do GitHub Pages antes de registrar o status como efetivamente publicado.
