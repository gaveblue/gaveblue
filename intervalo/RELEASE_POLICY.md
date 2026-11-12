# Intervalo — Política de versões e publicação

**Decisão do titular em 12/11/2026**

- Não é necessário pedir autorização individual para homologar tecnicamente, publicar ou avançar versões do Intervalo, desde que os testes aplicáveis estejam concluídos e haja evidências verificáveis.
- Homologação não pode ser presumida: testes unitários, banco/RLS, integração/Auth, smoke tests no domínio e regressões precisam ser registrados. Quando algum teste não for possível, marcar a versão como `homologação parcial` e registrar o bloqueio.
- Preparar lançamento manual no GitHub Pages, sem executar ou depender de GitHub Actions.
- Em cada versão, atualizar CHANGELOG, QA, arquivos afetados, SHA de commit e procedimento de rollback.
- É permitido avançar para a próxima versão após cumprir os critérios da anterior, sem aguardar aprovação conversacional.
- **Não modificar GB+** ou seus bancos e não criar recursos pagos sem alinhamento.
- Supabase Intervalo: `fynaaiazebydorzllwip` (projeto separado na organização Primary).
- ORVIA NEWS: projeto `ckpyhnqrlqxwkjvyurle` pausado conforme autorização, preservando dados; não apagar sem necessidade.
- Publicação inicial de 0.1.0: prévia técnica estática em `/intervalo/`; fonte React/TypeScript em pacote separado enquanto o build npm estiver indisponível.
- A publicação estática não substitui os critérios de homologação do aplicativo React definitivo. Sem comprovante de entrega via HTTP/browser, o status é `commit enviado / propagação não verificada`.
- Sem Super Admin inicial cadastrado, nenhum restaurante real pode ser provisionado. Bootstrap exige um usuário Auth real que será designado pelo titular.
- Desenvolvimento contínuo aqui no chat não equivale a execução autônoma entre conversas; para agendamento externo será necessário configurar um processo específico.

## Marcos esperados

0.1.0: infraestrutura, autenticação, segurança multiempresa, painel Super Admin e cadastro inicial de Master.
0.2.0: onboarding, funcionários, seleção de restaurantes e permissões detalhadas.
0.3.0: cardápio digital, produtos e categorias.
0.4.0: mesas, comandas e fluxo do garçom.
0.5.0: cozinha e impressão térmica por agente Windows.
