# GB+ 2.4.6 — 78 instituições financeiras e seleção por busca

**Versão no GitHub:** 2.4.6 · **Build:** 60 · **Data:** 05/11/2026.

## O que foi entregue

- **78 instituições financeiras** em ordem alfabética, com código bancário **COMPE de três dígitos** e **ISPB de oito dígitos**, a partir da lista consultada no projeto `rzmt/logos-bancos-br`, derivada das bases do Banco Central do Brasil. Os bancos previamente utilizados no GB+ mantêm seus IDs internos para não perder vínculos de contas e cartões.
- Inclusão de **Sicoob (756), Banco do Nordeste (004), Banco Pan (623)** e dezenas de outras instituições, como Banestes, Banrisul, Banese, Banco da Amazônia, BV, Banco XP, Mercado Pago, Agibank e Cora.
- **78 logos SVG locais** em `assets/banks/<ISPB>.svg`, adicionados ao pacote de atualização do PWA. Um banco personalizado sem logo próprio continua identificado pelas iniciais e cor.
- **Busca instantânea por nome, COMPE, ISPB e alguns apelidos**, incluindo o termo informal “Sicobi” para Sicoob. O conjunto de ícones na faixa horizontal é filtrado conforme a digitação.
- Aplicação da seleção nos formulários de **Contas bancárias, Cartões de crédito e configuração inicial**. A lista HTML tradicional permanece disponível como opção secundária em “Ver lista completa de bancos”.
- Página **Bancos e instituições** com busca e exibição dos códigos ao lado do nome, incluindo instituições personalizadas e acesso para cadastrá-las.

## O que esta versão NÃO faz

- Não conecta automaticamente o GB+ a contas bancárias externas.
- Não importa extratos ou planilhas na versão 2.4.6.
- Não altera saldos, títulos, baixas, contas, cartões ou dados financeiros existentes.
- Não faz validação de bandeira de cartão (solicitação anterior expressamente descartada).

## Projeto preparado para a 2.5.0

O arquivo `js/bank-import-preview.js` implementa um **protótipo read-only** de interpretação de OFX e CSV e sugestão de conciliação por conta. O arquivo **não é importado pela aplicação principal, não é servido como nova tela e não grava dados no Supabase**. O desenvolvimento da interface, validação de planilhas XLSX, armazenamento e confirmação explícita fica para a **2.5.0**.

Leia [IMPORTACAO-2.5.0.md](./IMPORTACAO-2.5.0.md) para o fluxo de implantação proposto.

## Fonte dos códigos e logos

[rzmt/logos-bancos-br](https://github.com/rzmt/logos-bancos-br) · dados `data/bancos.json`, consultados em 05/11/2026. A fonte documenta participação das instituições na lista STR do Banco Central, código COMPE, ISPB e origem do logo no Open Finance ou site oficial. Os nomes e marcas são de seus respectivos titulares.

## Homologação pendente

- [ ] Confirmar **2.4.6 / build 60** na interface após publicar.
- [ ] Buscar Sicoob / Sicobi / 756, Nordeste / 004 e Pan / 623 no cadastro de cartões.
- [ ] Confirmar filtragem da faixa horizontal e seleção por toque com teclado virtual do celular.
- [ ] Confirmar ordem alfabética e códigos na página Bancos.
- [ ] Cadastrar uma conta com instituição nova e confirmar que seu logo aparece depois de salvar, inclusive após relogar.
- [ ] Testar contas e cartões antigos sem alterações de saldos/vínculos.
- [ ] Instalar o pacote de logos via PWA, verificar imagens offline e ausência de rolagem horizontal da página.
- [ ] Executar os testes de importação com arquivos bancários de exemplo e conferir que nenhuma alteração acontece sem confirmação.

Os testes automatizados executados em ambiente simulado não substituem homologação móvel nem sincronização real com Supabase.
