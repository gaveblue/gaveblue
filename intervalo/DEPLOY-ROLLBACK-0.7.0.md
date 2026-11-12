# Intervalo 0.7.0 — Deploy manual e rollback

**GitHub:** gaveblue/gaveblue, branch main, pasta /intervalo.
**URL projetada:** https://gaveblue.com.br/intervalo/
**Supabase exclusivo:** fynaaiazebydorzllwip.

## Entrega efetuada
- Migrações aditivas de esquema operacional e funções transacionais aplicadas.
- Edge Functions restaurant-core, public-menu, platform-control instaladas.
- Assets estáticos separados em catalog.js, public-menu.js, waiter.js, kitchen.js, cash.js, support.js, platform.js, management.js e index.html.
- Fallback global 404.html teve somente a lista de rotas do Intervalo estendida.
- **Não foi executado GitHub Actions**. Commits aplicados diretamente via GitHub.
- Não há evidência externa HTTP de que a CDN/host tenha servido os últimos commits.

## Verificação manual obrigatória
1. No GitHub, confira os arquivos da branch main e o fluxo real de hospedagem de gaveblue.com.br.
2. No navegador, teste /intervalo/ e um refresh profundo, por exemplo /intervalo/intervalo27/garcom.
3. Abra o console e confira imports de arquivos JS, sessão Auth e erros 401/403.
4. Em projeto Supabase Intervalo, verifique Edge Functions e módulo do piloto.
5. Execute roteiro de testes sem produtos de clientes reais ou recebimentos reais enquanto for piloto.

## Rollback de segurança
- Se houver erro JS, restaurar apenas assets /intervalo/ afetados para commit anterior testado.
- Se houver erro da API, redeploy da versão anterior da Edge Function por nome, com JWT exigido nas funções privadas.
- Migrações foram aditivas e tabelas podem conter dados: **não aplicar DROP em rollback automático**.
- Desativar módulos via Super Admin para conter falhas; para cardápio, desligá-lo também cancela a publicação.
- Em emergência, suspender o restaurante piloto, mantendo histórico/auditoria para análise.
- Documentar alterações e reexecutar QA antes de reabilitar.

## Pendências de produção
- Segurança de senha vazada, autenticação E2E, backups, limites de plano Free, monitoramento.
- Empacotar frontend real React/TypeScript com lockfile, sem CDN dependente de runtime.
- Configurar SMTP e redirects de autenticação para todos os convites.
- Testar impressora BG-06 Windows USB/Bluetooth e agente seguro.
- Definir contrato comercial e integração de cobrança antes de ativar assinatura paga.
