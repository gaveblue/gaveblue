# GB+ 2.4.5 — Painel mais limpo, gráficos móveis e bancos com logos

**Versão de código:** 2.4.5 · **Compilação:** 59 · **Data de registro no GitHub:** 05/11/2026.

Esta atualização é um ajuste pontual da 2.4.0. O salto numérico para **2.4.5** foi deliberado: não houve criação de lançamentos reais, reinicialização de contas nem alteração da estrutura do documento financeiro.

## Ajustes realizados

1. **Dashboard original preservado.** O cartão “Seu futuro financeiro” foi movido do topo para imediatamente antes do painel “Fluxo de caixa”, depois dos indicadores de visão geral. O cabeçalho, a navegação, os indicadores e a seção de vencimentos permanecem no mesmo lugar.
2. **Fluxo de caixa com três visualizações.** Na tela Fluxo de caixa, além das barras de receitas e despesas, o usuário pode optar por linhas comparativas ou por resultado líquido (receitas efetivamente recebidas menos despesas efetivamente pagas) por período. Os filtros de período e granularidade existentes continuam funcionando. O resultado líquido **não é** o saldo bancário.
3. **Visualização mobile.** O contêiner do gráfico agora limita sua largura ao painel, com rolagem horizontal **apenas dentro do gráfico** quando necessário. O desenho mobile mostra os últimos seis períodos; a tabela abaixo mantém o histórico do período selecionado. O mesmo ajuste evita que cabeçalhos, controles e tabelas empurrem a página inteira lateralmente.
4. **Logos locais dos 12 bancos principais.** Foram incluídos arquivos SVG no próprio repositório em `assets/banks/<ISPB>.svg`, eliminando a dependência anterior da CDN. O catálogo continua mostrando iniciais quando o banco não possui logo.
5. **Seleção visual de bancos.** Nos formulários de cadastro de conta financeira, de cartão de crédito e no assistente inicial, o usuário pode tocar no logo do banco. O seletor nativo permanece disponível para consultar todas as instituições ou escolher um cadastro personalizado. A tela “Bancos” e a configuração existente continuam acessíveis.
6. **Cache do PWA atualizado.** Os 12 SVGs foram adicionados aos 73 assets controlados pela versão. A atualização segue o fluxo existente de publicação/download, sem apagar dados de usuários.

## O que foi mantido

- Nenhuma mudança em cálculos de saldos, baixa de títulos, lançamentos, cartões e faturas.
- Nenhuma alteração na autenticação, no modelo de dados do Supabase ou nas permissões financeiras.
- A versão 2.5.0 **não foi iniciada**; fica reservada para a evolução maior solicitada pelo usuário.

## Testes e homologação

**52 testes em ambiente JavaScript simulado passaram**, somando regressões de autenticação, perfil, primeiro acesso, PWA, cartões, faturas, interface e seis verificações específicas da 2.4.5.

Ainda é necessário confirmar em **navegador móvel real**, especialmente:
- [ ] A projeção fica abaixo dos indicadores e imediatamente antes do fluxo de caixa.
- [ ] Barras, Linhas e Resultado podem ser alternados sem perda de filtros.
- [ ] Em 320 px, 360 px e 390 px de largura, o gráfico permanece dentro da tela; a rolagem é apenas interna.
- [ ] O histórico completo da tabela continua acessível deslizando horizontalmente.
- [ ] Os 12 logos aparecem nos cadastros e listas de contas/cartões; o seletor funciona também com bancos personalizados.
- [ ] O PWA instala/atualiza o pacote de logos, e as contas e faturas existentes permanecem intactas.
- [ ] O site apresenta a versão 2.4.5 após o deploy.

**Origem dos logotipos:** [assets/banks/SOURCE.md](./assets/banks/SOURCE.md). As marcas pertencem às respectivas instituições.
