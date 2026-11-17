# QA — Intervalo 1.1.0-rc.28
- Migration aplicada ao projeto Intervalo, colunas confirmadas com RLS ativa.
- Funções implantadas: restaurant-core v15, public-menu v6 e marketplace-public v4; código registrado no repositório.
- Análise sintática JS e teste simulado de agrupamento, menor preço e separação por categoria aprovados.
- Pendências: teste real Android e propagação; cadastrar três variações com mesmo nome e categoria (P/M/G), conferir card único, menor preço, seleção de cada tamanho, total, carrinho, comanda, cozinha e caixa; ocultar uma opção, verificar sumiço da opção; conferir fichas técnicas independentes e isolamento entre restaurantes. Testar delivery interno (variações aparecem como produtos separados), checkout e catálogo de consulta.
- Produto simples existente deve receber uma variação no formulário de edição para entrar no agrupamento. Não converter automaticamente produtos existentes. Não há transferência automática de fichas técnicas ou adicionais.
- Nenhum pedido real criado neste QA. Não homologado.
