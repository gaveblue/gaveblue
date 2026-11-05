# Origem dos logos e dados bancários

**Atualização do catálogo:** 05/11/2026 (GB+ 2.4.6).

A interface possui **78 instituições pré-cadastradas em ordem alfabética**, identificadas por nome de uso corrente, código de compensação **COMPE** (três dígitos), identificador **ISPB** (oito dígitos) e arquivo local de logo SVG. Bancos personalizados não recebem código oficial inventado: são exibidos por nome, iniciais e cor.

**Fonte do catálogo e dos arquivos:** [rzmt/logos-bancos-br](https://github.com/rzmt/logos-bancos-br), especialmente `data/bancos.json` e `logos/svg/`. O projeto de origem reconstrói sua lista a partir dos participantes do STR do **Banco Central do Brasil**, dos participantes Pix e de fontes visuais do **Open Finance Brasil** e sites oficiais. A snapshot incorporada ao GB+ é a lista consultada em 05/11/2026; informações bancárias podem mudar com o tempo.

Os **78 SVGs** foram armazenados localmente em `assets/banks/<ISPB>.svg` para evitar a dependência de serviço CDN e oferecer suporte após o download do PWA. Alguns arquivos possuem identificador de logo distinto do ISPB da instituição, quando a fonte original compartilha marca com um sistema cooperativo; o campo `logoIspb` no catálogo resolve essa situação. O arquivo da instituição Guanabara foi saneado para remover declarações DTD e manter apenas a imagem PNG incorporada.

**Marcas:** nomes, símbolos e logotipos são propriedades dos titulares e não são abrangidos automaticamente pela licença do código do GB+. Seu uso neste aplicativo tem finalidade meramente identificadora e não significa representação, afiliação, autorização comercial ou integração com os bancos. Detalhes de provenance e solicitações de correção/remoção: [DISCLAIMER.md do projeto de origem](https://github.com/rzmt/logos-bancos-br/blob/main/DISCLAIMER.md).

A pesquisa e a escolha de uma instituição no GB+ são locais. Nenhuma senha, token ou dado bancário é solicitado para exibir um logo.
