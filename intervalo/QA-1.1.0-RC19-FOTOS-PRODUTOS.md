# Intervalo — QA 1.1.0-rc.19 · Upload e prévia de fotos dos produtos

Data: 2026-11-16
Status: **código e armazenamento Supabase implementados; QA técnico aprovado; homologação visual Android e upload físico reais pendentes**.

## O que mudou

- Em **Gestão → Estoque e Produtos → Produtos**, os formulários **Cadastrar produto** e **Editar produto** agora mostram:
  - **Enviar foto**: seleção da galeria ou arquivos no celular.
  - **Câmera**: solicita câmera traseira por `capture="environment"` em navegadores compatíveis.
  - **Prévia** da foto ou do link selecionado, antes de salvar.
  - **Remover** a imagem atual ou selecionada, com confirmação efetivada ao salvar o formulário.
  - Opção recolhida **Ou usar um link de imagem (HTTPS)**, mantendo o campo anterior.
- `product-photo-rc19.js` confere o tipo de arquivo, limita arquivo de origem a **16 MB**, reamostra imagens com largura/altura máxima de **1.400 px**, converte para JPEG em qualidade decrescente (0,84/0,72/0,60) para ficar em **até 1.500.000 bytes**, e só então inicia o upload. Metadados EXIF não são reenviados no JPEG do Canvas.
- O endereço remoto inserido manualmente deve ser **HTTPS**, com até 1.200 caracteres e deve carregar como imagem direta pública em uma verificação de navegador (8,5 segundos). Links antigos salvos não são removidos automaticamente.
- Se houver foto selecionada, o formulário primeiro faz upload assinado e passa a URL pública a `restaurant-core`; os demais dados continuam passando pelas mesmas ações `product_create` e `product_update`.
- O visual usa componentes mobile-first dentro dos Bottom Sheets já existentes, preservando o fechamento e os botões atuais.
- Falhas na visualização de imagem existente exibem símbolo/texto substituto nos cards de Estoque, Cardápio e marketplace; o Garçom e o cardápio público já possuíam fallback.
- Nenhum modelo de produto, fluxo de pedido, estoque ou pagamento foi alterado.

## Backend / Segurança

- Migração `product_photo_storage_rc19` adicionou bucket **`intervalo-product-images`**.
- **Leitura pública** para imagens de produtos, com upload restrito por URL assinada; nenhuma policy permite gravação direta por `anon` ou `authenticated`.
- O bucket aceita apenas `image/jpeg` e limita cada objeto a **1.500.000 bytes**.
- Edge Function **`restaurant-product-photos`**, `verify_jwt=true`, ativa no Supabase.
- Para assinar upload, valida token do usuário, confirmação de conta como `restaurant-core`, restaurante ativo, membro ativo, perfil Master/Gerente, módulo Gestão habilitado e ausência de bloqueio individual. Emite caminho único `{restaurant_id}/{uuid}.jpg`, sem expor `service_role` no cliente.
- Limite de pedidos de token por membro e restaurante: até **12 por minuto** e **150 por dia**, usando `marketplace_rate_gate` no servidor.
- `supabase.storage.from('intervalo-product-images').uploadToSignedUrl` envia apenas o blob JPEG permitido pelo bucket.
- O valor `image_url` enviado ao produto é a URL pública retornada pelo servidor, ou a URL HTTPS direta já validada.
- Uploads antigos que não estiverem mais associados a produtos não são automaticamente excluídos do bucket nesta versão; esse comportamento exige rotina futura de limpeza com conferência de referências para evitar remover fotos em uso.

## QA técnico executado

1. Sintaxe JS de `product-photo-rc19.js`, `support.js`, `catalog.js` e entrypoint `index.html`: **OK**.
2. Vinte e uma verificações de integração frontend/servidor (câmera, galeria, prévia, remoção, redimensionamento, autorização, gravação de produto, fallback, versão e bloqueios): **21/21**.
3. Validador de URLs: HTTPS com link direto e query string aceito; HTTP, JavaScript URL, caracteres maliciosos e espaços recusados: **6/6**.
4. Teste simulado do Canvas: arquivo PNG original de 4 MB gerou JPEG de 340 KB no modelo de teste: **OK**. *Simulação sem imagem física, não valida navegador específico.*
5. Consulta ao bucket Supabase: `public=true`, limite 1.500.000 bytes, `allowed_mime_types=['image/jpeg']`: **OK**.
6. Consulta de policies Storage: **0 políticas de escrita disponíveis a `anon`/`authenticated`**. `service_role` pode usar `marketplace_rate_gate`.
7. Edge Function implantada, deploy retornou status `ACTIVE`, versão 1, com verificação de JWT.
8. `index.html` usa cache versão **1.1.0-rc.19** para `estoque`, `catalogo` e vitrine pública.

## Homologação pendente no Android

1. Abrir `https://gaveblue.com.br/intervalo/novo-mundo/estoque?aba=produtos` com Master ou gerente.
2. Em **Cadastrar produto**, selecionar **Enviar foto**, escolher JPG/PNG/WebP, conferir prévia e salvar. Conferir imagem em Estoque, Cardápio Público, Garçom e Loja Online.
3. Em **Editar produto**, tocar **Câmera**, tirar foto, conferir prévia e salvar. Conferir alteração em todas as telas.
4. Editar e **Remover** a foto (campo URL limpo), salvar, recarregar e confirmar placeholder.
5. Testar URL HTTPS de imagem direta (ex. PNG) e URL de página comum (Instagram/Drive), confirmando mensagem de falha antes de salvar.
6. Testar Android com arquivo acima de 16 MB, foto muito grande, conexão sem internet e ausência de permissão de câmera.
7. Validar ao salvar produto novo que preço, flags de cardápio e disponibilidade persistem.
8. Conferir que link antigo que não responde mostra fallback em vez de imagem quebrada.
9. Se o código ainda não aparecer no domínio, aguardar o processo normal de publicação/propagação e recarregar o PWA. Não declarar homologação visual sem teste real.

## Restrições

- Nova função usa recursos do projeto Supabase já existente, sem habilitar plano pago ou serviço externo. Os uploads **consomem a cota de Storage/transferência do projeto**.
- Câmera depende do suporte do navegador e da permissão do celular. HEIC/HEIF/AVIF dependem do decodificador do navegador; JPG, PNG e WebP são os formatos recomendados.
- O armazenamento aceita somente JPEG **após** o processamento no navegador; a origem pode ser PNG/WebP/etc.
- `service_role` e tokens internos não são enviados nem armazenados no GitHub frontend.
- Alterações estão no GitHub `main`; propagação para `gaveblue.com.br` e impressão/visualização em hardware não foram verificadas.
