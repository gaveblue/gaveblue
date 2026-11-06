# GB+ 2.4.9 — Saldos por conta e extrato diário

**Código:** versão 2.4.9 · compilação 67 · 06/11/2026.
**Status:** implementado no GitHub, pendente de publicação e homologação em navegador/aparelho real.

## O que mudou

1. No cartão principal de saldo, uma faixa horizontal mostra os ícones, os nomes e os saldos das contas cadastradas. O saldo total consolidado permanece em destaque e sua composição não foi alterada.
2. Ao tocar no ícone, abre o extrato individual da conta, com o saldo atual.
3. O extrato agrupa os registros por dia, exibindo saldo no início, créditos, débitos e saldo no fim do dia.
4. O resumo mostra os totais acumulados de entradas e saídas da conta.
5. Transferências internas aparecem como débito na origem e crédito no destino.

## Regras de saldo

- Base: saldo inicial cadastrado + baixas efetivamente registradas + transferências internas até a data consultada.
- Não entram títulos pendentes, compras no cartão ainda não pagas nem previsões.
- Cada dia com movimentos apresenta abertura, movimentos e fechamento. O dia atual também aparece quando não há movimentos.
- Créditos e débitos incluem transferências, que não são receita/despesa no fluxo geral.
- O extrato é calculado sobre os dados existentes, sem alterar registros ou saldos.
- O esquema anterior não registra a data de abertura do saldo inicial; não se pode afirmar o saldo histórico antes da origem desse valor.

## Implementação

- Novo módulo: js/daily-statement.js.
- js/views.js: ícones das contas sob o saldo no dashboard e na visão de fluxo.
- js/forms.js: extrato por dia no modal de movimentações.
- styles.css: rolagem horizontal e extrato responsivo.
- version.json, index.html e sw.js: versão 2.4.9, build 67.
- tests/gbplus-daily-statement.test.cjs: onze testes simulados aprovados.

## Homologação pendente

- [ ] Confirmar publicação no domínio do GB+.
- [ ] Testar a faixa de ícones no celular e desktop, incluindo várias contas do mesmo banco.
- [ ] Conferir saldo por conta contra a tela Contas bancárias.
- [ ] Conferir crédito, débito, transferência, dia sem movimentos, baixa parcial e estorno.
- [ ] Verificar acessibilidade, modo escuro e modal com muitos dias.
- [ ] Confirmar isolamento dos registros por usuário e ausência de alterações financeiras.

## Próxima versão

A 2.5.0 implementará a importação manual de extratos e a conciliação bancária com sugestões de lançamentos ausentes, revisão e confirmação explícita. PDF e Excel serão integrados por fases, conforme segurança e confiabilidade do parser. Ver IMPORTACAO-2.5.0.md.

## Compilação 66

- Cartão preto: saldo geral consolidado acima dos cartões das contas.
- Cada conta ativa exibe símbolo do banco, nome e saldo individual em reais.
- Rolagem horizontal para várias contas, sem transformar a interface em uma lista extensa.
- Os valores são calculados com a mesma função de saldo usada na tela de contas.
- Cache do PWA atualizado e 11 testes específicos simulados aprovados.

## Compilação 67 — Pílulas compactas de bancos

- [x] Transformar a apresentação do saldo individual em pílulas pequenas e arredondadas, seguindo a referência visual fornecida.
- [x] Mostrar somente o logo circular do banco e o valor da conta lado a lado. O nome completo da conta permanece no título e na descrição acessível.
- [x] Preservar o saldo consolidado de todas as contas no topo do cartão preto, sem alternar o valor ao selecionar uma pílula.
- [x] Preservar o comportamento existente: tocar na pílula abre **Movimentações da conta**, com o extrato diário.
- [x] Manter a rolagem horizontal, o formato responsivo, o suporte a contas de diferentes bancos e o tratamento de saldo negativo.
- [x] Atualizar manifesto para 2.4.9 / build 67, versões dos recursos e cache do PWA.
- [x] Executar 21 testes simulados específicos de extrato, seleção, apresentação e atualização, sem erros.
- [ ] Homologar a legibilidade das pílulas com diferentes valores e o clique no Android/iOS.
- [ ] Confirmar que a versão 67 foi entregue pelo site em produção.

**Fora do escopo desta compilação:** seleção de conta para substituir o saldo principal, botão de voltar, modificações de extrato e novas funções financeiras. A solicitação mais recente foi manter o clique para abrir as movimentações.

Nenhum saldo, pagamento, transferência ou conta foi alterado na base de dados. O ajuste foi somente de apresentação, testes, manifesto e cache.
