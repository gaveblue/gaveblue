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

## Implementação do catálogo 2.8.6 após links oficiais fornecidos (08/11/2026)

**Obtido e salvo localmente (1):**
- `digital-chatgpt` → `assets/service-icons/chatgpt.svg`: vetor do emblema ChatGPT extraído de `edent/SuperTinyIcons/images/svg/chatgpt.svg`, https://github.com/edent/SuperTinyIcons . Repositório licenciado sob MIT, © Terence Eden; manter aviso de licença. A marca e o desenho são da OpenAI, cujas restrições individuais continuam válidas. Conferido contra a página oficial de referência https://help.openai.com/pt-br/articles/7905742-what-does-the-official-chatgpt-ios-app-icon-look-like . Fonte vetorial **terceirizada**, não o ZIP oficial de logos da OpenAI. O vetor original conserva desenho, proporção e as cores preto/branco.

**Links oficiais confirmados como fontes, mas sem asset local incorporado (9):**
- Disney+: https://press.disneyplus.com/about/logos
- Prime Video: https://assets.aboutamazon.com/26/c7/11fb9c044d14870a3154c90d9bf5/prime-video-landscape-logo-blue-rgb.png — arquivo horizontal, exigiria validação de variante quadrada ou ajuste em contain sem corte
- Globoplay: https://play.google.com/store/apps/details?id=com.globo.globotv — ícone de loja, download binário não validado
- 99Food: https://restaurantes.99app.com/repositorio/ — botão redireciona a material de terceiros/Drive, download não obtido
- Plus Delivery: https://arquivos.plusdelivery.com.br/ — marca exige cuidados de fundo/proporção; imagem em domínio oficial sem transferência concluída
- Rappi: https://play.google.com/store/apps/details?id=com.grability.rappi — imagem da loja, download binário não validado
- 99: https://99app.com/newsroom/brand-99.zip — ZIP não extraído
- inDrive: https://indrive.com/files/inDrive_Logo.zip — ZIP não extraído
- Canva: https://www.canva.dev/assets/connect/Canva-logos.zip — ZIP não extraído

**Controle de qualidade:** manter monogramas até que um arquivo SVG/PNG/WebP seja de fato incorporado ao repositório e testado, sem buscar imagens externas na execução. Validar não conter SVG ativo (scripts, links externos ou eventos), verificar termos de marca e preferir símbolo quadrado sem distorcer. O catálogo de IDs e valores financeiros não muda por falta desses arquivos.

## Arquivos recebidos do usuário (08/11/2026; revisão 2.8.6 build 2865)
- `delivery-plusdelivery`: arquivo local `assets/service-icons/plus-delivery.webp`, 160×160, derivado do PNG enviado no chat (imagem da identidade visual Plus Delivery).
- `delivery-99food`: `assets/service-icons/99food.png`, 261×258, bytes originais do PNG enviado no chat; marca escura exige fundo claro.
- `streaming-primevideo`: `assets/service-icons/prime-video.webp`, 128×39, versão local otimizada do PNG transparente enviado; **wordmark horizontal, não o ícone quadrado da plataforma**.
- `streaming-disney`: `assets/service-icons/disney-plus.webp`, 180×101, versão local otimizada do JPG enviado; **imagem horizontal ilustrativa do logo, não ícone quadrado do aplicativo**.

Recebimento das imagens pelo usuário não constitui, por si só, comprovação de licença de uso ou extração oficial. Referências oficiais fornecidas no chat estão documentadas anteriormente. Todos os arquivos são identificadores visuais de despesas, sem afiliação ou endosso dos proprietários das marcas.

**Verificação:** quatro hashes Git do blob coincidiram com os arquivos locais enviados; nenhum URL remoto é usado na interface. **Pendentes (5):** Globoplay, Rappi, 99, inDrive, Canva. A escolha visual final no modo claro/escuro precisa ser avaliada em aparelho Android antes da publicação.

## Ícones finais recebidos do responsável — 08/11/2026, build 2866
- `digital-canva` — `assets/service-icons/canva.webp`, imagem quadrada Canva.
- `mobility-indrive` — `assets/service-icons/indrive.webp`, imagem quadrada inDrive.
- `mobility-99` — `assets/service-icons/99.webp`, imagem quadrada 99.
- `delivery-rappi` — `assets/service-icons/rappi.webp`, imagem quadrada Rappi.
- `streaming-globoplay` — `assets/service-icons/globoplay.webp`, imagem quadrada Globoplay.

Todos transcodificados de arquivos enviados diretamente nesta conversa para WebP de 96×96, preservando a composição quadrada, cores e contraste. São identidades visuais fornecidas pelo usuário e não representam afiliação com essas empresas. O PWA não consulta URLs de marcas externas. A aplicação agora possui 49 serviços com recursos gráficos locais, incluindo os 39 SVGs vetoriais originais e 10 arquivos específicos.


## Arquivos fornecidos no chat — lote de 13 ícones (08/11/2026; candidata 2.8.7)

As imagens foram recebidas do usuário nesta conversa e **não redesenhadas**. O atlas compacto local `assets/service-icons/service-brands-287.webp` contém as versões proporcionais das imagens em 4 colunas × 4 linhas, células de 64 px, para uso como ícones de identificação de despesas no GB+. São logotipos de terceiros, sem afiliação ou endosso.

| Linha, coluna (base 0) | ID preservado ou criado | Nome | Operação |
|---|---|---|---|
| 0, 0 | `streaming-hbomax` | HBO Max | Atualiza |
| 0, 1 | `delivery-99food` | 99Food | Atualiza |
| 0, 2 | `streaming-primevideo` | Prime Video | Atualiza |
| 0, 3 | `shopping-tiktokshop` | TikTok Shop | Novo |
| 1, 0 | `social-whatsapp` | WhatsApp | Atualiza |
| 1, 1 | `shopping-shopee` | Shopee | Novo |
| 1, 2 | `shopping-mercadolivre` | Mercado Livre | Novo |
| 1, 3 | `social-telegram` | Telegram | Atualiza |
| 2, 0 | `music-spotify` | Spotify | Atualiza |
| 2, 1 | `shopping-magalu` | Magalu | Novo |
| 2, 2 | `shopping-casasbahia` | Casas Bahia | Novo |
| 2, 3 | `shopping-temu` | Temu | Novo |
| 3, 0 | `shopping-shein` | SHEIN | Novo |

As demais três células do atlas são vazias. O atlas é acessado exclusivamente por caminho relativo fixo. Antes da homologação visual, conferir legibilidade no tamanho mínimo usado pelo seletor (especialmente Magalu, SHEIN e Casas Bahia), nos temas claro e escuro, e se o navegador carrega o mesmo arquivo em modo offline após atualização do PWA.

A adição ao catálogo não representa um vínculo com as lojas nem autoriza uso promocional de suas marcas. A proveniência é a imagem enviada pelo titular do projeto, não um download separado certificado por cada marca.
