# GB+ 3.0.0 — Plano de homologação visual

**Escopo:** interface de Contas/Cartões, cofrinhos, bancos, cadastro e edição de contas/cartões, compras, categorias, baixas, transferências e seletores. Não há migração de dados, nova tabela ou alteração das funções do domínio financeiro.

## Evidências existentes
- [x] Arquivos JavaScript afetados analisados quanto à sintaxe (módulos de contas, cartões, formulários, Bottom Sheets, ações).
- [x] Regressão específica `gbplus/tests/gbplus-300-visual-regression.mjs` executada em ambiente JS isolado, com validação de renderização de seletores, nomes de campos, ações disponíveis, versão e assets.
- [x] Versão, imports com cache-busting, CSS e Service Worker apontam à candidata 3.0.0 / build 3000.
- [x] Domínio de saldos, geração de lançamentos, compras e faturas não editado.
- [ ] Execução real de todos os testes Node no checkout do repositório.
- [ ] GitHub Actions: execução 42563325658 terminou em **failure antes de iniciar steps**, sem runner nem logs de teste. Não equivale a falha comprovada do teste, tampouco a aprovação.
- [ ] Verificação de interação real no navegador desktop e Android/PWA.
- [ ] Aprovação do responsável e checklist final antes da liberação.

## Roteiro de homologação
1. **Contas:** criar/editar conta bancária, conta personalizada com ícone e cofrinho com objetivo, prazo e valor. Conferir situação ativa/inativa, edição legada e persistência após recarga.
2. **Seletores:** abrir e recolher Bottom Sheet, pesquisar bancos, ícones, objetivos, categorias, contas e parceiros; fechar sem selecionar e confirmar que o formulário mantém valores anteriores. No desktop conferir painel lateral, no celular painel expandido e arrastável.
3. **Saldos:** comparar total antes/depois de transferir dinheiro ao cofrinho e de retirar; conferir que transferências não aparecem como receita/despesa e que não há saldo negativo indevido.
4. **Cartões e faturas:** criar/editar cartão, vincular banco e conta de pagamento, registrar compra parcelada, consultar faturas, informar saldo consolidado e conferir que pagamento só altera saldo após baixa.
5. **Lançamentos:** testar ida e volta pelas três etapas, navegação Próximo/Voltar em dispositivo pequeno, seleção de serviços, categorias, contas e cartões, revisão, gravação e edição.
6. **Baixas e transferências:** conferir selecionar origem/destino, valor e data; impedir origem igual a destino; bloquear saque acima do saldo de cofrinho; não modificar um lançamento antigo ao fechar sem salvar.
7. **Acessibilidade:** teclado, foco, Escape, rótulos, texto longo, 320 px, claro/escuro, contraste e movimento reduzido.
8. **PWA:** atualização de cache após publicação, sem recarregar compulsoriamente formulário em andamento; verificar login, sincronização e restauração de dados existentes.

## Regra de aceitação
Não declarar 'homologado' apenas por sintaxe válida, regressão em mock ou deploy do GitHub Pages. Confirmar testes Node, uso real Android/desktop e ausência de regressões financeiras antes de marcar a versão como aprovada.
