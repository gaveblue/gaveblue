# GB+ 2.8.0 — Faturas de cartões e integração financeira

**Status: candidata em desenvolvimento. NÃO HOMOLOGADA. NÃO PUBLICADA.**
Base: v2.7.8 build 1. A versão pública e os dados de usuários não foram alterados por esta branch.

## Escopo

- Preservar a escolha de categorias e serviços já incorporada às versões 2.7.2–2.7.7: Serviços no topo, lista de serviços automática, ícones, painéis expandidos e seletores de conta/cartão.
- Cartão: mostrar o próximo fechamento, o vencimento previsto e todas as faturas existentes com saldo pendente, situação e acesso aos detalhes.
- **Pagar** diretamente da lista de faturas pelo formulário **Registrar baixa** do GB+; permitir valor parcial, conta e data reais, sem mover o dinheiro antes da confirmação. O saldo bancário só muda após salvar o pagamento.
- A compra normal no cartão continua criando o título da fatura automaticamente, sem criar um título independente por compra.
- **Informar saldo de fatura**: para uma competência cuja fatura existe no banco, mas não possui lançamentos no GB+. Criar **um único título de contas a pagar**, com a conta pagadora e vencimento do cartão. Trata-se de um saldo consolidado, não de uma compra adicional.
- Fatura importada/consolidada e compras individualizadas **não podem coexistir para a mesma combinação cartão + competência**; rejeitar duplicidades antes de qualquer escrita.
- Bloquear alteração de valores/exclusão de fatura com baixa registrada; permitir estorno de baixas pelo histórico já existente.
- Separar categorias de compras de **Fatura de cartão**, reservada à geração automática; não oferecê-la como categoria de despesa avulsa no assistente geral.
- Dados continuam sendo os mesmos campos JSON do projeto, com metadado de origem `cardPurchases[].source = "invoice-balance"`; sem migração SQL, sem armazenar número completo de cartão ou CVV.

## Critérios financeiros de aceite

1. Compra de R$ 120 em três parcelas gera três competências de fatura; o saldo bancário **não** muda na compra.
2. Fatura de R$ 120 entra uma única vez nos compromissos futuros e em Contas a pagar; sua baixa de R$ 70 reduz a obrigação pendente para R$ 50 e o saldo da conta em R$ 70.
3. Informar um saldo consolidado de R$ 200 para um mês sem compras cria uma única fatura; informar o mesmo mês novamente ou cadastrar compras para a mesma competência deve falhar sem alterar o documento.
4. O pagamento parcial libera apenas o limite correspondente ao pagamento confirmado.
5. Sem compras e sem saldo informado, o cartão exibe **datas previstas** sem inventar despesa/valor.
6. O histórico da fatura informa compras/ajustes, pagamentos, cartão e competência; deve permitir estorno, respeitando proteções.
7. Conflitos de salvamento online continuam tratados pelo SupabaseRepository, com transação no documento clonado.
8. Os botões de Próximo/Voltar no lançamento, categorias e serviços, contas e cartões não devem sofrer regressão visual.

## Testes e status

- Arquivo de regressão: `gbplus/tests/card-invoice-balance-regression.mjs`.
- Cenários financeiros verificados em V8 isolado com **o módulo real**: criação, vencimento, não duplicidade, edição, pagamento parcial e bloqueio de exclusão com baixa.
- **Pendentes:** execução nativa de `node gbplus/scripts/homologar-local.mjs` com todas as regressões, inspeção PWA/Android, confirmação de persistência Supabase com usuário de testes e inspeção do fluxo de Contas a pagar com fatura manual e fatura de compras.
- A ausência de execução do Node integral e do teste visual em Android **impede homologação integral**. Não mesclar nem publicar sem autorização de aprovação/liberação.
- Ao homologar e autorizar a publicação, atualizar em conjunto `version.json` (2.8.0 build 1), import de `app.js` em `index.html`, cache `sw.js`, demais referências de módulo afetadas e o CHANGELOG de liberação.

## Atenção à entrada manual

O usuário não deve informar uma fatura já paga no histórico apenas para reproduzir extrato, nem cadastrar depois compras daquele mesmo período sem remover o saldo consolidado. Isso preserva a integridade das despesas e evita contagem dupla.
