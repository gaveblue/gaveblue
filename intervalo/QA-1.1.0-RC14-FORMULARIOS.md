# Intervalo — QA 1.1.0-rc.14 | Formulários e teclado móvel
Data: 2026-11-16

## Objetivo
Unificar digitação de valores em reais (R$), CPF, CNPJ, CEP e celular nos formulários do Intervalo, com adaptação da viewport ao teclado virtual e navegação entre campos.

## Escopo
- Módulos inspecionados: Gestão, Conta, Cardápio, Estoque/Produtos, Mesas, Garçom, Caixa, Loja Online, Checkout, Cliente, Pix manual e login.
- `form-enhancements-rc14.js` é importado pelo `index.html` e registra eventos por delegação. Isso cobre formulários dinâmicos, diálogos e bottom sheets presentes e futuros com nomes de campo reconhecidos.
- `form-enhancements-rc14.css` mantém o campo focalizado acessível no Android: fonte com mínimo de 16 px, espaço para rolagem, rolagem conforme `visualViewport` e ocultação temporária de menus fixos durante a abertura do teclado.
- Dinheiro: máscara enquanto digita com centavos e milhares no padrão `1.234,56`; aceita cola em BRL e deixa o campo vazio quando apagado. `type=text` com `inputmode=decimal`.
- CPF `000.000.000-00`; CNPJ `00.000.000/0000-00`; CEP `00000-000`; telefone móvel `(27) 99999-9999` e fixo `(27) 3333-4444`.
- CEPs de faixa na Loja Online tiveram `maxlength` ajustado no foco (8 → 9 com hífen); envio continua removendo pontuação.
- Campo login misto e-mail/CPF trata CPF numérico, mas aceita e-mail sem formatação permanente. Chave Pix fica **fora da máscara**, pois pode ser e-mail, EVP, CPF, CNPJ ou telefone.
- Campos de quantidade de estoque, movimentação em kg/unidade, capacidade e tempo **não** recebem máscara monetária.
- Conversão para centavos atualizada em `support.js`, `catalog.js`, `cash.js` e `online-management-rc1.js` para aceitar milhares com pontos e decimais com vírgulas sem alterar cálculos/contratos.
- Cache de rotas de Caixa, Cardápio, Estoque/Mesas e Loja Online atualizado para rc.14; acessos públicos, checkout e login usam o módulo global no `index.html`.

## Testes técnicos realizados
- 14 testes puros de formatação de CPF, CNPJ, CEP, celulares e valores, inclusive colagem `R$ 1.234,56`: **14/14 OK**.
- 19 testes de classificação de campos dinâmicos: **19/19 OK**. Exemplos negativos: senha, quantidade, valor de estoque, Pix aleatório, busca, assentos.
- Conversores de cada um dos quatro módulos verificaram `1.234,56` → **123456 centavos**.
- Análise sintática dos quatro módulos de conversão: **OK**.
- Não foram executados lançamentos ou cobranças reais, tampouco alteradas tabelas, permissões ou Edge Functions.
- **Pendente:** execução visual Android (Galaxy/Chrome), teclado abrindo em bottom sheets, rolagem, foco nos campos, restauração das barras inferiores, autofill e publicação efetiva do domínio. Os testes de funções puras não substituem teste de navegador.
- O código foi atualizado no repositório `gaveblue/gaveblue` branch `main`. GitHub Actions **não** foi utilizado.

## Roteiro curto de homologação
1. **Estoque > Produtos:** cadastrar/editar preço de `24,90`; digitação de `123456` mostra `1.234,56` e persiste o valor correto. Quantidade de insumo mantém 3 casas decimais.
2. **Caixa:** abrir/fechar com `0,00`, valor manual com `1.234,56`, apagar com Backspace e conferir total em centavos no extrato de caixa.
3. **Loja Online:** mínimo e frete formatados enquanto digita; CEPs inicial/final são aceitos com hífen e transmitidos sem pontuação.
4. **Dados do restaurante / Minha Conta:** telefone e CPF recebem pontuação durante a digitação; dados permanecem corretos no servidor.
5. **Checkout de cliente e Minha Conta do cliente:** CEP e telefone formatados. Envio remove pontuação antes da validação.
6. **Bottom sheet no Android:** tocar no último campo, abrir teclado, confirmar que campo segue visível e a barra inferior não cobre o formulário; avançar campos com teclado e voltar após fechar.
7. **Pix manual:** chave Pix não recebe formatação indevida.
8. **Login:** entrar por CPF formatado e por e-mail com números, sem corromper e-mail.

**Status:** QA técnico parcial aprovado. Não declarar homologação mobile/produção até teste no aparelho.
