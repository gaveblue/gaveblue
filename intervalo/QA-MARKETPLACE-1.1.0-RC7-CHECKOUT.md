# Intervalo · QA do checkout 1.1.0-rc.7
**Data:** 16/11/2026
**Status:** implementação frontend em `main`; homologação técnica parcial. Não foi possível testar o site publicado com navegador autenticado.
**Escopo:** `/intervalo/checkout?loja=<slug>` e carregamento inicial desta rota.

## Entrega
- Criado `marketplace-checkout-rc7.js`: substitui visualmente o formulário longo da rc.4, sem alterar o contrato de `marketplace-public` ou `marketplace-online`.
- Criado `marketplace-checkout-rc7.css`: layout mobile-first com cabeçalho compacto, cards brancos, ícones SVG internos, resumo de valores e CTA fixo no rodapé.
- **Bottom sheets nativos (<dialog>)** para Endereço de entrega, Contato e Pagamento, com grip arrastável (para cima expande, para baixo fecha), fechamento por botão, toque fora e Escape. Conteúdos permanecem no formulário único do checkout, de modo que `FormData(form)` inclua os campos mesmo quando os painéis estejam fechados.
- Folhas com início parcial da altura da tela, expansão até altura visível e adaptação quando o teclado móvel aparece; ouvintes de `visualViewport` removidos após fechamento.
- Compra sem cadastro preservada; perfil de cliente e endereços salvos continuam opcionais.
- Validação de endereço/nome/celular abre o bottom sheet correspondente com erro legível dentro dele.
- Modalidade de retirada esconde acesso ao endereço; delivery exibe seleção de zona, CEP, rua e demais dados. Frete e total continuam calculados no servidor.
- Botões separados de calcular e confirmar (a confirmação só é exibida depois da cotação); aceite obrigatório de termos; idempotência do checkout; redirecionamento por token de rastreio.
- Alterada a rota em `intervalo/index.html` para importar `marketplace-checkout-rc7.js?v=1.1.0-rc.7`; abertura inicial também mostra skeleton próprio em vez do loader genérico.
- Nenhuma mudança em Supabase, pedidos existentes, estoque, caixa, permissões, times ou flags de marketplace. GitHub Actions não utilizado.

## Verificações executadas
| Verificação | Resultado |
|---|---|
| Compilação sintática do módulo JS | PASSOU |
| Compilação sintática dos scripts inline do index | PASSOU |
| Renderização simulada com loja habilitada e desabilitada | PASSOU |
| Três `dialog` e seus inputs dentro do formulário único | PASSOU por inspeção de HTML renderizado |
| Campos de entrega, contato, consentimento e pagamento preservados | PASSOU por inspeção |
| Quantidade de itens/carrinho e URL de retorno à loja | PASSOU por inspeção |
| Simulação da sequência `store` → `quote` → `place` (retirada) | PASSOU com respostas simuladas |
| Valor final refletido no resumo e rodapé; redirecionamento para `/pedido/:token` | PASSOU em simulação |
| Erros direcionados ao painel relevante | PASSOU por inspeção |
| Teste real de entrega + frete e cidade/UF | PENDENTE |
| Teste real em Android, teclado, arraste/fechar/reabrir bottom sheets | PENDENTE |
| Teste de compra real no Supabase e status no restaurante | PENDENTE |
| Propagação HTTP no domínio `gaveblue.com.br` | NÃO VERIFICADA |

## Conferência manual sugerida
1. Abrir `https://gaveblue.com.br/intervalo/loja/novo-mundo`, adicionar um produto e finalizar.
2. Ver skeleton próprio do checkout e cards em ordem: modalidade, dados, itens, consentimento, resumo.
3. Abrir os bottom sheets Endereço, Contato e Pagamento. Arrastar para cima/baixo, fechar com X e conferir se as alterações permanecem.
4. Para retirada, editar contato, selecionar Pix e calcular total; verificar CTA fixo, total e aceite de termos.
5. Para entrega, selecionar região e preencher CEP/endereço, validar frete e retorno do servidor.
6. Confirmar somente em ambiente de testes; conferir encaminhamento para acompanhamento.
7. Verificar a atualização de cache da versão 1.1.0-rc.7.

**Conclusão:** pronto no repositório para testes manuais após publicação/propagação. Não classificar como homologado em produção.
