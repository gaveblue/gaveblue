# QA | Intervalo 1.1.0-rc.8 | Infraestrutura InfinitePay
**Data:** 16/11/2026
**Estado:** homologação técnica parcial; sem cobrança real, sem teste em navegador autenticado.

## Entregas
- Migração no Supabase com 3 tabelas (configuração, tentativas e eventos) com RLS ativo.
- Registro preparado somente para restaurante novo-mundo, sem handle e com enabled=false.
- Edge Function marketplace-payments-admin publicada e ativa com verificação JWT.
- Controle de Master para alteração da InfiniteTag; Gerente autorizado somente para consulta; sem envio de segredo no frontend.
- Card InfinitePay e bottom sheet na Gestão → Loja Online, mantendo os recursos já existentes.
- Código e CSS enviados à main; versionamento da rota e do cache no index para 1.1.0-rc.8.
- GitHub Actions não utilizado.

## Resultados
- PASSOU: migração aplicada.
- PASSOU: 3 tabelas com RLS ativo, sem políticas e sem SELECT para anon/authenticated.
- PASSOU: Novo Mundo habilitado como restaurante, mas gateway InfinitePay desligado, sem credenciais, sem tentativas.
- PASSOU: função administrativa ACTIVE / verify_jwt=true.
- PASSOU: sintaxe JS dos módulos e scripts do index.
- PENDENTE: uso real do card e do bottom sheet no Android/PWA.
- PENDENTE: teste com sessão Master e salvamento de InfiniteTag.
- PENDENTE: implantação do segredo pelo usuário no Supabase.
- NÃO IMPLEMENTADO: geração de links, webhook, payment_check, conciliação e liberação automática de pedidos.
- NÃO VERIFICADO: propagação HTTP em gaveblue.com.br.

**Não classificar como checkout InfinitePay homologado ou pronto para cobrança.**
