# Intervalo 0.2.0 — publicação manual e rollback

**Repositório oficial da prévia:** https://github.com/gaveblue/gaveblue
**Diretório isolado:** \`intervalo/\`.
**URL prevista:** https://gaveblue.com.br/intervalo/
**Rota piloto:** https://gaveblue.com.br/intervalo/intervalo27/gestao
**Publicação:** commits aplicados na branch \`main\` via API do GitHub, sem executar GitHub Actions.
**Validação HTTP externa:** não comprovada, requer teste humano/browser ou hospedagem acessível.

### Arquivos frontend
- \`intervalo/index.html\` com roteamento e seleção de restaurantes.
- \`intervalo/management.js\` com onboarding, equipe e controles de acesso.
- \`404.html\`: fallback exclusivo de rotas \`/intervalo/*\` (sem tocar nos outros sistemas).

### Backend no projeto Supabase INTERVALO (não o GB+)
- Tabelas \`restaurant_settings\` e \`restaurant_member_module_access\`, com RLS.
- Edge Functions \`restaurant-team\` v3, \`admin-provision\` v2, \`activate-master\` v1.
- SQL versionado em \`intervalo/source/supabase/migrations\`.
- Chaves de serviço **nunca** no navegador/repositório. Não compartilhar senha.

### Como testar
Entrar no aplicativo, selecionar restaurante ativo, abrir Gestão. Se o Master estiver pendente, concluir login de ativação. Salvar dados, cadastrar funcionário e verificar status. Testar revogação e outro tenant.

### Rollback
1. Inspecionar commits com git compare e restaurar apenas \`intervalo/index.html\` e \`404.html\` das versões anteriores quando necessário; retirar \`intervalo/management.js\` do deploy, se necessário.
2. Para funções, redeploy da fonte versionada no commit anterior com mesmo nome, verificando \`verify_jwt=true\`.
3. Evitar remover as tabelas novas no Supabase: contêm dados de cliente após ativação. Migrações reversas exigem backup/plano e evidências.
4. Reexecutar QA após rollback e atualizar CHANGELOG.

### Regra
Publicar automaticamente quando houver confiança técnica, mas **não declarar homologado** enquanto testes essenciais não passarem. O usuário dispensou aprovação por versão; isso não elimina a necessidade de segurança e evidências.
