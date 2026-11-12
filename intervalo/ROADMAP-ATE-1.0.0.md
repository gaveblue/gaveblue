# Intervalo — Roadmap até versão 1.0.0

## Estado da estrutura
- 0.1–0.2: base/Auth, Super Admin, equipes, ACL, login opcional CPF. Existem pendências de teste E2E.
- 0.3: cardápio/categorias/produtos, administração e publicação pública em modo consulta.
- 0.4: mesas/comandas/garçom com operações transacionais de abertura, lançamento, envio e status.
- 0.5: cozinha com fila de atualização manual; apenas scaffold de agente Windows offline.
- 0.6: esquema estoque e fichas, caixa manual, pagamentos parciais e fechamento.
- 0.7: toggles no Super Admin, planos em prévia sem cobrança, relatórios gerenciais simples.

## Bloqueios reais antes de 1.0
1. Concluir o primeiro login do Master do Intervalo 27 e testar funções em browser.
2. Corrigir problemas identificados nos testes dos módulos e ativação de contas, incluindo e-mails de convite e senhas.
3. Fazer teste com pelo menos dois restaurantes e três papéis de funcionários, tentando acessar URLs de outro tenant.
4. Migrar UI estática para pipeline React+TypeScript com build/lockfile e publicação manual reproduzível.
5. Adicionar Realtime autorizado por restaurante, incluindo reconexão e idempotência de eventos.
6. Implementar adicionais como seleção de pedido validada pelo backend, com snapshots de preço.
7. Implementar baixa de estoque por movimentação de venda e ficha técnica; testar estornos e ajustes.
8. Definir fluxo de cancelamento/estorno com permissões reforçadas, auditoria e reversões.
9. Instalar e testar a B&G BG-06 no Windows, validar ESC/POS se for suportado; autenticar agente sem service_role.
10. Cobrança de assinaturas, planos e Pix somente após escolha de provedor, contratação e QA financeiro.
11. Ajustar proteção contra senhas comprometidas, rate limiting, backups, logs de auditoria e métricas.
12. Testar navegação direta/refresco, PWA, offline, compatibilidade Android e demais navegadores.
13. Definir identidade da marca e confirmar disponibilidade marcária no INPI antes do lançamento comercial.

**Regra:** não confundir implantação de estrutura e testes SQL com homologação comercial. Avançar por novas versões conforme evidências, sem usar GitHub Actions e sem alterar o GB+.
