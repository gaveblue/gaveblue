# GB+ 2.4.0 — Cartões, bancos e previsão financeira

Versão: **2.4.0** · Build de referência: **58** · Estado: implementação no GitHub, sujeita à homologação no site e em dispositivos.

## O que entra no aplicativo

- **Bancos e instituições**: catálogo de 12 instituições principais com logos identificados por ISPB, seleção no cadastro de contas e no assistente de primeiro acesso. O usuário pode adicionar e editar instituições personalizadas em Bancos ou em Configurações. As instituições personalizadas têm uma identificação visual por iniciais e cor.
- **Cartões de crédito**: cadastro de apelido, banco, quatro últimos dígitos opcionais, limite, fechamento, vencimento, conta prevista de pagamento e estado ativo/inativo. **Não são solicitados número completo, CVV nem senha**. Não há validação de bandeira Visa/Mastercard (escopo expressamente descartado).
- **Compras no cartão**: registrar descrição, categoria, parceiro, data, valor total e 1 a 36 parcelas. A compra fica ligada ao cartão. É possível abrir o registro de compra a partir do cartão ou do fluxo de Novo lançamento.
- **Faturas automáticas**: cada parcela gera ou atualiza uma fatura do mês, armazenada como um título de despesa em Contas a pagar. A fatura pode ser baixada parcial ou integralmente por uma conta bancária, com a operação existente de baixa. Não edite nem exclua faturas diretamente: corrija as compras ligadas à fatura.
- **Previsão financeira**: 7, 15, 30, 60 ou 90 dias, resumo no Dashboard, calendário de movimentos pendentes, sinalização de projeção negativa, detalhamento por conta e simulação de outro vencimento que **não altera os registros**.
- **Relatório de compras por categoria**: apresenta compras na data original para análise de gastos, separado de pagamentos e recebimentos de caixa.

## Regras contábeis e de cálculo

1. **Uma compra no crédito não é uma saída imediata da conta bancária.** Ela ocupa limite de cartão e cria obrigação futura na(s) fatura(s). O caixa muda somente quando existe uma baixa vinculada a uma conta.
2. **Limite utilizado** = soma dos valores de todas as compras/parcelas do cartão − pagamentos efetivos das faturas. **Limite disponível** = limite cadastrado − limite utilizado. Compras que ultrapassam o limite disponível são rejeitadas.
3. **Parcelas em centavos**: o valor total é dividido com arredondamento inteiro e eventuais centavos residuais são atribuídos às primeiras parcelas. A soma final permanece exatamente igual ao valor original.
4. **Competência**: compras realizadas até o dia do fechamento entram na fatura que fecha naquele mês; após o fechamento, na do mês seguinte. O vencimento ocorre no mesmo mês do fechamento se o dia do vencimento é posterior ao fechamento; caso contrário, no mês subsequente. Os dias são limitados de 1 a 28 por segurança; a regra não inventa adiamentos automáticos de feriados bancários.
5. **Fatura já paga total ou parcialmente**: o sistema impede a exclusão de compras vinculadas até o respectivo pagamento ser estornado. Isso protege o histórico.
6. **Previsão**: parte das contas e dos saldos reais, inclui apenas o valor pendente de cada título, não conta novamente baixas já refletidas no saldo e ignora cancelados. Pendências anteriores a hoje entram na data atual da projeção, sem alterar o vencimento original.
7. **Conta prevista do cartão**: usada para projetar a qual conta caberá pagar novas faturas. A escolha não gera pagamento; a conta efetiva é registrada na baixa. Títulos sem conta permanecem no global e são identificados como não alocados nas projeções por conta.

### Exemplo simples

Cartão de limite R$ 2.000,00 e uma compra de R$ 900,00 em 3 vezes de R$ 300,00:
- Logo após a compra: R$ 900,00 de limite utilizado, R$ 1.100,00 disponível, sem débito em conta bancária.
- Três faturas de R$ 300,00 (competências sequenciais).
- Ao registrar pagamento da primeira fatura de R$ 300,00 em uma conta bancária, o limite disponível aumenta para R$ 1.400,00 e o saldo daquela conta diminui em R$ 300,00. As demais parcelas permanecem pendentes.

## Compatibilidade e segurança

- O documento financeiro continua em **schemaVersion 1**; `banks`, `cards`, `cardPurchases` e as referências dos lançamentos são opcionais. Backups antigos sem esses campos continuam válidos.
- O repositório Supabase foi atualizado para carregar a nova validação do cliente, mantendo o modelo de JSON por usuário. Não houve alteração de RLS, migração SQL ou exclusão de registros.
- A API de persistência `gbplus_save` existente verifica a identidade do usuário, revisão e estrutura básica do documento. Recomenda-se homologar criação de cartões e leitura em outro dispositivo antes de ampla divulgação.
- Os logos usam a biblioteca pública [logos-bancos-br](https://github.com/rzmt/logos-bancos-br), a partir de identificadores ISPB e fontes do Banco Central/Open Finance. **Os logos são marcas dos respectivos bancos.** O GB+ apenas os usa para identificação, sem afiliação. Os arquivos vêm de CDN; quando não disponíveis, uma identificação por iniciais é mostrada. A biblioteca e o uso nominativo constam no README/DISCLAIMER da fonte.
- Cadastros próprios de bancos não permitem URL de imagem arbitrária, para impedir fontes não confiáveis.

## Homologação pendente

- [ ] Testar em Android, iPhone e navegador desktop a abertura das novas telas e a seleção de bancos.
- [ ] Confirmar carregamento dos logos principais e fallback com dispositivo offline.
- [ ] Criar cartão, informar limite e conta prevista, lançar compra única e parcelada, observar faturas no Contas a pagar e registrar baixa real.
- [ ] Confirmar que a mesma conta GB+ mostra cartões, faturas e bancos personalizados em outro dispositivo após sincronizar.
- [ ] Testar pagamento parcial, estorno, edição do cartão, tentativa de exceder limite e exclusão bloqueada de compra paga.
- [ ] Verificar previsão de saldo, histórico, backups e ausência de duplicidade de despesa.
- [ ] Confirmar publicação de **GB+ 2.4.0** e a atualização do PWA pelo usuário.

**Testes de código:** 46 testes lógicos/de regressão verificados por simulação neste desenvolvimento. Isso não substitui os testes ponta a ponta com Supabase e navegador real.

## Limitações intencionais nesta fase

Ainda não há integração automática com emissores de cartões, importação de extratos de fatura, contestação/estorno financeiro automático de compras já pagas, validação de bandeira ou geração de cartão virtual. A data da fatura utiliza os dias configurados pelo usuário; não pressupõe regras de feriados ou processamento interno de cada banco.
