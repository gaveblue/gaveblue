# QA — Intervalo 1.1.0-rc.31

- Migração aplicada no Supabase: 20261117060846_marketplace_search_products_rc31. Função SQL security invoker; privilégio direto negado a anon/authenticated e concedido ao service_role.
- Consulta real por `coca` e `cóla cóca`: Novo Mundo / Coca Cola. Consulta vazia: zero resultados. Sintaxe JS e cinco testes de correspondência passaram.
- Função marketplace-public v6 ACTIVE; frontend no main; sem recursos pagos novos.
- Pendentes: teste visual Android, propagação do site, conferir busca com produto de outro restaurante, produto oculto ou indisponível, filtros ativos, falha de rede, troca rápida de pesquisa e abertura da loja com busca preenchida. A escala atual limita descoberta e busca a 100 restaurantes; medir carga antes de expandir. Cache da pesquisa de 60s apenas em memória; não é IA semântica. Não homologado em dispositivo real.
