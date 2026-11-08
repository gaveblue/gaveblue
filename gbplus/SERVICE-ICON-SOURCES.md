# GB+ 2.6.0 — origem das marcas de serviços

**Finalidade:** apresentar marcas exclusivamente para identificar despesas no aplicativo, sem parcerias, acesso a contas, cobrança integrada nem vínculos comerciais.

Os pictogramas monocromáticos abaixo foram extraídos dos caminhos vetoriais disponíveis no repositório público Simple Icons em 06/11/2026. A biblioteca disponibiliza seus arquivos sob licença geral CC0, **mas ressalva expressamente que as marcas podem possuir direitos e licenças individuais**; seu uso não implica autorização das empresas nem endosso. Referências:
- https://github.com/simple-icons/simple-icons
- https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md

**Marcas com símbolo local incorporado (13):** Netflix, HBO Max, Apple TV, Paramount+, Crunchyroll, Spotify, Deezer, Apple Music, YouTube Music, iFood, aiqfome, Uber e iCloud.

**Identificação textual neutra, sem logotipo inventado (13):** Disney+, Prime Video, Globoplay, YouTube Premium, 99Food, Plus Delivery, Rappi, 99, inDrive, Google One, Microsoft 365, Canva e ChatGPT.

- Artefato em `js/service-brand-paths.js`. Origem: `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/<slug>.svg`.
- Apenas paths vetoriais; sem JavaScript, recursos externos, tracking ou consultas de imagem durante a navegação.
- SVGs exibidos em monocromia e dimensão reduzida (17px). Nenhuma marca foi redesenhada para simular identidade oficial.
- Uso de marcas requer reavaliação periódica das diretrizes e do licenciamento individual, sobretudo antes de monetização/marketing.
- Se uma marca for retirada ou o asset falhar, o nome e as iniciais neutras devem continuar visíveis.
- Catálogo de serviços é só atributo opcional do título; não cria assinatura, parceria ou recorrência sem consentimento.

## Requisitos do produto

As 26 entradas originais permanecem no catálogo estável de IDs. A associação de serviço só é gravada após confirmação do lançamento e aceita remoção/edição. Valores e datas não são adivinhados, e serviços recorrentes são opcionais.

## Atualização de cores na versão 2.6.2

O módulo `js/service-brand-colors.js` adiciona tons de referência das marcas. A presença de cor **não deve ser interpretada como SVG oficial**: apenas as 13 marcas citadas acima têm símbolos vetoriais incorporados. Os outros serviços continuam com monogramas em iniciais; as cores são aproximações da identidade pública onde não há metadados do Simple Icons.

Fonte de metadados da biblioteca consultada em 06/11/2026: https://github.com/simple-icons/simple-icons/blob/develop/data/simple-icons.json.

Netflix usa vermelho `#E50914`; iFood usa `#EA1D2C`; Spotify usa `#1ED760`. Para marcas sem fonte confiável, como Plus Delivery, o fundo e o monograma permanecem neutros. Não é exibido qualquer sinal de parceria ou autorização das empresas.



## Ampliação proposta — 2.8.6 (revisão de 08/11/2026)

O catálogo passou de **26 para 49 opções** na branch de desenvolvimento da versão 2.8.6. São **39 serviços com SVG local** (13 símbolos Simple Icons mantidos e 26 mapeamentos adicionais de **Font Awesome Free Brands 6.7.2**). Entre os mapeamentos adicionais, três melhoram opções que antes usavam apenas iniciais: YouTube Premium, Google One e Microsoft 365. Esses três representam o símbolo da marca principal, sem afirmar que seja o ícone específico do plano/produto.

- Fonte da ampliação: Font Awesome Free Brands 6.7.2, pacote `@fortawesome/free-brands-svg-icons`, https://fontawesome.com/license/free. O conjunto de ícones de marca requer atribuição **CC BY 4.0** (código sob MIT conforme componente), mantida neste documento. Créditos: **Font Awesome (Fonticons, Inc.)**; https://fontawesome.com/ e https://creativecommons.org/licenses/by/4.0/. SVGs compilados como caminhos locais no arquivo `js/service-extra-brand-paths.js`.
- Os identificadores originais Simple Icons continuam sujeitos ao aviso de marcas e às diretrizes individuais. Nem CC0 nem CC BY 4.0 autorizam criar afiliação, endosso ou usar marcas em material promocional sem verificar as regras de cada titular.
- **Sem símbolo específico incorporado (10):** Disney+, Prime Video, Globoplay, 99Food, Plus Delivery, Rappi, 99, inDrive, Canva, ChatGPT. Mantêm-se as iniciais, sem assets externos de procedência incerta. Não são relatados como ícones quebrados: são placeholders intencionais.
- Nunca baixar logos automaticamente de links arbitrários de usuários: qualquer novo SVG recebido precisa passar por validação de procedência, licença, tamanho, ausência de scripts e ausência de referências externas. PNG/WebP também podem ser usados após revisão, preservando aspecto e sem expor dados dos usuários.
- Não alterar o catálogo de serviços existentes nem suas IDs em atualizações futuras; isso preserva títulos antigos. A seleção continua opcional e não cria lançamentos.

**Status:** a 2.8.6 é candidata, sem publicação ou homologação declarada neste registro. A 2.8.5 existente não é alterada diretamente pela branch.
