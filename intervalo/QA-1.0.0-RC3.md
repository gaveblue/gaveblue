# Intervalo — QA 1.0.0 RC.3 · Chaves de Produtos e layout mobile

Data: 12/11/2026 · Repositório `gaveblue/gaveblue`, branch `main`.

**Status:** correção implementada, sintaxe e renderização simulada aprovadas; **a validação funcional no domínio publicado e em aparelho real ainda depende de teste**. Não classificar a 1.0.0 final como homologada.

## Problema relatado

No módulo `Estoque e Produtos → Produtos`, as chaves `Exibir no cardápio` e `Disponível para venda` ficavam largas/deformadas, sobretudo no formulário de novo produto e em telas pequenas.

### Causa confirmada

A classe legada `.x-form input` aplica `width:100%`, `padding:10px 12px` e margem superior a **todos** os inputs, inclusive `input[type=checkbox].x-toggle`. A regra específica anterior `.x-toggle` tinha especificidade menor e não conseguia restringir a largura de forma confiável.

### Correção aplicada

- Seletores específicos `input[type=checkbox].x-toggle` e `.x-form input[type=checkbox].x-toggle` fixam **46 × 26 px**, sem padding, flex-shrink ou margens do formulário; polegar circular de 20 px.
- Cores: ligado `#FF7600`, desligado cinza discreto, com foco visível por teclado, transição leve e desativação durante salvamento.
- Linhas de configuração com altura mínima de **62 px**: a chave é compacta, mas a linha inteira continua fácil de tocar no celular.
- Texto à esquerda em duas linhas (título e descrição) para as duas opções, distinguindo vitrine pública e venda ao garçom.
- Formulário **Cadastrar produto** recolhido por padrão em `details/summary` com título e descrição.
- Navegação fixa inferior nas quatro áreas do estoque em telas até 700 px: **Insumos, Produtos, Fichas técnicas e Movimentações**; padding inferior para não encobrir conteúdo.
- Layout mobile de produtos em uma única coluna, cartão com foto/ícone, preço e chaves; campos de formulário empilhados.
- Ao alternar uma flag, atualização persistida pela action existente `product_flags`; atualização de tela silenciosa, preservando posição de scroll para evitar o flash de `Carregando...`. Em caso de erro, a chave retorna ao estado anterior e apresenta a mensagem.
- Nenhuma mudança de permissões, schema, preço, disponibilidade, estoque ou regras de backend nesta revisão.

## Testes e evidências

| Teste | Resultado | Limite |
|---|---|---|
| Sintaxe `support.js` após edição | PASSOU | Teste JS estático |
| Renderização simulada da aba Produtos | PASSOU | 6 inputs de toggle (2 cadastro + 2 por produto de teste), chaves independentes |
| Renderização de formulário de novo produto | PASSOU | Presença de `details`, formulário e campos com flag correta |
| Regra de largura e padding | PASSOU | CSS específico supera `.x-form input` |
| Teste visual em Chromium (fixture equivalente) | PASSOU | Largura das chaves 46 px, altura 26 px em 320, 360, 390, 412, 768 e 1280 px |
| Overflow horizontal no fixture | PASSOU | Sem overflow da página nas mesmas larguras |
| Navegação mobile no fixture | PASSOU | Abas fixas no rodapé de 320–412 px |
| Alvo tátil das linhas | PASSOU | Altura de 62 px na simulação |
| Resposta do backend ao alternar em conta real | **NÃO TESTADA** | Requer acesso autenticado no domínio |
| Interface real Android/iPhone e publicação | **NÃO COMPROVADAS** | A existência do commit na `main` não garante propagação |
| Regressão de itens/estoque/categorias/caixa | **PENDENTE E2E** | A revisão foi somente de apresentação e renderização |

## Roteiro de teste do usuário

1. Entrar em `https://gaveblue.com.br/intervalo/inicio` e escolher o restaurante.
2. Abrir **Estoque e Produtos → Produtos**.
3. Verificar chaves pequenas à direita de cada produto, descrições claras à esquerda e barra de navegação inferior.
4. Alterar `Exibir no cardápio`; conferir que o estado se mantém após recarregar.
5. Alterar `Disponível para venda`; conferir que o estado também persiste, de forma independente.
6. Expandir `Cadastrar produto` e confirmar que as duas chaves são compactas e que o formulário cabe na tela.
7. Validar exibição do Cardápio público e seleção no Garçom, respeitando a publicação e categoria ativa.

Referência visual consultada: Apple Human Interface Guidelines, *Toggles* e *Buttons* (switch em linha de ajustes, toque confortável e estados contrastantes).

**Conclusão:** correção visual candidata à homologação pelo usuário; não declarar liberação comercial integral da versão 1.0.0.
